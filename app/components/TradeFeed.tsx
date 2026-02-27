'use client';

import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { AGENTS } from '@/app/data/agents';
import type { AgentData, Trade } from '@/app/types';

interface FeedTrade extends Trade {
  agentId: string;
  agentName: string;
  agentColor: string;
}

interface TradeFeedProps {
  agentData: Record<string, AgentData>;
}

export default function TradeFeed({ agentData }: TradeFeedProps) {
  if (!agentData) return null;

  const allTrades: FeedTrade[] = [];
  Object.values(agentData).forEach((agent) => {
    agent.trades.forEach((trade) => {
      allTrades.push({
        ...trade,
        agentId: agent.id,
        agentName: agent.name,
        agentColor: agent.color,
      });
    });
  });
  // Newest first
  allTrades.sort((a, b) => b.hour - a.hour);

  return (
    <section className="feed-section section section-gap">
      <div className="section-header">
        <div className="section-label">Live Feed</div>
        <h2 className="section-title">Trade Activity</h2>
        <p className="section-subtitle">
          Every crypto trade executed via LI.FI Protocol
        </p>
      </div>

      <div className="feed-container">
        <div className="feed-live-bar">
          <Zap size={12} />
          <span>TRADE FEED</span>
          <span className="feed-dot-pulse" />
        </div>

        <div className="feed-list">
          {allTrades.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No trades yet — waiting for agents to execute...
            </div>
          )}
          {allTrades.map((trade, i) => (
            <div
              key={`${trade.agentId}-${trade.hour}-${trade.stock}-${i}`}
              className={`feed-item ${trade.type === 'BUY' ? 'buy' : 'sell'}`}
            >
              <div className="fi-time">
                <span className="fi-hour">H{trade.hour}</span>
              </div>
              <div
                className="fi-agent-dot"
                style={{ background: trade.agentColor }}
                title={trade.agentName}
              />
              <div className="fi-type-badge">
                {trade.type === 'BUY' ? (
                  <ArrowUpRight size={11} />
                ) : (
                  <ArrowDownRight size={11} />
                )}
                {trade.type}
              </div>
              <div className="fi-details">
                <span className="fi-tokens">{trade.tokens.toFixed(2)}</span>
                <span className="fi-symbol">{trade.stock}</span>
                <span className="fi-at">@</span>
                <span className="fi-price">${trade.price.toFixed(2)}</span>
              </div>
              <div className="fi-value">${trade.value.toLocaleString()}</div>
              <div className="fi-agent-name">{trade.agentName}</div>
            </div>
          ))}
        </div>

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
      </div>
    </section>
  );
}
