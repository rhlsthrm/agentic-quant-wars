import { useMemo } from 'react';
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

function App() {
  const { agentData, stockPrices, rankings } = useMemo(() => runSimulation(), []);

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
