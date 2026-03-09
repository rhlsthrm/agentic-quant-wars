'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import { AGENTS } from '@/app/data/agents';
import { timeAgo } from '@/app/utils/timeAgo';
import type { AgentData } from '@/app/types';

interface ReasoningLogsProps {
  agentData: Record<string, AgentData>;
  loading?: boolean;
}

export default function ReasoningLogs({ agentData, loading }: ReasoningLogsProps) {
  const firstAvailable = AGENTS[0]?.id ?? 'gpt';
  const [activeAgent, setActiveAgent] = useState(firstAvailable);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agentConfig = AGENTS.find((a) => a.id === activeAgent);
  const agent = agentData?.[activeAgent];
  // Show newest first
  const logs = [...(agent?.reasoningLogs || [])].reverse();

  // Scroll to top when agent changes (newest is at top)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeAgent]);

  return (
    <section className="reasoning-section section section-gap">
      <div className="section-header">
        <div className="section-label">AI Reasoning</div>
        <h2 className="section-title">Agent Thought Process</h2>
        <p className="section-subtitle">
          Reasoning logs from each autonomous agent&apos;s decision engine
        </p>
      </div>

      <div className="reasoning-agents">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            className={`ra-tab ${activeAgent === a.id ? 'active' : ''}`}
            onClick={() => setActiveAgent(a.id)}
            style={{ '--tab-color': a.color } as React.CSSProperties}
          >
            <span className="ra-dot" style={{ background: a.color }} />
            {a.name}
          </button>
        ))}
      </div>

      <div className="reasoning-terminal">
        <div className="term-header">
          <div className="term-dots">
            <span className="term-dot red" />
            <span className="term-dot yellow" />
            <span className="term-dot green" />
          </div>
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
        </div>

        <div className="term-info">
          <span className="ti-item">
            {agentConfig?.tagline}
          </span>
        </div>

        <div className="term-output" ref={scrollRef}>
          {loading && logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              Loading reasoning logs...
            </div>
          )}
          {!loading && logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {agent
                ? 'No reasoning logs yet — waiting for agent cycles...'
                : 'Waiting for competition to begin — agent reasoning will appear here'}
            </div>
          )}
          {logs.map((log, i) => (
            <div key={`${activeAgent}-${log.hour}-${i}`} className="log-entry">
              <div className="log-meta">
                <span className="log-timestamp">
                  [{timeAgo(log.timestamp)}]
                </span>
                <span className="log-trade">{log.trade}</span>
              </div>
              <div className="log-text">
                <ChevronRight size={12} className="log-arrow" />
                {log.text}
              </div>
            </div>
          ))}
          <div className="log-cursor">
            <span className="cursor-char">_</span>
          </div>
        </div>
      </div>
    </section>
  );
}
