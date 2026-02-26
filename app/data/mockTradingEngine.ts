import type { AgentData, Trade, ReasoningLog, PortfolioSnapshot, Holding } from '@/app/types';
import { AGENTS, STOCKS, STARTING_CAPITAL } from './agents';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generatePriceMovement(basePrice: number, hours: number, seed: number): number[] {
  const rng = seededRandom(seed);
  const prices = [basePrice];
  let price = basePrice;

  for (let i = 1; i <= hours; i++) {
    const volatility = 0.003 + rng() * 0.015;
    const drift = (rng() - 0.48) * volatility;
    price = price * (1 + drift);
    price = Math.max(price * 0.7, Math.min(price * 1.3, price));
    prices.push(parseFloat(price.toFixed(2)));
  }
  return prices;
}

export function generateStockPrices(): Record<string, number[]> {
  const stockPrices: Record<string, number[]> = {};
  STOCKS.forEach((stock, i) => {
    stockPrices[stock.symbol] = generatePriceMovement(stock.price, 168, (i + 1) * 7919);
  });
  return stockPrices;
}

interface StrategyProfile {
  tradeFrequency: number;
  maxPositionPct: number;
  riskTolerance: number;
  preferredSectors: string[];
  holdDuration: [number, number];
}

const STRATEGY_PROFILES: Record<string, StrategyProfile> = {
  gpt: {
    tradeFrequency: 0.35,
    maxPositionPct: 0.3,
    riskTolerance: 0.5,
    preferredSectors: ['Layer 1', 'DeFi'],
    holdDuration: [4, 24],
  },
  claude: {
    tradeFrequency: 0.2,
    maxPositionPct: 0.4,
    riskTolerance: 0.3,
    preferredSectors: ['Layer 1', 'RWA', 'Oracle'],
    holdDuration: [12, 48],
  },
  gemini: {
    tradeFrequency: 0.4,
    maxPositionPct: 0.25,
    riskTolerance: 0.6,
    preferredSectors: ['Layer 1', 'Layer 2', 'DeFi'],
    holdDuration: [2, 16],
  },
  grok: {
    tradeFrequency: 0.55,
    maxPositionPct: 0.35,
    riskTolerance: 0.8,
    preferredSectors: ['Meme', 'Layer 1', 'DeFi'],
    holdDuration: [1, 8],
  },
  deepseek: {
    tradeFrequency: 0.25,
    maxPositionPct: 0.35,
    riskTolerance: 0.4,
    preferredSectors: ['Layer 1', 'Oracle', 'RWA'],
    holdDuration: [8, 36],
  },
};

const REASONING_TEMPLATES: Record<string, string[]> = {
  gpt: [
    'Detected bullish momentum in {stock} based on 4hr moving average crossover. Entry at ${price}.',
    'Onchain metrics suggest accumulation in {sector} sector. Allocating {pct}% to {stock}.',
    'Risk management triggered: trimming {stock} position by {pct}% to maintain portfolio balance.',
    'X/Twitter sentiment analysis shows elevated discussion around {stock}. Building position.',
    'Technical breakout confirmed on {stock}. RSI at {val}, entering long with stop at ${price}.',
  ],
  claude: [
    'Fundamental analysis reveals {stock} is undervalued relative to sector peers. Initiating position at ${price}.',
    'Market appears overextended in {sector}. Taking contrarian approach, reducing exposure.',
    'Long-term thesis on {stock} remains intact despite short-term volatility. Holding conviction.',
    'Identified mean-reversion opportunity in {stock} after excessive sell-off. Buying the dip.',
    'Risk-reward ratio on {stock} is asymmetric. Allocating {pct}% of portfolio at ${price}.',
  ],
  gemini: [
    'Multi-factor model signals overweight {stock}. Cross-correlation with onchain data confirms.',
    'Pattern recognition detected cup-and-handle formation on {stock} 4h chart. Confidence: {val}%.',
    'Rebalancing portfolio: rotating from {sector} to capture alpha in emerging trends.',
    'Quantitative analysis shows {stock} momentum divergence. Adjusting position sizing.',
    'Ensemble model consensus: {stock} has {val}% probability of upside move within 24hrs.',
  ],
  grok: [
    'LFG! {stock} is ripping. Aping in with {pct}% at ${price}. Not financial advice.',
    'Meme momentum on {stock} is insane rn. CT volume up {val}%. Full send.',
    'Taking profits on {stock} before the dump. Securing the bag at ${price}.',
    'Degen play: {stock} looks primed for a breakout. Crypto Twitter is sleeping on this.',
    'Volatility is the vibe. Rotating into {stock} for maximum chaos potential.',
  ],
  deepseek: [
    'Step 1: Analyze {stock} onchain metrics. Step 2: TVL growth suggests fair value at ${price}. Step 3: Initiate position.',
    'Chain-of-thought: {sector} has structural tailwinds -> {stock} is best positioned -> Allocating {pct}%.',
    'Deep analysis complete. {stock} thesis: strong protocol moat, growing TVL, reasonable valuation at ${price}.',
    'Reasoning through correlation matrix. {stock} provides optimal diversification benefit at {pct}% weight.',
    'Deliberate rebalancing: reducing {stock} by {pct}% based on updated valuation model.',
  ],
};

