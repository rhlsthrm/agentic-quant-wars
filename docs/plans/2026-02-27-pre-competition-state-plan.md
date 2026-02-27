# Pre-Competition State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give the dashboard a complete, intentional pre-competition experience — fix countdown bug, conditional Navbar badge, and proper placeholder states for all data sections.

**Architecture:** Derive a `competitionState` type in `page.tsx` from competition timestamps, pass it where needed. Each component handles its own empty state using the static `AGENTS` registry for metadata. No API changes.

**Tech Stack:** Next.js 15, React 19, Framer Motion, Recharts, Pure CSS (no Tailwind/modules)

---

### Task 1: Add CompetitionState type and derive it in page.tsx

**Files:**
- Modify: `app/types/index.ts` (add type at bottom)
- Modify: `app/page.tsx:61-71` (add derivation, pass to Navbar)

**Step 1: Add type to types/index.ts**

Add at the end of the file:

```typescript
export type CompetitionState = 'upcoming' | 'live' | 'ended';
```

**Step 2: Update page.tsx — derive competitionState and pass to Navbar**

Replace lines 67-71 with:

```typescript
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
```

Add import for `CompetitionState` at the top:

```typescript
import type { AgentsResponse, CompetitionState } from '@/app/types';
```

Update loading-state Navbar (line 61) and main Navbar (line 86):

```typescript
<Navbar competitionState={null} />   // loading state
<Navbar competitionState={competitionState} />  // main render
```

**Step 3: Build and verify no type errors**

