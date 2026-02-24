import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Brain, ChevronRight } from 'lucide-react';
import { AGENTS } from '../data/agents';
import './ReasoningLogs.css';

export default function ReasoningLogs({ agentData }) {
  const [activeAgent, setActiveAgent] = useState('gpt');
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);
  const scrollRef = useRef(null);

  const agent = agentData?.[activeAgent];
  const logs = agent?.reasoningLogs || [];

  useEffect(() => {
    if (logs.length === 0) return;

    // Show last 10 logs initially
    setVisibleLogs(logs.slice(-12));
    setLogIndex(logs.length - 12);

    const interval = setInterval(() => {
      setLogIndex(prev => {
        const next = (prev + 1) % logs.length;
        const log = logs[next];
        setVisibleLogs(current => [...current.slice(-14), { ...log, key: `${Date.now()}-${next}` }]);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAgent, agentData]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  if (!agentData) return null;

  return (
    <section className="reasoning-section section section-gap">
      <div className="section-header">
        <div className="section-label">AI Reasoning</div>
        <h2 className="section-title">Agent Thought Process</h2>
        <p className="section-subtitle">
          Live reasoning logs from each autonomous agent's decision engine
        </p>
      </div>

      {/* Agent selector */}
      <div className="reasoning-agents">
        {AGENTS.map(a => (
          <button
            key={a.id}
            className={`ra-tab ${activeAgent === a.id ? 'active' : ''}`}
            onClick={() => setActiveAgent(a.id)}
            style={{ '--tab-color': a.color }}
          >
            <span className="ra-dot" style={{ background: a.color }} />
            {a.name}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="reasoning-terminal">
        {/* Terminal header */}
        <div className="term-header">
          <div className="term-dots">
            <span className="term-dot red" />
            <span className="term-dot yellow" />
            <span className="term-dot green" />
          </div>
          <div className="term-title">
            <Terminal size={12} />
            {agent?.name} — Reasoning Engine v1.0
          </div>
          <div className="term-status">
            <span className="term-live-dot" />
            LIVE
          </div>
        </div>

        {/* Agent info bar */}
        <div className="term-info">
          <span className="ti-item">
            <span className="ti-label">STRATEGY:</span>
            {agent?.strategy}
          </span>
          <span className="ti-item">
            <span className="ti-label">PERSONALITY:</span>
            {agent?.personality}
          </span>
        </div>

        {/* Log output */}
        <div className="term-output" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {visibleLogs.map((log, i) => (
              <motion.div
                key={log.key || `${log.hour}-${i}`}
                className="log-entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="log-meta">
                  <span className="log-timestamp">
                    [{String(Math.floor(log.hour / 24)).padStart(2, '0')}d {String(log.hour % 24).padStart(2, '0')}h]
                  </span>
                  <span className="log-trade">{log.trade}</span>
                </div>
                <div className="log-text">
                  <ChevronRight size={12} className="log-arrow" />
                  {log.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="log-cursor">
            <span className="cursor-char">_</span>
          </div>
        </div>
      </div>
    </section>
  );
}
