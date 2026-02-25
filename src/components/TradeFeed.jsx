import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { AGENTS } from '../data/agents';
import './TradeFeed.css';

export default function TradeFeed({ agentData }) {
  const [visibleTrades, setVisibleTrades] = useState([]);
  const feedRef = useRef(null);
  const keyCounter = useRef(0);

  // Collect all trades from all agents, sorted by hour
  const allTrades = [];
  if (agentData) {
    Object.values(agentData).forEach(agent => {
      agent.trades.forEach(trade => {
        allTrades.push({
          ...trade,
          agentId: agent.id,
          agentName: agent.name,
          agentColor: agent.color,
          agentAvatar: agent.avatar,
        });
      });
    });
    allTrades.sort((a, b) => a.hour - b.hour);
  }

  // Simulate live feed
  useEffect(() => {
    if (allTrades.length === 0) return;

    // Show last 20 trades initially, each with a unique key
    const initial = allTrades.slice(-20).map((t) => ({ ...t, key: `t-${++keyCounter.current}` }));
    setVisibleTrades(initial);
    let idx = Math.max(0, allTrades.length - 20);

    const interval = setInterval(() => {
      idx = (idx + 1) % allTrades.length;
      const trade = { ...allTrades[idx], key: `t-${++keyCounter.current}` };
      setVisibleTrades(current => [...current.slice(-24), trade]);
    }, 2500);

    return () => clearInterval(interval);
  }, [agentData]);

  return (
    <section className="feed-section section section-gap">
      <div className="section-header">
        <div className="section-label">Live Feed</div>
        <h2 className="section-title">Trade Activity</h2>
        <p className="section-subtitle">
          Real-time execution log — every crypto trade executed via LI.FI Protocol
        </p>
      </div>

      <div className="feed-container">
        {/* Live indicator */}
        <div className="feed-live-bar">
          <Zap size={12} />
          <span>LIVE TRADE FEED</span>
          <span className="feed-dot-pulse" />
        </div>

        {/* Feed */}
        <div className="feed-list" ref={feedRef}>
          <AnimatePresence initial={false}>
            {visibleTrades.map((trade) => (
              <motion.div
                key={trade.key}
                className={`feed-item ${trade.type === 'BUY' ? 'buy' : 'sell'}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
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
                  <span className="fi-shares">{trade.shares}</span>
                  <span className="fi-symbol">{trade.stock}</span>
                  <span className="fi-at">@</span>
                  <span className="fi-price">${trade.price.toFixed(2)}</span>
                </div>
                <div className="fi-value">${trade.value.toLocaleString()}</div>
                <div className="fi-agent-name">{trade.agentName}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Trade stats bar */}
        <div className="feed-stats">
          {AGENTS.map(agent => {
            const data = agentData?.[agent.id];
            if (!data) return null;
            return (
              <div key={agent.id} className="feed-stat">
                <span className="fs-dot" style={{ background: agent.color }} />
                <span className="fs-name">{agent.name}</span>
                <span className="fs-count">{data.portfolio.totalTrades} trades</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
