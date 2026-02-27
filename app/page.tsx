'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentsResponse, AgentsHistoryResponse, CompetitionState } from '@/app/types';
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
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/summary');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: AgentsResponse = await res.json();
      return json;
    } catch {
      return null;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/history');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: AgentsHistoryResponse = await res.json();
      return json;
    } catch {
      return null;
    }
  }, []);

  const mergeHistory = useCallback(
    (summary: AgentsResponse, history: AgentsHistoryResponse): AgentsResponse => {
      const merged = { ...summary, agentData: { ...summary.agentData } };
      for (const [id, histData] of Object.entries(history.agentHistory)) {
        if (merged.agentData[id]) {
          merged.agentData[id] = {
            ...merged.agentData[id],
            trades: histData.trades,
            reasoningLogs: histData.reasoningLogs,
          };
        }
      }
      // Re-build rankings array to reflect merged data
      merged.rankings = Object.values(merged.agentData).sort(
        (a, b) => b.portfolio.totalValue - a.portfolio.totalValue,
      );
      return merged;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      // Phase 1: summary (fast)
      const summary = await fetchSummary();
      if (cancelled) return;

      if (summary) {
        setData((prev) => {
          // If we already have history data, preserve it
          if (prev && prev.agentData) {
            const hasHistory = Object.values(prev.agentData).some(
              (a) => a.trades.length > 0 || a.reasoningLogs.length > 0,
            );
            if (hasHistory) {
              return mergeHistory(summary, {
                agentHistory: Object.fromEntries(
                  Object.entries(prev.agentData).map(([id, a]) => [
                    id,
                    { trades: a.trades, reasoningLogs: a.reasoningLogs },
                  ]),
                ),
              });
            }
          }
          return summary;
        });
        setLoading(false);
      } else if (!data) {
        setLoading(false);
      }

      // Phase 2: history (lazy)
      const history = await fetchHistory();
      if (cancelled) return;

      if (history && summary) {
        setData((prev) => {
          if (!prev) return prev;
          return mergeHistory(prev, history);
        });
      }
      setHistoryLoading(false);
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Navbar competitionState={null} />
        <LoadingSkeleton />
      </div>
    );
  }

  const hasData = data && data.live && Object.keys(data.agentData).length > 0;
  const agentData = hasData ? data.agentData : {};
  const rankings = hasData ? data.rankings : [];
  const tokenPrices = data?.tokenPrices ?? {};
  const competition = data?.competition ?? null;

  const competitionState: CompetitionState | null = (() => {
    if (!competition) return null;
    const now = Date.now();
    const start = new Date(competition.start).getTime();
    const end = new Date(competition.end).getTime();
    if (now < start) return 'upcoming';
    if (now <= end) return 'live';
    return 'ended';
  })();

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

      <Navbar competitionState={competitionState} />
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
        <AgentCards rankings={rankings} />
        <div className="divider" />
        <div id="feed">
          <TradeFeed agentData={agentData} loading={historyLoading} />
        </div>
        <div className="divider" />
        <div id="reasoning">
          <ReasoningLogs agentData={agentData} loading={historyLoading} />
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
