'use client';

import { useEffect, useState } from 'react';
import { STOCKS } from '@/app/data/agents';

interface TickerData {
  price: string;
  change: string;
  up: boolean;
}

interface TickerBarProps {
  stockPrices: Record<string, number[]>;
}

export default function TickerBar({ stockPrices }: TickerBarProps) {
  const [prices, setPrices] = useState<Record<string, TickerData>>({});

  useEffect(() => {
    if (!stockPrices) return;
    const interval = setInterval(() => {
      const hour = Math.floor(Math.random() * 168);
      const newPrices: Record<string, TickerData> = {};
      STOCKS.forEach((stock) => {
        const price = stockPrices[stock.symbol]?.[hour] || stock.price;
        const prevPrice = stockPrices[stock.symbol]?.[Math.max(0, hour - 1)] || stock.price;
        const change = (((price - prevPrice) / prevPrice) * 100).toFixed(2);
        newPrices[stock.symbol] = { price: price.toFixed(2), change, up: Number(change) >= 0 };
      });
      setPrices(newPrices);
    }, 3000);

    const newPrices: Record<string, TickerData> = {};
    STOCKS.forEach((stock) => {
      const price = stockPrices[stock.symbol]?.[168] || stock.price;
      const prevPrice = stockPrices[stock.symbol]?.[167] || stock.price;
      const change = (((price - prevPrice) / prevPrice) * 100).toFixed(2);
      newPrices[stock.symbol] = { price: price.toFixed(2), change, up: Number(change) >= 0 };
    });
    setPrices(newPrices);

    return () => clearInterval(interval);
  }, [stockPrices]);

  const items = STOCKS.map((stock) => {
    const data = prices[stock.symbol] || {
      price: stock.price.toFixed(2),
      change: '0.00',
      up: true,
    };
    return (
      <span key={stock.symbol} className="ticker-item">
        <span className="ticker-symbol">{stock.symbol}</span>
        <span className="ticker-price">${data.price}</span>
        <span className={`ticker-change ${data.up ? 'up' : 'down'}`}>
          {data.up ? '+' : ''}
          {data.change}%
        </span>
      </span>
    );
  });

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
