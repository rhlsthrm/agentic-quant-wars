import { useState, useEffect } from 'react';
import './Navbar.css';

function PredictIcons() {
  return (
    <span className="nav-predict-icons">
      <img src="/logos/jupiter.png" alt="Jupiter" width={20} height={20} style={{ borderRadius: '50%', objectFit: 'contain' }} />
    </span>
  );
}

const NAV_LINKS = [
  { id: 'arena', label: 'The Arena' },
  { id: 'trajectories', label: 'Trajectories' },
  { id: 'agents', label: 'Meet the Agents' },
  { id: 'feed', label: 'Trade Activity' },
  { id: 'reasoning', label: 'AI Reasoning' },
  { id: 'predict', label: 'Predict', icon: PredictIcons },
  { id: 'how', label: 'How It Works' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = NAV_LINKS.map(l => document.getElementById(l.id)).filter(Boolean);
      let current = '';
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200) current = section.id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <nav className="navbar-inner">
        {/* Links — centered, no brand logo */}
        <div className="nav-links">
          {NAV_LINKS.map(link => {
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

        {/* Live indicator */}
        <div className="nav-actions">
          <span className="nav-live-badge">
            <span className="nav-live-dot" />
            LIVE
          </span>
        </div>
      </nav>
    </header>
  );
}
