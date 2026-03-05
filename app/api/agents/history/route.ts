import { NextResponse } from 'next/server';
import type {
  AgentConfig,
  AgentDashboardResponse,
  AgentHistoryCycle,
  AgentsHistoryResponse,
} from '@/app/types';
import { getAgentUrl, getLiveAgents, transformHistory } from '../shared';

async function fetchAgentHistory(
  agent: AgentConfig,
): Promise<{ dashboard: AgentDashboardResponse; history: AgentHistoryCycle[] } | null> {
  const url = getAgentUrl(agent.id);
  if (!url) return null;

  const base = url.replace(/\/+$/, '');
  try {
    // Need dashboard for competitionStart/durationDays to compute hour offsets
    const [dashRes, histRes] = await Promise.all([
      fetch(`${base}/api/dashboard`, { next: { revalidate: 0 } }),
      fetch(`${base}/api/history?limit=500&reasoning=true`, { next: { revalidate: 0 } }),
    ]);
    if (!dashRes.ok || !histRes.ok) return null;
    const dashboard: AgentDashboardResponse = await dashRes.json();
    const history: AgentHistoryCycle[] = await histRes.json();
    return { dashboard, history };
  } catch {
    return null;
  }
}

let cachedResponse: AgentsHistoryResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 25_000;

export async function GET(): Promise<NextResponse<AgentsHistoryResponse>> {
  if (cachedResponse && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse);
  }

  const liveAgents = getLiveAgents();

  if (liveAgents.length === 0) {
    return NextResponse.json({ agentHistory: {} });
  }

  const fetched = await Promise.all(
    liveAgents.map(async (agent) => {
      const data = await fetchAgentHistory(agent);
      return { agent, data };
    }),
  );

  const agentHistory: AgentsHistoryResponse['agentHistory'] = {};

  for (const { agent, data } of fetched) {
    if (!data) continue;
    agentHistory[agent.id] = transformHistory(data.dashboard, data.history);
  }

  const response: AgentsHistoryResponse = { agentHistory };

  if (Object.keys(agentHistory).length > 0) {
    cachedResponse = response;
    cacheTimestamp = Date.now();
  }

  if (Object.keys(agentHistory).length === 0 && cachedResponse) {
    return NextResponse.json(cachedResponse);
  }

  return NextResponse.json(response);
}
