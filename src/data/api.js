// Live data fetcher — replaces mockTradingEngine for real agent data
// Fetches from each agent's Hono API and transforms to component shape

import { LIVE_AGENTS, STARTING_CAPITAL } from './agents';

/**
 * Fetch dashboard + history from a single agent API.
 * Returns null if the agent is unreachable.
 */
async function fetchAgent(agent) {
  const base = agent.apiUrl.replace(/\/+$/, '');
  try {
    const [dashRes, histRes] = await Promise.all([
      fetch(`${base}/api/dashboard`),
      fetch(`${base}/api/history?limit=500`),
    ]);
    if (!dashRes.ok || !histRes.ok) return null;
    const dashboard = await dashRes.json();
    const history = await histRes.json();
    return { dashboard, history };
  } catch {
    return null;
  }
}

/**
 * Convert ISO timestamp to hour offset from competition start.
 * Clamps to [0, 168].
 */
function toHourOffset(timestamp, competitionStart) {
  const ms = new Date(timestamp).getTime() - competitionStart.getTime();
  const hours = Math.max(0, Math.round(ms / 3600000));
  return Math.min(hours, 168);
}

/**
 * Transform a single agent's API responses into the shape components expect.
 */
function transformAgent(agent, { dashboard, history }) {
  const competitionStart = dashboard.info.competitionStart
    ? new Date(dashboard.info.competitionStart)
    : new Date(dashboard.info.startedAt);

  // Portfolio — merge portfolio + metrics + stats into component shape
  const portfolio = {
    cash: dashboard.portfolio?.cash ?? 0,
    totalValue: dashboard.portfolio?.totalUsd ?? STARTING_CAPITAL,
    pnl: dashboard.metrics?.pnl ?? 0,
    pnlPct: dashboard.metrics?.pnlPct ?? 0,
    maxDrawdown: dashboard.metrics?.maxDrawdown ?? 0,
    sharpeRatio: dashboard.metrics?.sharpeRatio ?? 0,
    totalTrades: dashboard.stats?.totalTrades ?? 0,
    holdings: (dashboard.portfolio?.positions ?? [])
      .filter(p => p.token !== 'native')
      .map(p => ({
        symbol: p.symbol,
        name: p.symbol,
        shares: parseFloat(p.balance),
        avgCost: 0,
        currentPrice: p.priceUsd,
        value: Math.round(p.balanceUsd * 100) / 100,
        pnl: 0,
        pnlPct: 0,
      })),
  };

  // Trades — from history cycles, flatten all enriched trades
  const trades = [];
  const reasoningLogs = [];

  // history is newest-first from the API, reverse for chronological
  const chronological = [...history].reverse();

  for (const cycle of chronological) {
    const hour = toHourOffset(cycle.timestamp, competitionStart);
    let hadValidTrade = false;

    for (const trade of cycle.trades || []) {
      // Skip garbage trades (failed, $0, or missing symbols)
      if (trade.amount_usd <= 0 || trade.status === 'failed') continue;
      hadValidTrade = true;

      const symbol = trade.type === 'SELL' ? trade.fromSymbol : trade.toSymbol;
      trades.push({
        type: trade.type,
        stock: symbol,
        stockName: symbol,
        sector: '',
        shares: trade.executed_price ? parseFloat((trade.amount_usd / trade.executed_price).toFixed(6)) : 0,
        price: trade.executed_price ?? 0,
        value: Math.round(trade.amount_usd * 100) / 100,
        hour,
        timestamp: hour,
        reasoning: trade.rationale || trade.summary,
      });

      reasoningLogs.push({
        hour,
        text: trade.rationale || trade.summary,
        trade: `${trade.type} ${symbol} for $${Math.round(trade.amount_usd)}`,
      });
    }

    // If cycle has reasoning but no valid trades, still add a reasoning log
    if (!hadValidTrade && cycle.reasoning) {
      let text;
      if (typeof cycle.reasoning === 'string') {
        text = cycle.reasoning;
      } else if (typeof cycle.reasoning.marketAnalysis?.overview === 'string') {
        text = cycle.reasoning.marketAnalysis.overview;
      } else if (typeof cycle.reasoning.summary === 'string') {
        text = cycle.reasoning.summary;
      } else {
        text = JSON.stringify(cycle.reasoning).slice(0, 200);
      }
      reasoningLogs.push({
        hour,
        text,
        trade: 'No trade this cycle',
      });
    }
  }

  // Portfolio history — build a dense array indexed by hour (0..168)
  // so components can access portfolioHistory[hour] directly.
  // Forward-fill from sparse API data points.
  const sparsePoints = (dashboard.portfolioHistory || []).map(p => ({
    hour: toHourOffset(p.timestamp, competitionStart),
    value: p.value,
  }));

  const maxHour = sparsePoints.length > 0
    ? Math.min(168, Math.max(...sparsePoints.map(p => p.hour)))
    : 0;

  const portfolioHistory = [];
  let lastValue = STARTING_CAPITAL;
  let sparseIdx = 0;

  for (let h = 0; h <= maxHour; h++) {
    // Consume all sparse points at or before this hour
    while (sparseIdx < sparsePoints.length && sparsePoints[sparseIdx].hour <= h) {
      lastValue = sparsePoints[sparseIdx].value;
      sparseIdx++;
    }
    portfolioHistory.push({ hour: h, value: lastValue, cash: 0 });
  }

  return {
    ...agent,
    portfolio,
    trades,
    reasoningLogs,
    portfolioHistory,
  };
}

/**
 * Fetch all live agents and return data in the shape App.jsx expects:
 * { agentData, stockPrices, rankings }
 */
export async function fetchLiveData() {
  const results = await Promise.all(
    LIVE_AGENTS.map(async (agent) => {
      const data = await fetchAgent(agent);
      if (!data) return null;
      return transformAgent(agent, data);
    })
  );

  const agentData = {};
  for (const result of results) {
    if (result) agentData[result.id] = result;
  }

  // Rankings — sort by portfolio totalValue descending
  const rankings = Object.values(agentData).sort(
    (a, b) => b.portfolio.totalValue - a.portfolio.totalValue
  );
  rankings.forEach((agent, i) => {
    agentData[agent.id].rank = i + 1;
  });

  // stockPrices — empty object; TickerBar falls back to static TOKENS prices
  const stockPrices = {};

  return { agentData, stockPrices, rankings };
}

/**
 * Check if any agents have API URLs configured.
 */
export function hasLiveAgents() {
  return LIVE_AGENTS.length > 0;
}