interface SimHolding {
  shares: number;
  avgCost: number;
}

interface SimPortfolio {
  cash: number;
  holdings: Record<string, SimHolding>;
  totalValue: number;
}

interface RawTrade {
  type: 'BUY' | 'SELL';
  stock: string;
  stockName: string;
  sector: string;
  shares: number;
  price: number;
  value: number;
  hour: number;
}

function generateTrade(
  agentId: string,
  hour: number,
  rng: () => number,
  stockPrices: Record<string, number[]>,
  portfolio: SimPortfolio,
): RawTrade | null {
  const profile = STRATEGY_PROFILES[agentId];
  if (rng() > profile.tradeFrequency) return null;

  const isBuy = rng() > 0.4;
  const stockIdx = Math.floor(rng() * STOCKS.length);
  const stock = STOCKS[stockIdx];
  const currentPrice = stockPrices[stock.symbol][hour];

  const sectorBonus = profile.preferredSectors.includes(stock.sector) ? 0.3 : 0;
  if (rng() > 0.5 + sectorBonus) return null;

  const cashAvailable = portfolio.cash;
  const maxTradeValue = cashAvailable * profile.maxPositionPct;

  if (isBuy && cashAvailable < 50) return null;

  let shares: number;
  let value: number;
  if (isBuy) {
    value = Math.min(maxTradeValue, 80 + rng() * 400);
    shares = parseFloat((value / currentPrice).toFixed(6));
    if (value > cashAvailable) return null;
  } else {
    const holding = portfolio.holdings[stock.symbol];
    if (!holding || holding.shares <= 0) return null;
    shares = parseFloat((holding.shares * (0.3 + rng() * 0.7)).toFixed(6));
    value = shares * currentPrice;
  }

  return {
    type: isBuy ? 'BUY' : 'SELL',
    stock: stock.symbol,
    stockName: stock.name,
    sector: stock.sector,
    shares,
    price: currentPrice,
    value: parseFloat(value.toFixed(2)),
    hour,
  };
}

function generateReasoning(agentId: string, trade: RawTrade, rng: () => number): string {
  const templates = REASONING_TEMPLATES[agentId];
  const template = templates[Math.floor(rng() * templates.length)];

  return template
    .replace('{stock}', trade.stock)
    .replace('{sector}', trade.sector)
    .replace('{price}', trade.price.toFixed(2))
    .replace('{pct}', String(Math.floor(10 + rng() * 30)))
    .replace('{val}', String(Math.floor(55 + rng() * 40)));
}

export interface SimulationResult {
  agentData: Record<string, AgentData>;
  stockPrices: Record<string, number[]>;
  rankings: AgentData[];
}

