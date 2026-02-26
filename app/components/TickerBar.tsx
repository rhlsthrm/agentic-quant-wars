'use client';

interface TickerBarProps {
  tokenPrices: Record<string, number>;
}

export default function TickerBar({ tokenPrices }: TickerBarProps) {
  const entries = Object.entries(tokenPrices).filter(([, price]) => price > 0);
  if (entries.length === 0) return null;

  const items = entries.map(([symbol, price]) => (
    <span key={symbol} className="ticker-item">
      <span className="ticker-symbol">{symbol}</span>
      <span className="ticker-price">
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
