'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Wallet, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { AGENT_LOGOS } from './Logos';
import { AGENTS } from '@/app/data/agents';
import type { AgentData } from '@/app/types';

interface AgentCardsProps {
  rankings: AgentData[];
}

export default function AgentCards({ rankings }: AgentCardsProps) {
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

  return (
    <section id="agents" className="agents-section section section-gap">
      <div className="section-header">
        <div className="section-label">Agent Profiles</div>
        <h2 className="section-title">Meet the Agents</h2>
        <p className="section-subtitle">
          {hasRankings
            ? 'Each agent starts with $2,000 in USDC, provisioned via Phantom MCP, trading crypto assets via LI.FI'
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
              </div>

              <div className="ac-strategy">
                <Brain size={12} />
                <span>{agent.strategy}</span>
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
                      formatter={(value: number | undefined) => [
                        value != null ? `$${value.toFixed(2)}` : '',
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
                      <span>Tokens</span>
                      <span>Value</span>
                      <span>PnL</span>
                    </div>
                    {agent.portfolio.holdings.length > 0 ? (
                      agent.portfolio.holdings.map((h) => (
                        <div key={h.symbol} className="holding-row">
                          <span className="holding-symbol">{h.symbol}</span>
                          <span className="holding-tokens">{h.tokens.toFixed(2)}</span>
                          <span className="holding-value">${h.value.toLocaleString()}</span>
                          <span className={`holding-pnl ${h.pnl >= 0 ? 'profit' : 'loss'}`}>
                            {h.pnl >= 0 ? '+' : ''}
                            {h.pnlPct}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="holdings-empty">All positions closed</div>
                    )}
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
