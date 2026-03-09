'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Wallet, Brain, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { AGENT_LOGOS } from './Logos';
import { AGENTS } from '@/app/data/agents';
import { getChainInfo } from '@/app/utils/chains';
import type { AgentData, Holding } from '@/app/types';

interface AgentCardsProps {
  rankings: AgentData[];
  startingCapital: number;
}

function ChainDistribution({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) return null;

  const chainTotals = new Map<number, { value: number; info: ReturnType<typeof getChainInfo> }>();
  let totalValue = 0;
  for (const h of holdings) {
    const existing = chainTotals.get(h.chainId);
    if (existing) {
      existing.value += h.value;
    } else {
      chainTotals.set(h.chainId, { value: h.value, info: getChainInfo(h.chainId) });
    }
    totalValue += h.value;
  }
  if (totalValue <= 0) return null;

  const chains = [...chainTotals.entries()]
    .map(([id, { value, info }]) => ({ id, pct: (value / totalValue) * 100, info }))
    .sort((a, b) => b.pct - a.pct);

  if (chains.length <= 1) return null;

  return (
    <div className="chain-distribution">
      <div className="chain-bar">
        {chains.map((c) => (
          <div
            key={c.id}
            className="chain-bar-segment"
            style={{ width: `${c.pct}%`, background: c.info.color }}
            title={`${c.info.name}: ${c.pct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="chain-legend">
        {chains.map((c) => (
          <span key={c.id} className="chain-legend-item">
            <span className="chain-legend-dot" style={{ background: c.info.color }} />
            {c.info.short} {c.pct.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AgentCards({ rankings, startingCapital }: AgentCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasRankings = rankings && rankings.length > 0;
  const displayAgents: AgentData[] = hasRankings
    ? rankings
    : AGENTS.map((agent, i) => ({
        ...agent,
        rank: i + 1,
        walletAddress: null,
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

  return (
    <section id="agents" className="agents-section section section-gap">
      <div className="section-header">
        <div className="section-label">Agent Profiles</div>
        <h2 className="section-title">Meet the Agents</h2>
        <p className="section-subtitle">
          {hasRankings
            ? `Each agent starts with $${startingCapital.toLocaleString()} in USDC, provisioned via Circle, trading crypto assets via LI.FI`
            : 'Meet the five AI competitors preparing to trade'}
        </p>
      </div>

      <div className={`agents-grid ${!hasRankings ? 'agents-grid-pending' : ''}`}>
        {displayAgents.map((agent, i) => {
          const isExpanded = expandedId === agent.id;
          const isProfit = agent.portfolio.pnl >= 0;
          const data = agent.portfolioHistory.filter((_, idx) => idx % 4 === 0);

          return (
            <motion.div
              key={agent.id}
              className={`agent-card ${isExpanded ? 'expanded' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{ '--agent-color': agent.color } as React.CSSProperties}
            >
              <div className="ac-header">
                <div className="ac-rank">#{agent.rank}</div>
                <div className="ac-avatar" style={{ background: `${agent.color}18` }}>
                  {AGENT_LOGOS[agent.id] &&
                    (() => {
                      const Logo = AGENT_LOGOS[agent.id];
                      return <Logo size={22} />;
                    })()}
                </div>
                <div className="ac-identity">
                  <h3 className="ac-name">{agent.name}</h3>
                  <span className="ac-model">{agent.model}</span>
                </div>
                {agent.walletAddress && (
                  <a
                    href={`https://debank.com/profile/${agent.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ac-debank"
                    title="View on DeBank"
                  >
                    <ExternalLink size={12} />
                    DeBank
                  </a>
                )}
              </div>

              <div className="ac-strategy">
                <Brain size={12} />
                <span>{agent.tagline}</span>
              </div>

              <div className="ac-chart">
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={data}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Tooltip
                      contentStyle={{
                        background: '#16171d',
                        border: '1px solid #282a35',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                        color: '#e8e6e3',
                      }}
                      formatter={(value) => [
                        typeof value === 'number' ? `$${value.toFixed(2)}` : String(value ?? ''),
                        'Value',
                      ]}
                      labelFormatter={(label) => `Hour ${Number(label) * 4}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={agent.color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3, fill: agent.color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

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
                    {hasRankings
                      ? `${isProfit ? '+' : ''}${agent.portfolio.pnlPct}%`
                      : '—'}
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

              <button
                className="ac-expand"
                onClick={() => setExpandedId(isExpanded ? null : agent.id)}
              >
                {isExpanded ? 'Hide Holdings' : 'View Holdings'}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="ac-holdings"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="holdings-header">
                      <span>Asset</span>
                      <span className="holdings-chain-col">Chain</span>
                      <span>Tokens</span>
                      <span>Value</span>
                      <span>PnL</span>
                    </div>
                    {agent.portfolio.holdings.length > 0 ? (
                      agent.portfolio.holdings.map((h) => {
                        const chain = getChainInfo(h.chainId);
                        return (
                          <div key={`${h.symbol}-${h.chainId}`} className="holding-row">
                            <span className="holding-symbol">
                              {h.symbol}
                              <span className="holding-chain-mobile" style={{ color: chain.color }}>
                                {' '}[{chain.short}]
                              </span>
                            </span>
                            <span className="holding-chain holdings-chain-col" style={{ color: chain.color }}>
                              {chain.short}
                            </span>
                            <span className="holding-tokens">{h.tokens.toFixed(2)}</span>
                            <span className="holding-value">${h.value.toLocaleString()}</span>
                            <span className={`holding-pnl ${h.pnl >= 0 ? 'profit' : 'loss'}`}>
                              {h.pnl >= 0 ? '+' : ''}
                              {h.pnlPct}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="holdings-empty">All positions closed</div>
                    )}
                    <ChainDistribution holdings={agent.portfolio.holdings} />
                    <div className="holdings-cash">
                      <Wallet size={12} />
                      Cash: $
                      {agent.portfolio.cash.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
