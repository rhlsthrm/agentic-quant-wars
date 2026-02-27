'use client';

import { useState, useEffect } from 'react';
import type { CompetitionState } from '@/app/types';

interface NavbarProps {
  competitionState: CompetitionState | null;
}

function PredictIcons() {
  return (
    <span className="nav-predict-icons">
      <img
        src="/logos/jupiter.png"
        alt="Jupiter"
        width={20}
        height={20}
        style={{ borderRadius: '50%', objectFit: 'contain' }}
      />
    </span>
  );
}

interface NavLink {
  id: string;
  label: string;
  icon?: React.ComponentType;
}

const NAV_LINKS: NavLink[] = [
  { id: 'arena', label: 'The Arena' },
  { id: 'trajectories', label: 'Trajectories' },
  { id: 'agents', label: 'Meet the Agents' },
  { id: 'feed', label: 'Trade Activity' },
  { id: 'reasoning', label: 'AI Reasoning' },
  { id: 'predict', label: 'Predict', icon: PredictIcons },
  { id: 'how', label: 'How It Works' },
];

export default function Navbar({ competitionState }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
      let current = '';
      for (const section of sections) {
        const rect = section!.getBoundingClientRect();
        if (rect.top <= 200) current = section!.id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <nav className="navbar-inner">
        <div className="nav-links">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`nav-link ${activeSection === link.id ? 'active' : ''} ${link.icon ? 'nav-link-with-icon' : ''}`}
              >
                {Icon && <Icon />}
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="nav-actions">
          {competitionState === 'live' && (
            <span className="nav-live-badge">
              <span className="nav-live-dot" />
              LIVE
            </span>
          )}
          {competitionState === 'upcoming' && (
            <span className="nav-live-badge nav-upcoming-badge">
              <span className="nav-live-dot nav-upcoming-dot" />
              UPCOMING
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
