# Progressive Loading — Split API Design

## Problem

Initial page load blocks on a single `/api/agents` endpoint that fetches both `/api/dashboard` and `/api/history?limit=500` from every trading agent. The `/api/history` call is expensive (N+1 DB queries, 500 cycles of trades and reasoning) but only feeds TradeFeed and ReasoningLogs — sections below the fold. The page shows a skeleton until all data arrives.

## Solution

Split `/api/agents` into two endpoints with different latency profiles. Render the page progressively: above-the-fold content first, below-the-fold content lazily.

## New Endpoints

### `/api/agents/summary` (fast)

Fetches only `/api/dashboard` from each trading agent. Returns the existing `AgentsResponse` shape with `trades: []` and `reasoningLogs: []` per agent. Contains everything needed for Hero, Leaderboard, PerformanceChart, and AgentCards.

Cache: 25s TTL with stale-on-failure (same as today).

### `/api/agents/history` (lazy)

Fetches only `/api/history?limit=500` from each trading agent. Returns `AgentsHistoryResponse` — a map of agent ID to `{ trades, reasoningLogs }`.

Cache: 25s TTL independently.

## New Types

```ts
interface AgentHistoryData {
  trades: Trade[];
  reasoningLogs: ReasoningLog[];
}

interface AgentsHistoryResponse {
  agentHistory: Record<string, AgentHistoryData>;
}
```

## Client Loading Phases

```
Phase 1: fetch('/api/agents/summary')
  → setData(summary)
  → render Hero, Leaderboard, Chart, AgentCards
  → TradeFeed + ReasoningLogs show inline loading state

Phase 2: fetch('/api/agents/history')
  → merge trades/reasoningLogs into agentData
  → TradeFeed + ReasoningLogs render with full data
```

Phase 2 starts immediately after Phase 1 completes. Polling continues at 30s for both, staggered slightly.

## What Changes

| Area | Change |
|------|--------|
| `app/api/agents/summary/route.ts` | New file — fetches `/api/dashboard` only, transforms, caches |
| `app/api/agents/history/route.ts` | New file — fetches `/api/history` only, transforms, caches |
| `app/api/agents/route.ts` | Remove after migration |
| `app/types/index.ts` | Add `AgentHistoryData`, `AgentsHistoryResponse` |
| `app/page.tsx` | Two-phase fetch, merge state, inline loading for trade/reasoning sections |
| `app/components/TradeFeed.tsx` | Accept optional loading prop for inline skeleton |
| `app/components/ReasoningLogs.tsx` | Accept optional loading prop for inline skeleton |

## What Stays the Same

- All component props and rendering logic (already handle empty arrays)
- Skeleton loader (still shows on initial load before Phase 1 completes)
- Agent config, env vars, data flow within components
- Trading agent API (no changes needed in this phase)

## Expected Impact

- Above-the-fold render: ~1-3s (down from ~5-10s) — skips the expensive history fetch entirely
- Below-the-fold content: loads ~3-8s after page is already interactive
- Net effect: users see meaningful content immediately instead of a skeleton for the full duration
