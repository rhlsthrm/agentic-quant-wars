import { NextResponse } from 'next/server';
import type { AgentConfig, AgentDashboardResponse, AgentData, AgentsResponse } from '@/app/types';
import { getAgentUrl, getLiveAgents, transformDashboard } from '../shared';

async function fetchDashboard(agent: AgentConfig): Promise<AgentDashboardResponse | null> {
  const url = getAgentUrl(agent.id);
  if (!url) return null;

  const base = url.replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/dashboard`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

let cachedResponse: AgentsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 25_000;

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
      const dashboard = await fetchDashboard(agent);
      return { agent, dashboard };
    }),
  );

  const agentData: Record<string, AgentData> = {};
  let competition: AgentsResponse['competition'] = null;

  for (const { agent, dashboard } of fetched) {
    if (!dashboard) continue;

    if (!competition) {
      const info = dashboard.info;
      const start = info.competitionStart || info.startedAt;
      const durationHours = (info.competitionDurationDays || 7) * 24;
      const end = new Date(new Date(start).getTime() + durationHours * 3600000).toISOString();
      competition = { start, end, durationHours, startingCapital: info.startingCapital };
    }

    const result = transformDashboard(agent, dashboard);
    agentData[result.id] = { ...result, rank: 0 };
  }

  const hasAnyData = Object.keys(agentData).length > 0;

  if (hasAnyData) {
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

    const response: AgentsResponse = { agentData, tokenPrices, rankings, competition, live: true };
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
