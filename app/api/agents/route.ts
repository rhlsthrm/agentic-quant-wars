import { NextResponse } from 'next/server';
import { AGENTS } from '@/app/data/agents';
import type {
  AgentConfig,
  AgentData,
  AgentDashboardResponse,
  AgentHistoryCycle,
  AgentsResponse,
  Trade,
  ReasoningLog,
  PortfolioSnapshot,
} from '@/app/types';

const AGENT_URL_MAP: Record<string, string> = {
  gpt: 'AGENT_GPT_URL',
  claude: 'AGENT_CLAUDE_URL',
  gemini: 'AGENT_GEMINI_URL',
  grok: 'AGENT_GROK_URL',
  glm: 'AGENT_GLM_URL',
};

function getAgentUrl(agentId: string): string | null {
  const envKey = AGENT_URL_MAP[agentId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

async function fetchAgent(
  agent: AgentConfig,
): Promise<{ dashboard: AgentDashboardResponse; history: AgentHistoryCycle[] } | null> {
  const url = getAgentUrl(agent.id);
  if (!url) return null;

  const base = url.replace(/\/+$/, '');
  try {
    const [dashRes, histRes] = await Promise.all([
      fetch(`${base}/api/dashboard`, { next: { revalidate: 0 } }),
      fetch(`${base}/api/history?limit=500`, { next: { revalidate: 0 } }),
    ]);
    if (!dashRes.ok || !histRes.ok) return null;
    const dashboard: AgentDashboardResponse = await dashRes.json();
    const history: AgentHistoryCycle[] = await histRes.json();
    return { dashboard, history };
  } catch {
    return null;
  }
}

function toHourOffset(timestamp: string, competitionStart: Date, durationHours: number): number {
  const ms = new Date(timestamp).getTime() - competitionStart.getTime();
  const hours = Math.max(0, Math.round(ms / 3600000));
  return Math.min(hours, durationHours);
}

function transformAgent(
  agent: AgentConfig,
  { dashboard, history }: { dashboard: AgentDashboardResponse; history: AgentHistoryCycle[] },
): Omit<AgentData, 'rank'> {
  const competitionStart = dashboard.info.competitionStart
    ? new Date(dashboard.info.competitionStart)
    : new Date(dashboard.info.startedAt);
  const durationHours = (dashboard.info.competitionDurationDays || 7) * 24;

  const portfolio = {
    cash: dashboard.portfolio?.cash ?? 0,
    totalValue: dashboard.portfolio?.totalUsd ?? dashboard.info.startingCapital,
    pnl: dashboard.metrics?.pnl ?? 0,
    pnlPct: dashboard.metrics?.pnlPct ?? 0,
    maxDrawdown: dashboard.metrics?.maxDrawdown ?? 0,
    sharpeRatio: dashboard.metrics?.sharpeRatio ?? 0,
    totalTrades: dashboard.stats?.totalTrades ?? 0,
    holdings: (dashboard.portfolio?.positions ?? [])
      .filter((p) => p.token !== 'native')
      .map((p) => ({
        symbol: p.symbol,
        name: p.symbol,
        tokens: parseFloat(p.balance),
        avgCost: 0,
        currentPrice: p.priceUsd,
        value: Math.round(p.balanceUsd * 100) / 100,
        pnl: 0,
        pnlPct: 0,
      })),
  };

  const trades: Trade[] = [];
  const reasoningLogs: ReasoningLog[] = [];

  const chronological = [...history].reverse();

  for (const cycle of chronological) {
    const hour = toHourOffset(cycle.timestamp, competitionStart, durationHours);
    let hadValidTrade = false;

    for (const trade of cycle.trades || []) {
      if (trade.amount_usd <= 0 || trade.status === 'failed') continue;
      hadValidTrade = true;

      const symbol = trade.type === 'SELL' ? trade.fromSymbol : trade.toSymbol;
      trades.push({
        type: trade.type as 'BUY' | 'SELL',
        stock: symbol,
        stockName: symbol,
        sector: '',
        tokens: trade.executed_price
          ? parseFloat((trade.amount_usd / trade.executed_price).toFixed(6))
          : 0,
        price: trade.executed_price ?? 0,
        value: Math.round(trade.amount_usd * 100) / 100,
        hour,
        timestamp: hour,
        reasoning: trade.rationale || trade.summary,
      });

      reasoningLogs.push({
        hour,
        text: trade.rationale || trade.summary,
        trade: `${trade.type} ${symbol} for $${Math.round(trade.amount_usd)}`,
      });
    }

    if (!hadValidTrade && cycle.reasoning) {
      let text: string;
      const reasoning = cycle.reasoning as Record<string, unknown>;
      if (typeof cycle.reasoning === 'string') {
        text = cycle.reasoning;
      } else if (
        typeof (reasoning.marketAnalysis as Record<string, unknown>)?.overview === 'string'
      ) {
        text = (reasoning.marketAnalysis as Record<string, unknown>).overview as string;
      } else if (typeof reasoning.summary === 'string') {
        text = reasoning.summary as string;
      } else {
        text = JSON.stringify(cycle.reasoning).slice(0, 200);
      }
      reasoningLogs.push({
        hour,
        text,
        trade: 'No trade this cycle',
      });
    }
  }

  const sparsePoints = (dashboard.portfolioHistory || []).map((p) => ({
    hour: toHourOffset(p.timestamp, competitionStart, durationHours),
    value: p.value,
  }));

  const maxHour =
    sparsePoints.length > 0
      ? Math.min(durationHours, Math.max(...sparsePoints.map((p) => p.hour)))
      : 0;

  const portfolioHistory: PortfolioSnapshot[] = [];
  let lastValue = dashboard.info.startingCapital;
  let sparseIdx = 0;

  for (let h = 0; h <= maxHour; h++) {
    while (sparseIdx < sparsePoints.length && sparsePoints[sparseIdx].hour <= h) {
      lastValue = sparsePoints[sparseIdx].value;
      sparseIdx++;
    }
    portfolioHistory.push({ hour: h, value: lastValue, cash: 0 });
  }

  // Override totalValue with last portfolioHistory point — dashboard.portfolio.totalUsd
  // can be stale/inconsistent, but portfolioHistory is derived from the same source as PnL
  if (portfolioHistory.length > 0) {
    portfolio.totalValue = portfolioHistory[portfolioHistory.length - 1].value;
  }

  return {
    ...agent,
    portfolio,
    trades,
    reasoningLogs,
    portfolioHistory,
  };
}

// ── In-memory cache ──────────────────────────────────────
let cachedResponse: AgentsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 25_000; // shorter than 30s client poll

function buildResponse(
  fetched: { agent: AgentConfig; data: Awaited<ReturnType<typeof fetchAgent>> }[],
): AgentsResponse {
  const agentData: Record<string, AgentData> = {};
  let competition: AgentsResponse['competition'] = null;

  for (const { agent, data } of fetched) {
    if (!data) continue;

    if (!competition) {
      const info = data.dashboard.info;
      const start = info.competitionStart || info.startedAt;
      const durationHours = (info.competitionDurationDays || 7) * 24;
      const end = new Date(new Date(start).getTime() + durationHours * 3600000).toISOString();
      competition = { start, end, durationHours, startingCapital: info.startingCapital };
    }

    const result = transformAgent(agent, data);
    agentData[result.id] = { ...result, rank: 0 };
  }

  const rankings = Object.values(agentData).sort(
    (a, b) => b.portfolio.totalValue - a.portfolio.totalValue,
  );
  rankings.forEach((agent, i) => {
    agentData[agent.id].rank = i + 1;
  });

  const tokenPrices: Record<string, number> = {};
  for (const agent of Object.values(agentData)) {
    for (const h of agent.portfolio.holdings) {
      if (h.currentPrice > 0) {
        tokenPrices[h.symbol] = h.currentPrice;
      }
    }
  }

  return { agentData, tokenPrices, rankings, competition, live: true };
}

export async function GET(): Promise<NextResponse<AgentsResponse>> {
  // Serve fresh cache immediately
  if (cachedResponse && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse);
  }

  const liveAgents = AGENTS.filter((a) => getAgentUrl(a.id));

  if (liveAgents.length === 0) {
    return NextResponse.json({
      agentData: {},
      tokenPrices: {},
      rankings: [],
      competition: null,
      live: false,
    });
  }

  const fetched = await Promise.all(
    liveAgents.map(async (agent) => {
      const data = await fetchAgent(agent);
      return { agent, data };
    }),
  );

  const hasAnyData = fetched.some((f) => f.data !== null);

  if (hasAnyData) {
    const response = buildResponse(fetched);
    cachedResponse = response;
    cacheTimestamp = Date.now();
    return NextResponse.json(response);
  }

  // All fetches failed — return stale cache if available (graceful degradation)
  if (cachedResponse) {
    return NextResponse.json(cachedResponse);
  }

  return NextResponse.json({
    agentData: {},
    tokenPrices: {},
    rankings: [],
    competition: null,
    live: false,
  });
}
