'use client';

import { TOKENS } from '@/app/data/agents';

export default function TickerBar() {
  const items = TOKENS.map((token) => (
    <span key={token.symbol} className="ticker-item">
      <span className="ticker-symbol">{token.symbol}</span>
      <span className="ticker-price">
        ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </span>
  ));

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        <div className="ticker-scroll">
          {items}
          {items}
          {items}
          {items}
        </div>
      </div>
    </div>
  );
}
