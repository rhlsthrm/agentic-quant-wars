import { NextResponse } from 'next/server';
import type {
  AgentConfig,
  AgentDashboardResponse,
  AgentHistoryCycle,
  AgentData,
  AgentsResponse,
} from '@/app/types';
import { getAgentUrl, getLiveAgents, transformDashboard, transformHistory } from './shared';

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

// ── In-memory cache ──────────────────────────────────────
let cachedResponse: AgentsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 25_000;

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

    const base = transformDashboard(agent, data.dashboard);
    const { trades, reasoningLogs } = transformHistory(data.dashboard, data.history);
    agentData[agent.id] = { ...base, trades, reasoningLogs, rank: 0 };
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
  if (cachedResponse && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse);
  }

  const liveAgents = getLiveAgents();

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
