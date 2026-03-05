'use client';

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Zap } from 'lucide-react';
import { AGENTS } from '@/app/data/agents';
import { timeAgo } from '@/app/utils/timeAgo';
import { getChainInfo } from '@/app/utils/chains';
import type { AgentData, Trade } from '@/app/types';

interface FeedTrade extends Trade {
  agentId: string;
  agentName: string;
  agentColor: string;
}

interface TradeFeedProps {
  agentData: Record<string, AgentData>;
  loading?: boolean;
}

export default function TradeFeed({ agentData, loading }: TradeFeedProps) {
  const allTrades: FeedTrade[] = [];
  Object.values(agentData ?? {}).forEach((agent) => {
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
  allTrades.sort((a, b) => b.timestamp - a.timestamp);

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
          {allTrades.map((trade, i) => {
            const typeClass = trade.type === 'BUY' ? 'buy' : trade.type === 'SELL' ? 'sell' : 'swap';
            const fromChain = getChainInfo(trade.fromChainId);
            const toChain = getChainInfo(trade.toChainId);
            const isCrossChain = trade.fromChainId != null && trade.toChainId != null && trade.fromChainId !== trade.toChainId;
            const chainLabel = trade.fromChainId != null
              ? isCrossChain
                ? `${fromChain.short}\u2192${toChain.short}`
                : fromChain.short
              : null;

            return (
              <div
                key={`${trade.agentId}-${trade.hour}-${trade.stock}-${i}`}
                className={`feed-item ${typeClass}`}
              >
                <div className="fi-time">
                  <span className="fi-hour">{timeAgo(trade.timestamp)}</span>
                </div>
                <div
                  className="fi-agent-dot"
                  style={{ background: trade.agentColor }}
                  title={trade.agentName}
                />
                <div className="fi-type-badge">
                  {trade.type === 'BUY' ? (
                    <ArrowUpRight size={11} />
                  ) : trade.type === 'SELL' ? (
                    <ArrowDownRight size={11} />
                  ) : (
                    <ArrowLeftRight size={11} />
                  )}
                  {trade.type}
                </div>
                <div className="fi-details">
                  {trade.type === 'SWAP' && trade.fromSymbol && trade.toSymbol ? (
                    <>
                      <span className="fi-symbol">{trade.fromSymbol}</span>
                      <span className="fi-at">&rarr;</span>
                      <span className="fi-symbol">{trade.toSymbol}</span>
                    </>
                  ) : (
                    <>
                      <span className="fi-tokens">{trade.tokens.toFixed(2)}</span>
                      <span className="fi-symbol">{trade.stock}</span>
                      <span className="fi-at">@</span>
                      <span className="fi-price">${trade.price.toFixed(2)}</span>
                    </>
                  )}
                  {chainLabel && <span className="fi-chain-badge">[{chainLabel}]</span>}
                </div>
                <div className="fi-value">${trade.value.toLocaleString()}</div>
                <div className="fi-agent-name">{trade.agentName}</div>
              </div>
            );
          })}
        </div>

        <div className="feed-stats">
          {AGENTS.map((agent) => {
            const data = agentData?.[agent.id];
            return (
              <div key={agent.id} className="feed-stat">
                <span className="fs-dot" style={{ background: agent.color }} />
                <span className="fs-name">{agent.name}</span>
                <span className="fs-count">{(() => { const count = data?.portfolio.totalTrades ?? 0; return `${count} ${count === 1 ? 'trade' : 'trades'}`; })()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
