import type { Metadata } from 'next';

// Global CSS
import './globals.css';
import './App.css';

// Component CSS (Next.js App Router requires global CSS imports in layout)
import './components/Navbar.css';
import './components/TickerBar.css';
import './components/Hero.css';
import './components/Leaderboard.css';
import './components/PerformanceChart.css';
import './components/AgentCards.css';
import './components/TradeFeed.css';
import './components/ReasoningLogs.css';
import './components/HowItWorks.css';
import './components/Disclaimer.css';
import './components/Footer.css';
import './components/LoadingSkeleton.css';
import './components/CompetitionResults.css';

export const metadata: Metadata = {
  title: 'Agentic Quant Wars | AI Crypto Trading Arena',
  description:
    'Watch frontier AI models compete in a live crypto trading competition. Real agents. Real trades. Real-time leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
