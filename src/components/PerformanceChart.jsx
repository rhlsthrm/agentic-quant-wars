import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { AGENTS, STARTING_CAPITAL } from '../data/agents';
import './PerformanceChart.css';

export default function PerformanceChart({ agentData }) {
  const [activeAgents, setActiveAgents] = useState(() =>
    AGENTS.filter(a => agentData?.[a.id]).map(a => a.id)
  );
  const [chartType, setChartType] = useState('pnl'); // value | pnl | pct

  if (!agentData) return null;

  // Build chart data — sample every 2 hours for performance
  const chartData = [];
  for (let hour = 0; hour <= 168; hour += 2) {
    const point = { hour };
    AGENTS.forEach(agent => {
      const data = agentData[agent.id];
      if (data?.portfolioHistory[hour]) {
        if (chartType === 'value') {
          point[agent.id] = data.portfolioHistory[hour].value;
        } else if (chartType === 'pnl') {
          point[agent.id] = data.portfolioHistory[hour].value - STARTING_CAPITAL;
        } else {
          point[agent.id] = ((data.portfolioHistory[hour].value - STARTING_CAPITAL) / STARTING_CAPITAL * 100);
        }
      }
    });
    chartData.push(point);
  }

  const toggleAgent = (id) => {
    setActiveAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const formatYAxis = (value) => {
    if (chartType === 'pct') return `${value.toFixed(1)}%`;
    if (chartType === 'pnl') return `${value >= 0 ? '+' : ''}$${value.toFixed(0)}`;
    return `$${value.toLocaleString()}`;
  };

  const formatTooltip = (value, name) => {
    const agent = AGENTS.find(a => a.id === name);
    const label = agent?.name || name;
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
          168-hour performance comparison across all five AI agents
        </p>
      </div>

      {/* Controls */}
      <div className="perf-controls">
        <div className="perf-tabs">
          {[
            { id: 'value', label: 'Portfolio Value' },
            { id: 'pnl', label: 'PnL ($)' },
            { id: 'pct', label: 'Return (%)' },
          ].map(tab => (
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
          {AGENTS.filter(a => agentData?.[a.id]).map(agent => (
            <button
              key={agent.id}
              className={`agent-toggle ${activeAgents.includes(agent.id) ? 'active' : ''}`}
              onClick={() => toggleAgent(agent.id)}
              style={{
                '--toggle-color': agent.color,
                borderColor: activeAgents.includes(agent.id) ? agent.color : 'var(--border-primary)',
              }}
            >
              <span
                className="toggle-dot"
                style={{ background: activeAgents.includes(agent.id) ? agent.color : 'var(--text-tertiary)' }}
              />
              {agent.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <motion.div
        className="perf-chart-container"
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
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'var(--text-tertiary)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-primary)' }}
              tickFormatter={v => `${v}h`}
            />
            <YAxis
              stroke="var(--text-tertiary)"
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'var(--text-tertiary)' }}
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
            {AGENTS.map(agent => (
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
              )
            ))}
            {/* Reference line for starting capital / zero */}
            {chartType === 'value' && (
              <Line
                type="monotone"
                dataKey={() => STARTING_CAPITAL}
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
    </section>
  );
}