export function runSimulation(): SimulationResult {
  const stockPrices = generateStockPrices();
  const agentData: Record<string, AgentData> = {};

  AGENTS.forEach((agent) => {
    const rng = seededRandom(agent.id.charCodeAt(0) * 31337);

    const portfolio: SimPortfolio = {
      cash: STARTING_CAPITAL,
      holdings: {},
      totalValue: STARTING_CAPITAL,
    };

    const trades: Trade[] = [];
    const reasoningLogs: ReasoningLog[] = [];
    const portfolioHistory: PortfolioSnapshot[] = [
      { hour: 0, value: STARTING_CAPITAL, cash: STARTING_CAPITAL },
    ];

    for (let hour = 1; hour <= 168; hour++) {
      const trade = generateTrade(agent.id, hour, rng, stockPrices, portfolio);

      if (trade) {
        if (trade.type === 'BUY') {
          portfolio.cash -= trade.value;
          if (!portfolio.holdings[trade.stock]) {
            portfolio.holdings[trade.stock] = { shares: 0, avgCost: 0 };
          }
          const h = portfolio.holdings[trade.stock];
          const totalCost = h.shares * h.avgCost + trade.value;
          h.shares += trade.shares;
          h.avgCost = h.shares > 0 ? totalCost / h.shares : 0;
        } else {
          portfolio.cash += trade.value;
          portfolio.holdings[trade.stock].shares -= trade.shares;
          if (portfolio.holdings[trade.stock].shares < 0.000001) {
            delete portfolio.holdings[trade.stock];
          }
        }

        const reasoning = generateReasoning(agent.id, trade, rng);
        trades.push({ ...trade, timestamp: hour, reasoning });
        reasoningLogs.push({
          hour,
          text: reasoning,
          trade: `${trade.type} ${trade.shares} ${trade.stock} @ $${trade.price.toFixed(2)}`,
        });
      }

      let holdingsValue = 0;
      Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
        holdingsValue += holding.shares * stockPrices[symbol][hour];
      });
      portfolio.totalValue = parseFloat((portfolio.cash + holdingsValue).toFixed(2));

      portfolioHistory.push({
        hour,
        value: portfolio.totalValue,
        cash: parseFloat(portfolio.cash.toFixed(2)),
      });
    }

    const finalValue = portfolio.totalValue;
    const pnl = finalValue - STARTING_CAPITAL;
    const pnlPct = parseFloat(((pnl / STARTING_CAPITAL) * 100).toFixed(2));

    let peak = STARTING_CAPITAL;
    let maxDrawdown = 0;
    portfolioHistory.forEach((p) => {
      if (p.value > peak) peak = p.value;
      const drawdown = ((peak - p.value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const returns: number[] = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      returns.push(
        (portfolioHistory[i].value - portfolioHistory[i - 1].value) /
          portfolioHistory[i - 1].value,
      );
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length,
    );
    const sharpeRatio = stdDev > 0 ? parseFloat((avgReturn / stdDev * Math.sqrt(168)).toFixed(2)) : 0;

    const currentHoldings: Holding[] = Object.entries(portfolio.holdings).map(
      ([symbol, holding]) => {
        const currentPrice = stockPrices[symbol][168];
        const value = holding.shares * currentPrice;
        const costBasis = holding.shares * holding.avgCost;
        const holdingPnl = value - costBasis;
        return {
          symbol,
          name: STOCKS.find((s) => s.symbol === symbol)?.name || symbol,
          shares: parseFloat(holding.shares.toFixed(6)),
          avgCost: parseFloat(holding.avgCost.toFixed(2)),
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          value: parseFloat(value.toFixed(2)),
          pnl: parseFloat(holdingPnl.toFixed(2)),
          pnlPct: parseFloat(((holdingPnl / costBasis) * 100).toFixed(2)),
        };
      },
    );

    agentData[agent.id] = {
      ...agent,
      rank: 0,
      portfolio: {
        cash: parseFloat(portfolio.cash.toFixed(2)),
        totalValue: finalValue,
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        sharpeRatio,
        totalTrades: trades.length,
        holdings: currentHoldings,
      },
      trades,
      reasoningLogs,
      portfolioHistory,
    };
  });

  const rankings = Object.values(agentData).sort(
    (a, b) => b.portfolio.totalValue - a.portfolio.totalValue,
  );
  rankings.forEach((agent, i) => {
    agentData[agent.id].rank = i + 1;
  });

  return { agentData, stockPrices, rankings };
}
