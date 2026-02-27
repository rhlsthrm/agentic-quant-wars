# Progressive Loading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the single `/api/agents` endpoint into `/api/agents/summary` (fast, above-the-fold) and `/api/agents/history` (lazy, below-the-fold) so the page renders meaningful content in ~1-3s instead of ~5-10s.

**Architecture:** Two independent API routes with separate caches. The client fetches summary first, renders leaderboard/chart/cards, then fetches history to populate TradeFeed and ReasoningLogs. Both poll at 30s.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, pure CSS

**Design doc:** `docs/plans/2026-02-27-progressive-loading-design.md`

---

### Task 1: Add new types for history response

**Files:**
- Modify: `app/types/index.ts`

**Step 1: Add types**

Add at the end of `app/types/index.ts`, before the closing of the file:

```ts
export interface AgentHistoryData {
  trades: Trade[];
  reasoningLogs: ReasoningLog[];
}

export interface AgentsHistoryResponse {
  agentHistory: Record<string, AgentHistoryData>;
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Compiles with no errors.

**Step 3: Commit**

```bash
git add app/types/index.ts
git commit -m "feat: add AgentsHistoryResponse type for split API"
```

---

### Task 2: Extract shared helpers from existing route

The existing `app/api/agents/route.ts` has helpers (`getAgentUrl`, `toHourOffset`, agent URL map, cache logic) that both new routes need. Extract them into a shared module.

**Files:**
- Create: `app/api/agents/shared.ts`
- Modify: `app/api/agents/route.ts` (import from shared)

**Step 1: Create shared module**

Create `app/api/agents/shared.ts` with the following contents extracted from `route.ts`:

```ts
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
  grok: 'AGENT_GROK_URL',
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

  return { trades, reasoningLogs };
}
```

**Step 2: Update existing route to import from shared**

Replace the full contents of `app/api/agents/route.ts` with:

```ts
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
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Compiles with no errors. Existing `/api/agents` still works identically.

**Step 4: Commit**

```bash
git add app/api/agents/shared.ts app/api/agents/route.ts
git commit -m "refactor: extract shared helpers from agents route"
```

---

### Task 3: Create `/api/agents/summary` route

**Files:**
- Create: `app/api/agents/summary/route.ts`

**Step 1: Create the summary route**

Create `app/api/agents/summary/route.ts`:

```ts
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
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Compiles. New route at `/api/agents/summary`.

**Step 3: Commit**

```bash
git add app/api/agents/summary/route.ts
git commit -m "feat: add /api/agents/summary endpoint (dashboard only)"
```

---

### Task 4: Create `/api/agents/history` route

**Files:**
- Create: `app/api/agents/history/route.ts`

**Step 1: Create the history route**

Create `app/api/agents/history/route.ts`:

```ts
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
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Compiles. New route at `/api/agents/history`.

**Step 3: Commit**

```bash
git add app/api/agents/history/route.ts
git commit -m "feat: add /api/agents/history endpoint (trades + reasoning)"
```

---

### Task 5: Add loading prop to TradeFeed and ReasoningLogs

**Files:**
- Modify: `app/components/TradeFeed.tsx`
- Modify: `app/components/ReasoningLogs.tsx`

**Step 1: Add loading state to TradeFeed**

In `app/components/TradeFeed.tsx`, update the props interface and add a loading state:

Change the interface from:
```ts
interface TradeFeedProps {
  agentData: Record<string, AgentData>;
}
```
To:
```ts
interface TradeFeedProps {
  agentData: Record<string, AgentData>;
  loading?: boolean;
}
```

Change the function signature from:
```ts
export default function TradeFeed({ agentData }: TradeFeedProps) {
```
To:
```ts
export default function TradeFeed({ agentData, loading }: TradeFeedProps) {
```

Inside the `<div className="feed-list">`, replace the existing empty-state check:
```tsx
          {allTrades.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No trades yet — waiting for agents to execute...
            </div>
          )}
```

With:
```tsx
          {loading && allTrades.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              Loading trade history...
            </div>
          )}
          {!loading && allTrades.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No trades yet — waiting for agents to execute...
            </div>
          )}
```

