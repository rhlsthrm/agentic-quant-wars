'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AGENT_LOGOS } from './Logos';
import type { AgentData, Competition } from '@/app/types';

interface CompetitionResultsProps {
  rankings: AgentData[];
  agentData: Record<string, AgentData>;
  competition: Competition | null;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CompetitionResults({ rankings, competition }: CompetitionResultsProps) {
  const stats = useMemo(() => {
    if (rankings.length === 0) return null;

    const totalTrades = rankings.reduce((sum, a) => sum + a.portfolio.totalTrades, 0);
    const returns = rankings.map((a) => a.portfolio.pnlPct);

    const bestIdx = returns.indexOf(Math.max(...returns));
    const worstIdx = returns.indexOf(Math.min(...returns));
    const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;

    const sharpes = rankings.map((a) => a.portfolio.sharpeRatio);
    const bestSharpeIdx = sharpes.indexOf(Math.max(...sharpes));

    return {
      totalTrades,
      bestReturn: { value: returns[bestIdx], agent: rankings[bestIdx].name },
      worstReturn: { value: returns[worstIdx], agent: rankings[worstIdx].name },
      avgReturn: Math.round(avgReturn * 100) / 100,
      bestSharpe: { value: sharpes[bestSharpeIdx], agent: rankings[bestSharpeIdx].name },
      duration: competition?.durationHours ?? 0,
    };
  }, [rankings, competition]);

  if (rankings.length === 0) {
    return (
      <section className="cr-section">
        <div className="cr-fallback">
          <div className="cr-fallback-label">COMPETITION COMPLETE</div>
          <p className="cr-fallback-text">Competition ended — results unavailable</p>
        </div>
      </section>
    );
  }

  const winner = rankings[0];
  const WinnerLogo = AGENT_LOGOS[winner.id];

  // Build podium: [2nd, 1st, 3rd] for centered layout
  const podiumAgents = [rankings[1], rankings[0], rankings[2]].filter(Boolean);

  return (
    <section className="cr-section">
      <div className="cr-content">
        {/* Winner Spotlight */}
        <motion.div
          className="cr-spotlight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="cr-spotlight-label">COMPETITION COMPLETE</div>
        </motion.div>

        <motion.div
          className="cr-winner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        >
          <div className="cr-winner-logo" style={{ boxShadow: `0 0 60px ${winner.color}40, 0 0 120px ${winner.color}20` }}>
            {WinnerLogo && <WinnerLogo size={64} />}
            <div className="cr-winner-glow" style={{ background: `radial-gradient(circle, ${winner.color}30 0%, transparent 70%)` }} />
          </div>

          <h2 className="cr-winner-name">{winner.name}</h2>
          <div className="cr-winner-model">{winner.model}</div>

          <div className="cr-winner-stats">
            <div className="cr-winner-stat">
              <div className="cr-winner-stat-value">${winner.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="cr-winner-stat-label">Final Value</div>
            </div>
            <div className="cr-winner-stat-divider" />
            <div className="cr-winner-stat">
              <div className={`cr-winner-stat-value ${winner.portfolio.pnlPct >= 0 ? 'cr-profit' : 'cr-loss'}`}>
                {winner.portfolio.pnlPct >= 0 ? '+' : ''}{winner.portfolio.pnlPct}%
              </div>
              <div className="cr-winner-stat-label">Return</div>
            </div>
          </div>

          <div className="cr-winner-strategy">&ldquo;{winner.tagline}&rdquo;</div>
        </motion.div>

        {/* Podium */}
        <motion.div
          className="cr-podium"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
        >
          {podiumAgents.map((agent) => {
            const isWinner = agent.id === winner.id;
            const podiumRank = isWinner ? 1 : agent === rankings[1] ? 2 : 3;
            const medal = podiumRank === 1 ? '🥇' : podiumRank === 2 ? '🥈' : '🥉';
            const Logo = AGENT_LOGOS[agent.id];

            return (
              <div
                key={agent.id}
                className={`cr-podium-card ${isWinner ? 'cr-podium-winner' : ''}`}
                style={isWinner ? { borderColor: `${winner.color}40`, boxShadow: `0 0 30px ${winner.color}15` } : undefined}
              >
                <div className="cr-podium-rank">{medal} #{podiumRank}</div>
                <div className="cr-podium-avatar" style={{ background: `${agent.color}18` }}>
                  {Logo && <Logo size={28} />}
                </div>
                <div className="cr-podium-name">{agent.name}</div>
                <div className="cr-podium-value">${agent.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className={`cr-podium-return ${agent.portfolio.pnlPct >= 0 ? 'cr-profit' : 'cr-loss'}`}>
                  {agent.portfolio.pnlPct >= 0 ? '+' : ''}{agent.portfolio.pnlPct}%
                </div>
                <div className="cr-podium-trades">{agent.portfolio.totalTrades} trades</div>
              </div>
            );
          })}
        </motion.div>

        {/* Aggregate Stats */}
        {stats && (
          <motion.div
            className="cr-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="cr-stat">
              <div className="cr-stat-value">{stats.totalTrades}</div>
              <div className="cr-stat-label">Total Trades</div>
            </div>
            <div className="cr-stat-divider" />
            <div className="cr-stat">
              <div className={`cr-stat-value ${stats.bestReturn.value >= 0 ? 'cr-profit' : 'cr-loss'}`}>
                {stats.bestReturn.value >= 0 ? '+' : ''}{stats.bestReturn.value}%
              </div>
              <div className="cr-stat-label">Best Return ({stats.bestReturn.agent})</div>
            </div>
            <div className="cr-stat-divider" />
            <div className="cr-stat">
              <div className={`cr-stat-value ${stats.worstReturn.value >= 0 ? 'cr-profit' : 'cr-loss'}`}>
                {stats.worstReturn.value >= 0 ? '+' : ''}{stats.worstReturn.value}%
              </div>
              <div className="cr-stat-label">Worst Return ({stats.worstReturn.agent})</div>
            </div>
            <div className="cr-stat-divider" />
            <div className="cr-stat">
              <div className={`cr-stat-value ${stats.avgReturn >= 0 ? 'cr-profit' : 'cr-loss'}`}>
                {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn}%
              </div>
              <div className="cr-stat-label">Avg Return</div>
            </div>
            <div className="cr-stat-divider" />
            <div className="cr-stat">
              <div className="cr-stat-value">{stats.bestSharpe.value}</div>
              <div className="cr-stat-label">Best Sharpe ({stats.bestSharpe.agent})</div>
            </div>
            <div className="cr-stat-divider" />
            <div className="cr-stat">
              <div className="cr-stat-value">{formatDuration(stats.duration)}</div>
              <div className="cr-stat-label">Duration</div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function formatDuration(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  }
  return `${hours}h`;
}