Run: `pnpm build`
Expected: Build succeeds (Navbar will warn about unused prop — that's fine, fixed in Task 2)

**Step 4: Commit**

```
feat: add CompetitionState type and derivation in page.tsx
```

---

### Task 2: Fix Navbar badge — conditional LIVE/UPCOMING

**Files:**
- Modify: `app/components/Navbar.tsx:35-83`
- Modify: `app/components/Navbar.css:76-97`

**Step 1: Update Navbar.tsx to accept and use competitionState**

Add import and update the component:

```typescript
import type { CompetitionState } from '@/app/types';

interface NavbarProps {
  competitionState: CompetitionState | null;
}

export default function Navbar({ competitionState }: NavbarProps) {
```

Replace lines 74-79 (the nav-actions div) with:

```tsx
        <div className="nav-actions">
          {competitionState === 'live' && (
            <span className="nav-live-badge">
              <span className="nav-live-dot" />
              LIVE
            </span>
          )}
          {competitionState === 'upcoming' && (
            <span className="nav-live-badge nav-upcoming-badge">
              <span className="nav-live-dot nav-upcoming-dot" />
              UPCOMING
            </span>
          )}
        </div>
```

**Step 2: Add CSS for upcoming badge variant**

Add after `.nav-live-dot` (after line 97 in Navbar.css):

```css
.nav-upcoming-badge {
  color: var(--yellow, #f0b429);
  border-color: rgba(240, 180, 41, 0.25);
  background: rgba(240, 180, 41, 0.06);
}
.nav-upcoming-dot {
  background: var(--yellow, #f0b429);
  box-shadow: 0 0 8px var(--yellow, #f0b429);
}
```

**Step 3: Verify**

Run: `pnpm build`
Expected: Clean build. Badge hidden when `competitionState` is `null` or `'ended'`.

**Step 4: Commit**

```
fix: make Navbar badge conditional — LIVE/UPCOMING/hidden
```

---

### Task 3: Fix Hero countdown — target start before competition, end during

**Files:**
- Modify: `app/components/Hero.tsx:57-68`

**Step 1: Fix the countdown target and status logic**

Replace lines 57-68 with:

```typescript
export default function Hero({ competition }: HeroProps) {
  const now = new Date();
  const isLive =
    competition != null &&
    now >= new Date(competition.start) &&
    now <= new Date(competition.end);
  const isUpcoming =
    competition != null && now < new Date(competition.start);
  const isEnded =
    competition != null && now > new Date(competition.end);

  const countdownTarget = useMemo(() => {
    if (!competition) return null;
    if (isUpcoming) return new Date(competition.start);
    if (isLive) return new Date(competition.end);
    return null; // ended — no countdown
  }, [competition, isUpcoming, isLive]);
  const timeLeft = useCountdown(countdownTarget);
```

**Step 2: Update the status text (line 83-86)**

Replace the status text span:

```tsx
          <span className="status-text">
            {isLive
              ? `Competition Live — ${competition!.durationHours} Hours`
              : isEnded
                ? 'Competition Ended'
                : 'Competition Upcoming'}
          </span>
```

**Step 3: Update the countdown section (lines 159-179)**

Replace the countdown conditional:

```tsx
        {competition && !isEnded && (
          <motion.div
            className="hero-countdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="countdown-header">
              {isLive ? 'TIME REMAINING' : 'COMPETITION STARTS IN'}
            </div>
            <div className="countdown-grid">
              <CountdownUnit value={timeLeft.days} label="DAYS" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.hours} label="HRS" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.minutes} label="MIN" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.seconds} label="SEC" />
            </div>
          </motion.div>
        )}
```

**Step 4: Remove the now-unused `endDate` memo (old lines 58-61)**

Delete these lines entirely — replaced by `countdownTarget`.

**Step 5: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 6: Commit**

```
fix: Hero countdown targets start before competition, end during
```

---

### Task 4: Leaderboard — show starting roster when no rankings

**Files:**
- Modify: `app/components/Leaderboard.tsx:1-127`

**Step 1: Add AGENTS import and build placeholder rankings**

Add at top:

```typescript
import { AGENTS } from '@/app/data/agents';
```

Replace the null guard (line 12-13) with pre-competition roster logic:

```typescript
export default function Leaderboard({ rankings }: LeaderboardProps) {
  const hasRankings = rankings && rankings.length > 0;
  const displayRankings: AgentData[] = hasRankings
    ? rankings
    : AGENTS.map((agent, i) => ({
        ...agent,
        rank: i + 1,
        portfolio: {
          cash: 0,
          totalValue: 0,
          pnl: 0,
          pnlPct: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          totalTrades: 0,
          holdings: [],
        },
        trades: [],
        reasoningLogs: [],
        portfolioHistory: [],
      }));
```

**Step 2: Update the section header text**

Change the label and subtitle to reflect state:

```tsx
        <div className="section-label">{hasRankings ? 'Live Rankings' : 'Starting Lineup'}</div>
        <h2 className="section-title">The Arena</h2>
        <p className="section-subtitle">
          {hasRankings
            ? 'Real-time performance of five autonomous AI crypto traders'
            : 'Five autonomous AI crypto traders ready to compete'}
        </p>
```

**Step 3: Update the map to use `displayRankings` and add pre-competition wrapper**

Replace `{rankings.map(` with `{displayRankings.map(` throughout.

Wrap the leaderboard div with a conditional dimming container:

```tsx
      <div className={`leaderboard ${!hasRankings ? 'leaderboard-pending' : ''}`}>
```

Add inline style for the pending state. After the leaderboard closing `</div>` (before legend), add:

```tsx
      {!hasRankings && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          letterSpacing: '1px',
        }}>
          WAITING FOR COMPETITION TO BEGIN
        </div>
      )}
```

**Step 4: Handle zero values gracefully in the row rendering**

When `!hasRankings`, the rank badge should show "—", portfolio value should show "—", PnL columns should show "—":

Update the rank cell:

```tsx
              <div className="lb-col lb-rank">
                <span className={`rank-badge ${hasRankings ? `rank-${i + 1}` : ''}`}>
                  {hasRankings && i === 0 && <Trophy size={12} />}
                  {hasRankings ? agent.rank : '—'}
                </span>
              </div>
```

Update portfolio value cell:

```tsx
              <div className="lb-col lb-value">
                <span className="value-main">
                  {hasRankings
                    ? `$${agent.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>
```

Update PnL cell:

```tsx
              <div className={`lb-col lb-pnl ${hasRankings ? (isProfit ? 'profit' : 'loss') : ''}`}>
                {hasRankings ? (
                  <>
                    <span className="pnl-icon">
                      {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                    {isProfit ? '+' : '-'}$
                    {Math.abs(agent.portfolio.pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </>
                ) : '—'}
              </div>
```

Apply same "—" pattern to PnL %, Sharpe, Max DD, Trades columns when `!hasRankings`.

MiniChart already handles empty data (returns null), so that column will just be blank.

**Step 5: Add `.leaderboard-pending` CSS**

Add to `Leaderboard.css`:

```css
.leaderboard-pending {
  opacity: 0.5;
  pointer-events: none;
}
```

**Step 6: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 7: Commit**

```
feat: Leaderboard shows starting roster in pre-competition state
```

---

### Task 5: PerformanceChart — empty chart frame with overlay

**Files:**
- Modify: `app/components/PerformanceChart.tsx:23-29, 100-101`

**Step 1: Remove null guard, detect empty state**

Replace line 29 (`if (!agentData) return null;`) with:

```typescript
  const hasAgentData = agentData && Object.keys(agentData).length > 0;
```

**Step 2: Update agent toggles to show all agents when empty**

Replace line 101 (`AGENTS.filter((a) => agentData?.[a.id]).map(`) with:

```tsx
          {(hasAgentData ? AGENTS.filter((a) => agentData?.[a.id]) : AGENTS).map((agent) => (
```

When `!hasAgentData`, disable the toggles:

```tsx
            <button
              key={agent.id}
              className={`agent-toggle ${activeAgents.includes(agent.id) ? 'active' : ''}`}
              onClick={() => hasAgentData && toggleAgent(agent.id)}
              disabled={!hasAgentData}
              style={/* same as current */}
            >
```

**Step 3: Wrap chart container with overlay when empty**

Wrap the `motion.div.perf-chart-container` with a relative container and add an overlay:

```tsx
      <div style={{ position: 'relative' }}>
        <motion.div
          className={`perf-chart-container ${!hasAgentData ? 'perf-chart-pending' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* existing ResponsiveContainer */}
        </motion.div>
        {!hasAgentData && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            letterSpacing: '1px',
            pointerEvents: 'none',
          }}>
            CHART WILL POPULATE WHEN TRADING BEGINS
          </div>
        )}
      </div>
```

**Step 4: Add CSS**

Add to `PerformanceChart.css`:

```css
.perf-chart-pending {
  opacity: 0.3;
}
```

**Step 5: Fix initial `activeAgents` state when no agent data**

Line 24-26 initializes `activeAgents` from `agentData`. When empty, this will be `[]`. Update:

```typescript
  const [activeAgents, setActiveAgents] = useState<string[]>(() =>
    AGENTS.filter((a) => agentData?.[a.id]).map((a) => a.id),
  );
```

This already returns `[]` when `agentData` is empty, which is correct — no lines plotted.

**Step 6: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 7: Commit**

```
feat: PerformanceChart shows empty frame in pre-competition state
```

---

### Task 6: AgentCards — show roster from AGENTS registry

**Files:**
- Modify: `app/components/AgentCards.tsx:15-18`

**Step 1: Replace null guard with fallback to AGENTS registry**

Replace lines 15-18 with:

```typescript
export default function AgentCards({ rankings, agentData }: AgentCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasRankings = rankings && rankings.length > 0;
  const displayAgents: AgentData[] = hasRankings
    ? rankings
    : AGENTS.map((agent, i) => ({
        ...agent,
        rank: i + 1,
        portfolio: {
          cash: 0,
          totalValue: 0,
          pnl: 0,
          pnlPct: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          totalTrades: 0,
          holdings: [],
        },
        trades: [],
        reasoningLogs: [],
        portfolioHistory: [],
      }));
```

Add AGENTS import:

```typescript
import { AGENTS } from '@/app/data/agents';
```

**Step 2: Update map to use `displayAgents`**

Replace `{rankings.map(` with `{displayAgents.map(`.

**Step 3: Update subtitle and label for state**

```tsx
        <p className="section-subtitle">
          {hasRankings
            ? 'Each agent starts with $2,000 in USDC, provisioned via Phantom MCP, trading crypto assets via LI.FI'
            : 'Meet the five AI competitors preparing to trade'}
        </p>
```

**Step 4: Dim cards when no rankings**

Add to the `agents-grid` wrapper:

```tsx
      <div className={`agents-grid ${!hasRankings ? 'agents-grid-pending' : ''}`}>
```

Add to `AgentCards.css`:

```css
.agents-grid-pending {
  opacity: 0.6;
}
.agents-grid-pending .ac-chart {
  display: none;
}
```

Hide the chart section on cards since there's no data to display. Also hide the expand button:

```css
.agents-grid-pending .ac-expand {
  display: none;
}
```

**Step 5: Show "—" for metric values when not live**

Wrap metric rendering:

```tsx
                <div className="ac-metrics">
                  <div className="ac-metric">
                    <span className="ac-metric-label">Portfolio</span>
                    <span className="ac-metric-value">
                      {hasRankings
                        ? `$${agent.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </span>
                  </div>
                  <div className="ac-metric">
                    <span className="ac-metric-label">PnL</span>
                    <span className={`ac-metric-value ${hasRankings ? (isProfit ? 'profit' : 'loss') : ''}`}>
                      {hasRankings ? `${isProfit ? '+' : ''}${agent.portfolio.pnlPct}%` : '—'}
                    </span>
                  </div>
                  <div className="ac-metric">
                    <span className="ac-metric-label">Trades</span>
                    <span className="ac-metric-value">{hasRankings ? agent.portfolio.totalTrades : '—'}</span>
                  </div>
                  <div className="ac-metric">
                    <span className="ac-metric-label">Sharpe</span>
                    <span className="ac-metric-value">{hasRankings ? agent.portfolio.sharpeRatio : '—'}</span>
                  </div>
                </div>
```

**Step 6: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 7: Commit**

```
feat: AgentCards shows roster from registry in pre-competition state
```

---

### Task 7: TradeFeed — fix empty stats bar

**Files:**
- Modify: `app/components/TradeFeed.tsx:90-102`

**Step 1: Update stats bar to always show all agents**

Replace lines 90-102 with:

```tsx
        <div className="feed-stats">
          {AGENTS.map((agent) => {
            const data = agentData?.[agent.id];
            return (
              <div key={agent.id} className="feed-stat">
                <span className="fs-dot" style={{ background: agent.color }} />
                <span className="fs-name">{agent.name}</span>
                <span className="fs-count">{data?.portfolio.totalTrades ?? 0} trades</span>
              </div>
            );
          })}
        </div>
```

The only change: remove the `if (!data) return null;` guard (line 93) so all agents always appear.

**Step 2: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 3: Commit**

```
fix: TradeFeed stats bar shows all agents even when no data
```

---

### Task 8: ReasoningLogs — fix crash and show all tabs

**Files:**
- Modify: `app/components/ReasoningLogs.tsx:13-17, 28, 40-51, 62-68`

**Step 1: Fix agent tab list to always show all agents**

Replace line 41 (the `AGENTS.filter` line):

```tsx
        {AGENTS.map((a) => (
```

Remove the `.filter((a) => agentData?.[a.id])` — always show all agents.

**Step 2: Fix terminal header to use AGENTS registry as fallback**

Replace lines 13-17 with:

```typescript
  const firstAvailable = AGENTS[0]?.id ?? 'gpt';
  const [activeAgent, setActiveAgent] = useState(firstAvailable);

  const agentConfig = AGENTS.find((a) => a.id === activeAgent);
  const agent = agentData?.[activeAgent];
```

**Step 3: Update terminal header to use `agentConfig` instead of `agent`**

Replace lines 62-68 with:

```tsx
          <div className="term-title">
            <Terminal size={12} />
            {agentConfig?.name ?? 'Agent'} — Reasoning Engine v1.0
          </div>
          <div className="term-status">
            {agent && (
              <>
                <span className="term-live-dot" />
                LIVE
              </>
            )}
          </div>
```

**Step 4: Update term-info to use `agentConfig`**

Replace lines 71-79:

```tsx
        <div className="term-info">
          <span className="ti-item">
            <span className="ti-label">STRATEGY:</span>
            {agentConfig?.strategy}
          </span>
          <span className="ti-item">
            <span className="ti-label">PERSONALITY:</span>
            {agentConfig?.personality}
          </span>
        </div>
```

**Step 5: Remove the `return null` guard**

Remove line 28 (`if (!agentData) return null;`).

**Step 6: Update the empty state message**

Replace lines 83-86:

```tsx
          {logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {agent
                ? 'No reasoning logs yet — waiting for agent cycles...'
                : 'Waiting for competition to begin — agent reasoning will appear here'}
            </div>
          )}
```

**Step 7: Verify**

Run: `pnpm build`
Expected: Clean build.

**Step 8: Commit**

```
fix: ReasoningLogs shows all tabs and doesn't crash on empty data
```

---

### Task 9: Final verification

**Step 1: Full build**

Run: `pnpm build`
Expected: Clean build, no warnings, no errors.

**Step 2: Visual check**

Run: `pnpm dev`

Test three scenarios:
1. Remove all `AGENT_*_URL` env vars → should see full page with placeholder states
2. Set env vars to unreachable URLs → same placeholder behavior (graceful degradation)
3. Set env vars to live agent URLs → normal live dashboard

**Step 3: Commit any fixes from visual check**

**Step 4: Final commit**

```
feat: complete pre-competition state for all dashboard sections
```
