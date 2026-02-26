/**
 * Full-page skeleton that mirrors the actual dashboard layout.
 * Uses real CSS classes from each component so dimensions/grids match.
 */

function Bone({
  w,
  h,
  round,
  pill,
  style,
}: {
  w?: string | number;
  h?: string | number;
  round?: boolean;
  pill?: boolean;
  style?: React.CSSProperties;
}) {
  const cls = [
    'skeleton-bone',
    round && 'skeleton-bone-round',
    pill && 'skeleton-bone-pill',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      style={{ width: w, height: h, flexShrink: 0, ...style }}
    />
  );
}

/* ── Ticker Bar ────────────────────────────────────────── */
function TickerBarSkeleton() {
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        <div style={{ display: 'flex', gap: 18, padding: '0 18px', alignItems: 'center' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Bone w={40} h={10} />
              <Bone w={55} h={10} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <div className="hero">
      <div className="hero-content">
        {/* Status pill */}
        <Bone w={180} h={32} pill style={{ marginBottom: 36 }} />

        {/* Title lines */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Bone w={400} h={60} style={{ maxWidth: '80vw' }} />
          <Bone w={300} h={60} style={{ maxWidth: '60vw' }} />
        </div>

        {/* Subtitle */}
        <Bone w={500} h={20} style={{ maxWidth: '70vw', marginBottom: 44 }} />

        {/* Powered-by block */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 48, alignItems: 'center' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} w={40} h={40} round />
          ))}
        </div>

        {/* Countdown boxes */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, alignItems: 'center' }}>
          {['D', 'H', 'M', 'S'].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Bone w={64} h={54} style={{ borderRadius: 8 }} />
                <Bone w={30} h={8} />
              </div>
              {i < 3 && <span style={{ color: '#1e1e2e', fontSize: 28 }}>:</span>}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
          <Bone w={180} h={48} pill />
          <Bone w={150} h={48} pill />
        </div>

        {/* Stats bar */}
        <div className="hero-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Bone w={60} h={16} />
                <Bone w={80} h={10} />
              </div>
              {i < 3 && <div className="hero-stat-divider" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Leaderboard ───────────────────────────────────────── */
function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-section">
      <div className="section-header">
        <Bone w={120} h={14} pill style={{ marginBottom: 4 }} />
        <Bone w={200} h={32} />
      </div>
      <div className="leaderboard">
        {/* Real header row */}
        <div className="lb-header">
          <div className="lb-col lb-rank">Rank</div>
          <div className="lb-col lb-agent">Agent</div>
          <div className="lb-col lb-value">Portfolio Value</div>
          <div className="lb-col lb-pnl">PnL</div>
          <div className="lb-col lb-pnl-pct">Return %</div>
          <div className="lb-col lb-sharpe">Sharpe</div>
          <div className="lb-col lb-drawdown">Max DD</div>
          <div className="lb-col lb-trades">Trades</div>
          <div className="lb-col lb-chart">24h Trend</div>
        </div>

        {/* 5 skeleton rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="lb-row" key={i}>
            <div className="lb-col lb-rank"><Bone w={28} h={28} round /></div>
            <div className="lb-col lb-agent">
              <div className="lb-agent" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bone w={34} h={34} style={{ borderRadius: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Bone w={80} h={13} />
                  <Bone w={60} h={10} />
                </div>
              </div>
            </div>
            <div className="lb-col lb-value"><Bone w={80} h={14} /></div>
            <div className="lb-col lb-pnl"><Bone w={70} h={14} /></div>
            <div className="lb-col lb-pnl-pct"><Bone w={50} h={14} /></div>
            <div className="lb-col lb-sharpe"><Bone w={40} h={14} /></div>
            <div className="lb-col lb-drawdown"><Bone w={40} h={14} /></div>
            <div className="lb-col lb-trades"><Bone w={30} h={14} /></div>
            <div className="lb-col lb-chart"><Bone w={100} h={28} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Performance Chart ─────────────────────────────────── */
function PerformanceChartSkeleton() {
  return (
    <div className="perf-section">
      <div className="section-header">
        <Bone w={100} h={14} pill style={{ marginBottom: 4 }} />
        <Bone w={260} h={32} />
      </div>
      <div className="perf-controls">
        <div className="perf-tabs">
          {['Portfolio Value', 'PnL ($)', 'Return (%)'].map((label) => (
            <div className="perf-tab" key={label}><Bone w={90} h={12} /></div>
          ))}
        </div>
        <div className="perf-agent-toggles">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} w={80} h={28} style={{ borderRadius: 6 }} />
          ))}
        </div>
      </div>
      <div className="perf-chart-container">
        <Bone w="100%" h={420} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ── Agent Cards ───────────────────────────────────────── */
function AgentCardsSkeleton() {
  return (
    <div className="agents-section">
      <div className="section-header">
        <Bone w={100} h={14} pill style={{ marginBottom: 4 }} />
        <Bone w={220} h={32} />
      </div>
      <div className="agents-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="agent-card" key={i} style={{ ['--agent-color' as string]: '#1e1e2e' }}>
            {/* Header */}
            <div className="ac-header">
              <Bone w={20} h={12} />
              <Bone w={38} h={38} style={{ borderRadius: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <Bone w={100} h={15} />
                <Bone w={70} h={10} />
              </div>
            </div>

            {/* Strategy */}
            <Bone w="100%" h={30} style={{ borderRadius: 6, marginBottom: 14 }} />

            {/* Mini chart */}
            <Bone w="100%" h={80} style={{ borderRadius: 4, marginBottom: 14 }} />

            {/* Metrics grid: 2×2 */}
            <div className="ac-metrics">
              {Array.from({ length: 4 }).map((_, j) => (
                <div className="ac-metric" key={j}>
                  <Bone w={60} h={8} style={{ marginBottom: 4 }} />
                  <Bone w={80} h={16} />
                </div>
              ))}
            </div>

            {/* Expand button */}
            <Bone w="100%" h={32} style={{ borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Trade Feed ────────────────────────────────────────── */
function TradeFeedSkeleton() {
  return (
    <div className="feed-section">
      <div className="section-header">
        <Bone w={80} h={14} pill style={{ marginBottom: 4 }} />
        <Bone w={180} h={32} />
      </div>
      <div className="feed-container">
        {/* Live bar */}
        <div className="feed-live-bar">
          <Bone w={120} h={9} />
          <div style={{ marginLeft: 'auto' }}>
            <Bone w={8} h={8} round />
          </div>
        </div>

        {/* 8 feed item rows */}
        <div className="feed-list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="feed-item" key={i} style={{ borderLeft: '2px solid #1e1e2e' }}>
              <Bone w={36} h={10} />
              <Bone w={7} h={7} round />
              <Bone w={50} h={18} style={{ borderRadius: 3 }} />
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <Bone w={40} h={11} />
                <Bone w={50} h={11} />
                <Bone w={60} h={11} />
              </div>
              <Bone w={80} h={10} />
              <Bone w={100} h={9} />
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="feed-stats">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="feed-stat" key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Bone w={5} h={5} round />
              <Bone w={50} h={9} />
              <Bone w={40} h={9} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Reasoning Logs ────────────────────────────────────── */
function ReasoningLogsSkeleton() {
  return (
    <div className="reasoning-section">
      <div className="section-header">
        <Bone w={110} h={14} pill style={{ marginBottom: 4 }} />
        <Bone w={280} h={32} />
      </div>

      {/* Agent tabs */}
      <div className="reasoning-agents">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} w={100} h={32} style={{ borderRadius: 8 }} />
        ))}
      </div>

      {/* Terminal */}
      <div className="reasoning-terminal">
        <div className="term-header">
          <div className="term-dots">
            <span className="term-dot red" />
            <span className="term-dot yellow" />
            <span className="term-dot green" />
          </div>
          <div className="term-title">
            <Bone w={200} h={10} />
          </div>
          <Bone w={60} h={10} />
        </div>

        <div className="term-info">
          <Bone w={200} h={9} />
          <Bone w={150} h={9} />
        </div>

        <div className="term-output">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="log-entry" key={i}>
              <div className="log-meta">
                <Bone w={70} h={9} />
                <Bone w={120} h={16} style={{ borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                <Bone w="100%" h={11} />
              </div>
              <Bone w="70%" h={11} style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Export ────────────────────────────────────────── */
export default function LoadingSkeleton() {
  return (
    <div className="skeleton-wrapper">
      <TickerBarSkeleton />
      <main className="app-main">
        <HeroSkeleton />
        <div className="divider" />
        <LeaderboardSkeleton />
        <div className="divider" />
        <PerformanceChartSkeleton />
        <div className="divider" />
        <AgentCardsSkeleton />
        <div className="divider" />
        <TradeFeedSkeleton />
        <div className="divider" />
        <ReasoningLogsSkeleton />
      </main>
    </div>
  );
}
