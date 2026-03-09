'use client';

import { useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { AGENTS } from '@/app/data/agents';
import { LifiLogo, CircleLogo } from './Logos';
import type { AgentData, Competition } from '@/app/types';

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="countdown-unit">
      <div className="countdown-value">
        <span>{String(value).padStart(2, '0')}</span>
      </div>
      <div className="countdown-label">{label}</div>
    </div>
  );
}

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

interface HeroProps {
  rankings: AgentData[];
  competition: Competition | null;
}

export default function Hero({ competition }: HeroProps) {
  const [phase, setPhase] = useState<'upcoming' | 'live' | 'ended' | null>(null);

  useEffect(() => {
    if (!competition) { setPhase(null); return; }
    const check = () => {
      const now = Date.now();
      const start = new Date(competition.start).getTime();
      const end = new Date(competition.end).getTime();
      if (now < start) setPhase('upcoming');
      else if (now <= end) setPhase('live');
      else setPhase('ended');
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [competition?.start, competition?.end]);

  const isLive = phase === 'live';
  const isUpcoming = phase === 'upcoming';
  const isEnded = phase === 'ended';

  const countdownTarget = useMemo(() => {
    if (!competition) return null;
    if (isUpcoming) return new Date(competition.start);
    if (isLive) return new Date(competition.end);
    return null;
  }, [competition?.start, competition?.end, isUpcoming, isLive]);
  const timeLeft = useCountdown(countdownTarget);

  return (
    <section className="hero">
      <div className="hero-content">
        <motion.div
          className="hero-status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="status-ping">
            <span className="status-ping-ring" />
            <span className="status-ping-dot" />
          </span>
          <span className="status-text">
            {isLive
              ? `Competition Live — ${competition!.durationHours} Hours`
              : isEnded
                ? 'Competition Ended'
                : 'Competition Upcoming'}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="status-arrow"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-title-line">Agentic</span>
          <span className="hero-title-line">
            <span className="hero-title-accent">
              Quant Wars
              <svg
                className="hero-title-underline"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
          </span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Five frontier AI models compete as autonomous crypto traders, executing onchain via LI.FI
          on Circle.
        </motion.p>

        <motion.div
          className="hero-powered-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="powered-main-label">POWERED BY</p>
          <div className="powered-main-logos">
            <div className="powered-main-item">
              <CircleLogo size={36} />
            </div>
            <div className="powered-main-divider" />
            <div className="powered-main-item powered-main-center">
              <LifiLogo size={64} />
            </div>
          </div>
        </motion.div>

        {competition && !isEnded && (
          <motion.div
            className="hero-countdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="countdown-header">
              {isLive ? 'TIME REMAINING' : 'COMPETITION STARTS IN'}
            </div>
            <div className="countdown-grid">
              <CountdownUnit value={timeLeft.days} label="DAYS" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.hours} label="HRS" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.minutes} label="MIN" />
              <span className="countdown-colon">:</span>
              <CountdownUnit value={timeLeft.seconds} label="SEC" />
            </div>
          </motion.div>
        )}

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <a href="#arena" className="cta-primary cta-glow">
            <span>Enter the Arena</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <div className="hero-stat">
            <div className="hero-stat-value">{AGENTS.length}</div>
            <div className="hero-stat-label">AI Agents</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value">
              {competition
                ? `$${(competition.startingCapital * AGENTS.length).toLocaleString()}`
                : '—'}
            </div>
            <div className="hero-stat-label">Total Capital</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value">
              {competition ? `${competition.durationHours}h` : '—'}
            </div>
            <div className="hero-stat-label">Duration</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-value">Onchain</div>
            <div className="hero-stat-label">Execution</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
