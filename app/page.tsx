'use client';

import { useState, useEffect } from 'react';
import type { AgentsResponse } from '@/app/types';
import Navbar from '@/app/components/Navbar';
import TickerBar from '@/app/components/TickerBar';
import Hero from '@/app/components/Hero';
import Leaderboard from '@/app/components/Leaderboard';
import AgentCards from '@/app/components/AgentCards';
import TradeFeed from '@/app/components/TradeFeed';
import PerformanceChart from '@/app/components/PerformanceChart';
import ReasoningLogs from '@/app/components/ReasoningLogs';
import PredictSection from '@/app/components/PredictSection';
import HowItWorks from '@/app/components/HowItWorks';
import Footer from '@/app/components/Footer';
import LoadingSkeleton from '@/app/components/LoadingSkeleton';

const POLL_INTERVAL_MS = 30_000;

export default function Page() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error(`${res.status}`);
        const json: AgentsResponse = await res.json();
        if (cancelled) return;
        setData(json);
      } catch {
        // keep previous data if we had it
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
        <div className="app-header-blur" />
        <div className="app-noise" />
        <Navbar />
        <LoadingSkeleton />
      </div>
    );
  }

  const hasData = data && data.live && Object.keys(data.agentData).length > 0;
  const agentData = hasData ? data.agentData : {};
  const rankings = hasData ? data.rankings : [];
  const tokenPrices = data?.tokenPrices ?? {};
  const competition = data?.competition ?? null;

  return (
    <div className="app">
      <div className="app-bg">
        <div className="app-bg-gradient" />
        <div className="app-bg-stars1" />
        <div className="app-bg-stars2" />
        <div className="app-bg-glow" />
        <div className="app-bg-grid" />
      </div>

      <div className="app-header-blur" />
      <div className="app-noise" />

      <Navbar />
      <TickerBar tokenPrices={tokenPrices} />

      <main className="app-main">
        <Hero rankings={rankings} competition={competition} />
        <div className="divider" />
        <Leaderboard rankings={rankings} />
        <div className="divider" />
        <div id="trajectories">
          <PerformanceChart agentData={agentData} durationHours={competition?.durationHours ?? 168} startingCapital={competition?.startingCapital ?? 100} />
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
