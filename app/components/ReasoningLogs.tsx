'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import { AGENTS } from '@/app/data/agents';
import type { AgentData } from '@/app/types';

interface ReasoningLogsProps {
  agentData: Record<string, AgentData>;
}

export default function ReasoningLogs({ agentData }: ReasoningLogsProps) {
  const firstAvailable = agentData ? Object.keys(agentData)[0] : AGENTS[0]?.id;
  const [activeAgent, setActiveAgent] = useState(firstAvailable || 'gpt');
  const scrollRef = useRef<HTMLDivElement>(null);

  const agent = agentData?.[activeAgent];
  // Show newest first
  const logs = [...(agent?.reasoningLogs || [])].reverse();

  // Scroll to top when agent changes (newest is at top)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeAgent]);

  if (!agentData) return null;

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
        {AGENTS.filter((a) => agentData?.[a.id]).map((a) => (
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
            {agent?.name} — Reasoning Engine v1.0
          </div>
          <div className="term-status">
            <span className="term-live-dot" />
            LIVE
          </div>
        </div>

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

        <div className="term-output" ref={scrollRef}>
          {logs.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No reasoning logs yet — waiting for agent cycles...
            </div>
          )}
          {logs.map((log, i) => (
            <div key={`${activeAgent}-${log.hour}-${i}`} className="log-entry">
              <div className="log-meta">
                <span className="log-timestamp">
                  [{String(Math.floor(log.hour / 24)).padStart(2, '0')}d{' '}
                  {String(log.hour % 24).padStart(2, '0')}h]
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