**Step 2: Add loading state to ReasoningLogs**

In `app/components/ReasoningLogs.tsx`, update the props interface:

Change:
```ts
interface ReasoningLogsProps {
  agentData: Record<string, AgentData>;
}
```
To:
```ts
interface ReasoningLogsProps {
  agentData: Record<string, AgentData>;
  loading?: boolean;
}
```

Change:
```ts
export default function ReasoningLogs({ agentData }: ReasoningLogsProps) {
```
To:
```ts
export default function ReasoningLogs({ agentData, loading }: ReasoningLogsProps) {
```

Replace the empty-state inside `<div className="term-output">`:
```tsx
          {logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {agent
                ? 'No reasoning logs yet — waiting for agent cycles...'
                : 'Waiting for competition to begin — agent reasoning will appear here'}
            </div>
          )}
```

With:
```tsx
          {loading && logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              Loading reasoning logs...
            </div>
          )}
          {!loading && logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {agent
                ? 'No reasoning logs yet — waiting for agent cycles...'
                : 'Waiting for competition to begin — agent reasoning will appear here'}
            </div>
          )}
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Compiles. The `loading` prop is optional, so existing usage (without it) still works.

**Step 4: Commit**

```bash
git add app/components/TradeFeed.tsx app/components/ReasoningLogs.tsx
git commit -m "feat: add loading prop to TradeFeed and ReasoningLogs"
```

---

### Task 6: Update page.tsx for two-phase loading

**Files:**
- Modify: `app/page.tsx`

**Step 1: Rewrite the data fetching logic**

Replace the entire contents of `app/page.tsx` with:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentsResponse, AgentsHistoryResponse, CompetitionState } from '@/app/types';
import Navbar from '@/app/components/Navbar';
import TickerBar from '@/app/components/TickerBar';
import Hero from '@/app/components/Hero';
import Leaderboard from '@/app/components/Leaderboard';
import AgentCards from '@/app/components/AgentCards';
import TradeFeed from '@/app/components/TradeFeed';
import PerformanceChart from '@/app/components/PerformanceChart';
import ReasoningLogs from '@/app/components/ReasoningLogs';
import PredictSection from '@/app/components/PredictSection';
import HowItWorks from '@/app/components/HowItWorks';
import Footer from '@/app/components/Footer';
import LoadingSkeleton from '@/app/components/LoadingSkeleton';

const POLL_INTERVAL_MS = 30_000;

export default function Page() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/summary');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: AgentsResponse = await res.json();
      return json;
    } catch {
      return null;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/history');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: AgentsHistoryResponse = await res.json();
      return json;
    } catch {
      return null;
    }
  }, []);

  const mergeHistory = useCallback(
    (summary: AgentsResponse, history: AgentsHistoryResponse): AgentsResponse => {
      const merged = { ...summary, agentData: { ...summary.agentData } };
      for (const [id, histData] of Object.entries(history.agentHistory)) {
        if (merged.agentData[id]) {
          merged.agentData[id] = {
            ...merged.agentData[id],
            trades: histData.trades,
            reasoningLogs: histData.reasoningLogs,
          };
        }
      }
      // Re-build rankings array to reflect merged data
      merged.rankings = Object.values(merged.agentData).sort(
        (a, b) => b.portfolio.totalValue - a.portfolio.totalValue,
      );
      return merged;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      // Phase 1: summary (fast)
      const summary = await fetchSummary();
      if (cancelled) return;

      if (summary) {
        setData((prev) => {
          // If we already have history data, preserve it
          if (prev && prev.agentData) {
            const hasHistory = Object.values(prev.agentData).some(
              (a) => a.trades.length > 0 || a.reasoningLogs.length > 0,
            );
            if (hasHistory) {
              return mergeHistory(summary, {
                agentHistory: Object.fromEntries(
                  Object.entries(prev.agentData).map(([id, a]) => [
                    id,
                    { trades: a.trades, reasoningLogs: a.reasoningLogs },
                  ]),
                ),
              });
            }
          }
          return summary;
        });
        setLoading(false);
      } else if (!data) {
        setLoading(false);
      }

      // Phase 2: history (lazy)
      const history = await fetchHistory();
      if (cancelled) return;

      if (history && summary) {
        setData((prev) => {
          if (!prev) return prev;
          return mergeHistory(prev, history);
        });
      }
      setHistoryLoading(false);
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="app">
        <div className="app-bg">
          <div className="app-bg-gradient" />
          <div className="app-bg-stars1" />
          <div className="app-bg-stars2" />
          <div className="app-bg-glow" />
          <div className="app-bg-grid" />
        </div>
        <div className="app-header-blur" />
        <div className="app-noise" />
        <Navbar competitionState={null} />
        <LoadingSkeleton />
      </div>
    );
  }

  const hasData = data && data.live && Object.keys(data.agentData).length > 0;
  const agentData = hasData ? data.agentData : {};
  const rankings = hasData ? data.rankings : [];
  const tokenPrices = data?.tokenPrices ?? {};
  const competition = data?.competition ?? null;

  const competitionState: CompetitionState | null = (() => {
    if (!competition) return null;
    const now = Date.now();
    const start = new Date(competition.start).getTime();
    const end = new Date(competition.end).getTime();
    if (now < start) return 'upcoming';
    if (now <= end) return 'live';
    return 'ended';
  })();

  return (
    <div className="app">
      <div className="app-bg">
        <div className="app-bg-gradient" />
        <div className="app-bg-stars1" />
        <div className="app-bg-stars2" />
        <div className="app-bg-glow" />
        <div className="app-bg-grid" />
      </div>

      <div className="app-header-blur" />
      <div className="app-noise" />

      <Navbar competitionState={competitionState} />
      <TickerBar tokenPrices={tokenPrices} />

      <main className="app-main">
        <Hero rankings={rankings} competition={competition} />
        <div className="divider" />
        <Leaderboard rankings={rankings} />
        <div className="divider" />
        <div id="trajectories">
          <PerformanceChart agentData={agentData} durationHours={competition?.durationHours ?? 168} startingCapital={competition?.startingCapital ?? 100} />
        </div>
        <div className="divider" />
        <AgentCards rankings={rankings} />
        <div className="divider" />
        <div id="feed">
          <TradeFeed agentData={agentData} loading={historyLoading} />
        </div>
        <div className="divider" />
        <div id="reasoning">
          <ReasoningLogs agentData={agentData} loading={historyLoading} />
        </div>
        <div className="divider" />
        <PredictSection />
        <div className="divider" />
        <HowItWorks />
        <Footer />
      </main>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Compiles with no errors.

**Step 3: Smoke test locally**

Run: `pnpm dev`
Expected: Page loads, shows skeleton briefly, then leaderboard/chart/cards appear. TradeFeed and ReasoningLogs show "Loading..." then populate. Verify in browser Network tab that `/api/agents/summary` completes before `/api/agents/history`.

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: two-phase loading — summary first, history lazy"
```

---

### Task 7: Remove old `/api/agents` endpoint

**Files:**
- Delete: `app/api/agents/route.ts`

**Step 1: Delete the old route**

Remove `app/api/agents/route.ts`. The new summary and history routes replace it entirely.

**Step 2: Search for any remaining references**

Search the codebase for `/api/agents` (without `/summary` or `/history`) to ensure nothing still calls the old endpoint. The only references should be in the design docs.

**Step 3: Verify build**

Run: `pnpm build`
Expected: Compiles with no errors.

**Step 4: Commit**

```bash
git rm app/api/agents/route.ts
git commit -m "chore: remove old monolithic /api/agents endpoint"
```

---

### Task 8: Final verification

**Step 1: Full build**

Run: `pnpm build`
Expected: Clean build, no warnings.

**Step 2: Test locally**

Run: `pnpm dev`
Verify:
- Page loads faster (above-the-fold content visible before history loads)
- Leaderboard, chart, agent cards render correctly
- TradeFeed shows "Loading trade history..." then populates
- ReasoningLogs shows "Loading reasoning logs..." then populates
- After 30s, polling refreshes both datasets

**Step 3: Push**

```bash
git push origin master
```
