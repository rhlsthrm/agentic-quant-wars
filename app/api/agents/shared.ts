import { AGENTS } from '@/app/data/agents';
import type {
  AgentConfig,
  AgentDashboardResponse,
  AgentHistoryCycle,
  Trade,
  ReasoningLog,
  PortfolioSnapshot,
  AgentData,
} from '@/app/types';

export const AGENT_URL_MAP: Record<string, string> = {
  gpt: 'AGENT_GPT_URL',
  claude: 'AGENT_CLAUDE_URL',
  gemini: 'AGENT_GEMINI_URL',
  minimax: 'AGENT_MINIMAX_URL',
  glm: 'AGENT_GLM_URL',
};

export function getAgentUrl(agentId: string): string | null {
  const envKey = AGENT_URL_MAP[agentId];
  if (!envKey) return null;
  return process.env[envKey] || null;
}

export function getLiveAgents(): AgentConfig[] {
  return AGENTS.filter((a) => getAgentUrl(a.id));
}

export function toHourOffset(timestamp: string, competitionStart: Date, durationHours: number): number {
  const ms = new Date(timestamp).getTime() - competitionStart.getTime();
  const hours = Math.max(0, Math.round(ms / 3600000));
  return Math.min(hours, durationHours);
}

export function transformDashboard(
  agent: AgentConfig,
  dashboard: AgentDashboardResponse,
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

  if (portfolioHistory.length > 0) {
    portfolio.totalValue = portfolioHistory[portfolioHistory.length - 1].value;
  }

  return {
    ...agent,
    walletAddress: dashboard.info.walletAddress || null,
    portfolio,
    trades: [],
    reasoningLogs: [],
    portfolioHistory,
  };
}

const JUNK_REASONING = [
  '[SYNTHETIC]',
  'No agent reasoning text was provided',
  'No agent cycle transcript/log was provided',
];
const isJunkReasoning = (t: string) => JUNK_REASONING.some((p) => t.includes(p));

export function transformHistory(
  dashboard: AgentDashboardResponse,
  history: AgentHistoryCycle[],
): { trades: Trade[]; reasoningLogs: ReasoningLog[] } {
  const competitionStart = dashboard.info.competitionStart
    ? new Date(dashboard.info.competitionStart)
    : new Date(dashboard.info.startedAt);
  const durationHours = (dashboard.info.competitionDurationDays || 7) * 24;

  const trades: Trade[] = [];
  const reasoningLogs: ReasoningLog[] = [];
  const chronological = [...history].reverse();

  for (const cycle of chronological) {
    const hour = toHourOffset(cycle.timestamp, competitionStart, durationHours);
    const realTimestamp = new Date(cycle.timestamp).getTime();
    let hadValidTrade = false;

    for (const trade of cycle.trades || []) {
      if (trade.amount_usd <= 0 || trade.status === 'failed') continue;
      hadValidTrade = true;

      const symbol = trade.type === 'SELL' ? trade.fromSymbol : trade.toSymbol;
      const rawReasoning = trade.rationale || trade.summary;
      const reasoning = rawReasoning && isJunkReasoning(rawReasoning) ? 'Analysis unavailable' : rawReasoning;

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
        timestamp: realTimestamp,
        reasoning,
      });

      if (!isJunkReasoning(rawReasoning || '')) {
        reasoningLogs.push({
          hour,
          timestamp: realTimestamp,
          text: rawReasoning,
          trade: `${trade.type} ${symbol} for $${Math.round(trade.amount_usd)}`,
        });
      }
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
      if (!isJunkReasoning(text)) {
        reasoningLogs.push({
          hour,
          timestamp: realTimestamp,
          text,
          trade: 'No trade this cycle',
        });
      }
    }
  }

  return { trades, reasoningLogs };
}
