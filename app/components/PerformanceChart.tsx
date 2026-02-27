'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AGENTS } from '@/app/data/agents';
import type { AgentData } from '@/app/types';

interface PerformanceChartProps {
  agentData: Record<string, AgentData>;
  durationHours: number;
  startingCapital: number;
}

export default function PerformanceChart({ agentData, durationHours, startingCapital }: PerformanceChartProps) {
  const [activeAgents, setActiveAgents] = useState<string[]>(() =>
    AGENTS.filter((a) => agentData?.[a.id]).map((a) => a.id),
  );
  const [chartType, setChartType] = useState<'value' | 'pnl' | 'pct'>('pnl');

  // Sync active agents when agentData transitions from empty to populated
  useEffect(() => {
    const ids = AGENTS.filter((a) => agentData?.[a.id]).map((a) => a.id);
    if (ids.length > 0 && activeAgents.length === 0) {
      setActiveAgents(ids);
    }
  }, [agentData]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasAgentData = agentData && Object.keys(agentData).length > 0;

  const chartData: Record<string, number | string>[] = [];
  for (let hour = 0; hour <= durationHours; hour += 2) {
    const point: Record<string, number | string> = { hour };
    AGENTS.forEach((agent) => {
      const data = agentData?.[agent.id];
      if (data?.portfolioHistory[hour]) {
        if (chartType === 'value') {
          point[agent.id] = data.portfolioHistory[hour].value;
        } else if (chartType === 'pnl') {
          point[agent.id] = data.portfolioHistory[hour].value - startingCapital;
        } else {
          point[agent.id] =
            ((data.portfolioHistory[hour].value - startingCapital) / startingCapital) * 100;
        }
      }
    });
    chartData.push(point);
  }

  const toggleAgent = (id: string) => {
    setActiveAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const formatYAxis = (value: number) => {
    if (chartType === 'pct') return `${value.toFixed(1)}%`;
    if (chartType === 'pnl') return `${value >= 0 ? '+' : ''}$${value.toFixed(0)}`;
    return `$${value.toLocaleString()}`;
  };

  const formatTooltip = (value: number | undefined, name: string | undefined) => {
    if (value == null) return ['', ''];
    const agent = AGENTS.find((a) => a.id === name);
    const label = agent?.name || name || '';
    if (chartType === 'pct') return [`${value.toFixed(2)}%`, label];
    if (chartType === 'pnl') return [`${value >= 0 ? '+' : ''}$${value.toFixed(2)}`, label];
    return [`$${value.toFixed(2)}`, label];
  };

  return (
    <section className="perf-section section section-gap">
      <div className="section-header">
        <div className="section-label">Performance</div>
        <h2 className="section-title">Portfolio Trajectories</h2>
        <p className="section-subtitle">
          Real-time performance comparison across all AI agents
        </p>
      </div>

      <div className="perf-controls">
        <div className="perf-tabs">
          {(
            [
              { id: 'value', label: 'Portfolio Value' },
              { id: 'pnl', label: 'PnL ($)' },
              { id: 'pct', label: 'Return (%)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              className={`perf-tab ${chartType === tab.id ? 'active' : ''}`}
              onClick={() => setChartType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="perf-agent-toggles">
          {(hasAgentData ? AGENTS.filter((a) => agentData?.[a.id]) : AGENTS).map((agent) => (
            <button
              key={agent.id}
              className={`agent-toggle ${activeAgents.includes(agent.id) ? 'active' : ''}`}
              disabled={!hasAgentData}
              onClick={() => hasAgentData && toggleAgent(agent.id)}
              style={
                {
                  '--toggle-color': agent.color,
                  borderColor: activeAgents.includes(agent.id)
                    ? agent.color
                    : 'var(--border-primary)',
                } as React.CSSProperties
              }
            >
              <span
                className="toggle-dot"
                style={{
                  background: activeAgents.includes(agent.id)
                    ? agent.color
                    : 'var(--text-tertiary)',
                }}
              />
              {agent.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <motion.div
          className={`perf-chart-container ${!hasAgentData ? 'perf-chart-pending' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-primary)"
                horizontal
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                stroke="var(--text-tertiary)"
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  fill: 'var(--text-tertiary)',
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-primary)' }}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis
                stroke="var(--text-tertiary)"
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  fill: 'var(--text-tertiary)',
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: '#16171d',
                  border: '1px solid #282a35',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  color: '#e8e6e3',
                  padding: '12px',
                }}
                formatter={formatTooltip}
                labelFormatter={(label) => `Hour ${label}`}
                labelStyle={{ color: 'var(--text-tertiary)', marginBottom: 6 }}
              />
              {AGENTS.map(
                (agent) =>
                  activeAgents.includes(agent.id) && (
                    <Line
                      key={agent.id}
                      type="monotone"
                      dataKey={agent.id}
                      stroke={agent.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: agent.color, stroke: '#0a0a0c', strokeWidth: 2 }}
                    />
                  ),
              )}
              {chartType === 'value' && (
                <Line
                  type="monotone"
                  dataKey={() => startingCapital}
                  stroke="var(--text-tertiary)"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name="Starting Capital"
                />
              )}
              {(chartType === 'pnl' || chartType === 'pct') && (
                <Line
                  type="monotone"
                  dataKey={() => 0}
                  stroke="var(--text-tertiary)"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name="Break Even"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {!hasAgentData && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            letterSpacing: '1px',
            pointerEvents: 'none',
          }}>
            CHART WILL POPULATE WHEN TRADING BEGINS
          </div>
        )}
      </div>
    </section>
  );
}
