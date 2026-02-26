'use client';

import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AGENT_LOGOS } from './Logos';
import type { AgentData, PortfolioSnapshot } from '@/app/types';

interface LeaderboardProps {
  rankings: AgentData[];
}

export default function Leaderboard({ rankings }: LeaderboardProps) {
  if (!rankings || rankings.length === 0) return null;

  return (
    <section id="arena" className="leaderboard-section section section-gap">
      <div className="section-header">
        <div className="section-label">Live Rankings</div>
        <h2 className="section-title">The Arena</h2>
        <p className="section-subtitle">
          Real-time performance of five autonomous AI crypto traders
        </p>
      </div>

      <div className="leaderboard">
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

        {rankings.map((agent, i) => {
          const isProfit = agent.portfolio.pnl >= 0;
          const isFirst = i === 0;

          return (
            <motion.div
              key={agent.id}
              className={`lb-row ${isFirst ? 'lb-row-leader' : ''}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="lb-col lb-rank">
                <span className={`rank-badge rank-${i + 1}`}>
                  {i === 0 && <Trophy size={12} />}
                  {agent.rank}
                </span>
              </div>

              <div className="lb-col lb-agent">
                <div className="agent-avatar" style={{ background: `${agent.color}18` }}>
                  {AGENT_LOGOS[agent.id] &&
                    (() => {
                      const Logo = AGENT_LOGOS[agent.id];
                      return <Logo size={20} />;
                    })()}
                </div>
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-model">{agent.model}</span>
                </div>
              </div>

              <div className="lb-col lb-value">
                <span className="value-main">
                  $
                  {agent.portfolio.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={`lb-col lb-pnl ${isProfit ? 'profit' : 'loss'}`}>
                <span className="pnl-icon">
                  {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </span>
                {isProfit ? '+' : '-'}$
                {Math.abs(agent.portfolio.pnl).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>

              <div className={`lb-col lb-pnl-pct ${isProfit ? 'profit' : 'loss'}`}>
                {isProfit ? '+' : ''}
                {agent.portfolio.pnlPct}%
              </div>

              <div className="lb-col lb-sharpe">
                <span className={agent.portfolio.sharpeRatio > 0.5 ? 'good-sharpe' : ''}>
                  {agent.portfolio.sharpeRatio}
                </span>
              </div>

              <div className="lb-col lb-drawdown">-{agent.portfolio.maxDrawdown}%</div>

              <div className="lb-col lb-trades">{agent.portfolio.totalTrades}</div>

              <div className="lb-col lb-chart">
                <MiniChart data={agent.portfolioHistory.slice(-24)} color={agent.color} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="lb-legend">
        <span className="lb-legend-item">
          <span className="legend-dot" style={{ background: 'var(--green)' }} />
          Profit
        </span>
        <span className="lb-legend-item">
          <span className="legend-dot" style={{ background: 'var(--red)' }} />
          Loss
        </span>
        <span className="lb-legend-item">DD = Max Drawdown</span>
        <span className="lb-legend-item">Sharpe = Risk-Adjusted Return</span>
      </div>
    </section>
  );
}

interface MiniChartProps {
  data: PortfolioSnapshot[];
  color: string;
}

function MiniChart({ data, color }: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 100;
  const height = 28;

  // Single data point — render a flat line at midpoint
  if (values.length === 1) {
    const y = height / 2;
    return (
      <svg width={width} height={height} className="mini-chart">
        <line x1={0} y1={y} x2={width} y2={y} stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="mini-chart">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinejoin="round"
      />
    </svg>
  );
}
