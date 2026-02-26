// Agent UI metadata (from agents.ts)
export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  color: string;
  colorLight: string;
  avatar: string;
  strategy: string;
  personality: string;
}

// What components consume
export interface Holding {
  symbol: string;
  name: string;
  tokens: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
}

export interface Portfolio {
  cash: number;
  totalValue: number;
  pnl: number;
  pnlPct: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  holdings: Holding[];
}

export interface Trade {
  type: 'BUY' | 'SELL';
  stock: string;
  stockName: string;
  sector: string;
  tokens: number;
  price: number;
  value: number;
  hour: number;
  timestamp: number;
  reasoning: string;
}

export interface ReasoningLog {
  hour: number;
  text: string;
  trade: string;
}

export interface PortfolioSnapshot {
  hour: number;
  value: number;
  cash: number;
}

export interface AgentData extends AgentConfig {
  rank: number;
  portfolio: Portfolio;
  trades: Trade[];
  reasoningLogs: ReasoningLog[];
  portfolioHistory: PortfolioSnapshot[];
}

export interface Competition {
  start: string;
  end: string;
  durationHours: number;
  startingCapital: number;
}

export interface AgentsResponse {
  agentData: Record<string, AgentData>;
  tokenPrices: Record<string, number>;
  rankings: AgentData[];
  competition: Competition | null;
  live: boolean;
}

// Trading-agent API response shapes
export interface AgentDashboardResponse {
  info: {
    name: string;
    model: string;
    walletAddress: string;
    startedAt: string;
    competitionStart: string | null;
    competitionDurationDays: number;
    startingCapital: number;
  };
  portfolio: {
    totalUsd: number;
    cash: number;
    positions: Array<{
      chain: string;
      chainId: number;
      token: string;
      symbol: string;
      balance: string;
      balanceUsd: number;
      priceUsd: number;
    }>;
  } | null;
  stats: {
    totalCycles: number;
    totalTrades: number;
    winRate: number;
    avgGain: number;
    avgLoss: number;
    bestTrade: number | null;
    worstTrade: number | null;
  };
  metrics: {
    pnl: number;
    pnlPct: number;
    maxDrawdown: number;
    sharpeRatio: number | null;
  };
  recentTrades: AgentTradeResponse[];
  latestReasoning: unknown;
  portfolioHistory: Array<{ timestamp: string; value: number }>;
}

export interface AgentTradeResponse {
  id: number;
  cycle_id: number;
  from_token: string;
  from_chain: number;
  to_token: string;
  to_chain: number;
  amount_usd: number;
  tx_hash: string | null;
  status: 'pending' | 'executed' | 'failed';
  executed_price: number | null;
  pnl_percent: number | null;
  rationale: string | null;
  type: 'BUY' | 'SELL' | 'SWAP';
  fromSymbol: string;
  toSymbol: string;
  summary: string;
}

export interface AgentHistoryCycle {
  cycleId: number;
  cycleNumber: number;
  timestamp: string;
  trades: AgentTradeResponse[];
  portfolioValueAfter: number | null;
  reasoning: unknown;
}
