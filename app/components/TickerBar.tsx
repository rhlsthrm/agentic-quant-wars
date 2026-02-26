'use client';

import { TOKENS } from '@/app/data/agents';

interface TickerBarProps {
  tokenPrices: Record<string, number>;
}

export default function TickerBar({ tokenPrices }: TickerBarProps) {
  const items = TOKENS.map((token) => {
    const price = tokenPrices[token.symbol];
    if (price == null) return null;
    return (
      <span key={token.symbol} className="ticker-item">
        <span className="ticker-symbol">{token.symbol}</span>
        <span className="ticker-price">
          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </span>
    );
  });

  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        <div className="ticker-scroll">
          {filtered}
          {filtered}
          {filtered}
          {filtered}
        </div>
      </div>
    </div>
  );
}
