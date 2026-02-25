import { useState, useEffect, useMemo } from 'react';
import { fetchLiveData, hasLiveAgents } from './data/api';
import { runSimulation } from './data/mockTradingEngine';
import Navbar from './components/Navbar';
import TickerBar from './components/TickerBar';
import Hero from './components/Hero';
import Leaderboard from './components/Leaderboard';
import AgentCards from './components/AgentCards';
import TradeFeed from './components/TradeFeed';
import PerformanceChart from './components/PerformanceChart';
import ReasoningLogs from './components/ReasoningLogs';
import PredictSection from './components/PredictSection';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import './App.css';

const POLL_INTERVAL_MS = 30_000; // refresh live data every 30s

function App() {
  const isLive = hasLiveAgents();

  // Mock data fallback (only computed if no live agents)
  const mockData = useMemo(() => (isLive ? null : runSimulation()), [isLive]);

  // Live data state
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(isLive);
  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchLiveData();
        if (cancelled) return;
        setLiveData(data);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isLive]);

  const { agentData, stockPrices, rankings } = liveData || mockData || {};

  // Loading state
  if (loading) {
    return (
      <div className="app">
        <div className="app-bg">
          <div className="app-bg-gradient" />
          <div className="app-bg-stars1" />
          <div className="app-bg-stars2" />
          <div className="app-bg-glow" />
          <div className="app-bg-grid" />
        </div>
        <div className="app-noise" />
        <Navbar />
        <main className="app-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Connecting to agents...</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Fetching live portfolio data</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Global background — starfield + red glow */}
      <div className="app-bg">
        <div className="app-bg-gradient" />
        <div className="app-bg-stars1" />
        <div className="app-bg-stars2" />
        <div className="app-bg-glow" />
        <div className="app-bg-grid" />
      </div>

      {/* Header blur */}
      <div className="app-header-blur" />

      {/* Noise overlay */}
      <div className="app-noise" />

      {/* Navbar */}
      <Navbar />

      {/* Ticker bar */}
      <TickerBar stockPrices={stockPrices} />

      {/* Main content */}
      <main className="app-main">
        <Hero rankings={rankings} />

        <div className="divider" />

        <Leaderboard rankings={rankings} />

        <div className="divider" />

        <div id="trajectories">
          <PerformanceChart agentData={agentData} />
        </div>

        <div className="divider" />

        <AgentCards rankings={rankings} agentData={agentData} />

        <div className="divider" />

        <div id="feed">
          <TradeFeed agentData={agentData} />
        </div>

        <div className="divider" />

        <div id="reasoning">
          <ReasoningLogs agentData={agentData} />
        </div>

        <div className="divider" />

        <PredictSection />

        <div className="divider" />

        <HowItWorks />

        <Footer />
      </main>
    </div>
  );
}

export default App;
