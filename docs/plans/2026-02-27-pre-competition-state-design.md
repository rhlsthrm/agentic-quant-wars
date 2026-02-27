# Pre-Competition State — Design

The dashboard currently has no proper pre-competition experience. When the competition hasn't started, data sections return `null` (invisible), the Hero countdown targets the wrong date, the Navbar shows "LIVE" unconditionally, and ReasoningLogs crashes on empty data.

This design fixes all bugs and gives every section a proper placeholder state so the page feels complete and intentional before competition begins.

## Competition State Model

Derive a `competitionState` in `page.tsx` from the `competition` object:

| State | Condition |
|-------|-----------|
| `'upcoming'` | `competition.start` is in the future |
| `'live'` | Now is between `start` and `end` |
| `'ended'` | Now is past `end` |
| `null` | No competition data available |

Computed once per render in `page.tsx`, passed as a prop where needed.

## Changes Per Component

### page.tsx
- Compute `competitionState` from `competition` timestamps.
- Pass `competitionState` to `Navbar`.
- Continue rendering all data sections even when `hasData` is false — components handle their own empty states.

### Hero.tsx — Fix Countdown
- `upcoming`: countdown targets `competition.start`, header "COMPETITION STARTS IN".
- `live`: countdown targets `competition.end`, header "TIME REMAINING".
- `ended`: hide countdown, show "Competition Ended" status.

### Navbar.tsx — Conditional Badge
- Accept `competitionState` prop.
- `live` → green dot + "LIVE".
- `upcoming` → amber/yellow dot + "UPCOMING".
- `ended` or `null` → hide badge entirely.

### Leaderboard.tsx — Starting Roster
- Remove `return null` guard.
- When `rankings` is empty: render all 5 agents from `AGENTS` registry with starting-state data (rank "—", starting capital as portfolio value, 0 PnL, 0 trades, no mini chart).
- Dimmed styling (opacity) with overlay message: "Waiting for competition to begin".

### PerformanceChart.tsx — Empty Frame
- Remove `return null` guard.
- When no agent data in chart: render chart container with axes and starting-capital baseline only.
- Centered overlay: "Chart will populate when trading begins".
- Show agent toggle buttons from `AGENTS` registry (all disabled/dimmed).

### AgentCards.tsx — Roster from Registry
- Remove `return null` guard.
- When `rankings` is empty: build cards from `AGENTS` registry with name, model, strategy, starting capital placeholder, 0 trades, 0% PnL, no chart.
- Cards slightly dimmed.

### TradeFeed.tsx — Clean Stats Bar
- When `agentData` is empty: show all agents from `AGENTS` registry in the stats bar with "0 trades" instead of rendering nothing.

### ReasoningLogs.tsx — Fix Crash + Show Tabs
- When `agentData` is empty: show all agent tabs from `AGENTS` registry.
- Terminal header renders selected agent's name/strategy/personality from `AGENTS` config (not from `agentData`).
- Terminal body: "Waiting for competition to begin".
- "LIVE" badge in terminal only shows when competition is live.

## Files Touched

| File | Type of Change |
|------|---------------|
| `app/page.tsx` | Add competitionState, pass to Navbar, keep rendering all sections |
| `app/components/Hero.tsx` | Fix countdown target logic |
| `app/components/Navbar.tsx` | Accept prop, conditional badge styling |
| `app/components/Leaderboard.tsx` | Remove null guard, add pre-competition roster |
| `app/components/PerformanceChart.tsx` | Remove null guard, add empty chart overlay |
| `app/components/AgentCards.tsx` | Remove null guard, build from AGENTS registry |
| `app/components/TradeFeed.tsx` | Fix empty stats bar |
| `app/components/ReasoningLogs.tsx` | Fix crash, show all tabs, conditional LIVE badge |

## Not Changed

- `app/api/agents/route.ts` — no API changes needed. Components handle empty state using `AGENTS` registry.
- `app/data/agents.ts` — agent metadata already has everything needed.
- CSS files — minimal additions for dimmed/overlay states, done inline or with small class additions.
