// Agent configurations and mock trading data
// The 5 chosen frontier AI models for Agentic Quant Wars

export const AGENTS = [
  {
    id: 'gpt',
    name: 'GPT-4o',
    model: 'OpenAI',
    color: '#10a37f',
    colorLight: '#10a37f33',
    avatar: 'G',
    strategy: 'Momentum-driven with macro sentiment analysis',
    personality: 'Calculated, methodical, risk-aware',
  },
  {
    id: 'claude',
    name: 'Claude Opus',
    model: 'Anthropic',
    color: '#d4a574',
    colorLight: '#d4a57433',
    avatar: 'C',
    strategy: 'Value investing with contrarian positions',
    personality: 'Thoughtful, contrarian, patient',
  },
  {
    id: 'gemini',
    name: 'Gemini Ultra',
    model: 'Google',
    color: '#4285f4',
    colorLight: '#4285f433',
    avatar: 'Ge',
    strategy: 'Diversified quant with ML pattern recognition',
    personality: 'Data-obsessed, adaptive, multi-signal',
  },
  {
    id: 'grok',
    name: 'Grok-3',
    model: 'xAI',
    color: '#f5f5f5',
    colorLight: '#f5f5f533',
    avatar: 'Gk',
    strategy: 'High-frequency sentiment arbitrage via X/Twitter signals',
    personality: 'Aggressive, meme-aware, volatile',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek-R1',
    model: 'DeepSeek',
    color: '#6c5ce7',
    colorLight: '#6c5ce733',
    avatar: 'D',
    strategy: 'Deep reasoning with chain-of-thought analysis',
    personality: 'Analytical, deliberate, thesis-driven',
  },
];

// Top crypto assets from CoinMarketCap Top 300 universe
export const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', sector: 'Layer 1', price: 97250.00 },
  { symbol: 'ETH', name: 'Ethereum', sector: 'Layer 1', price: 3420.50 },
  { symbol: 'SOL', name: 'Solana', sector: 'Layer 1', price: 178.30 },
  { symbol: 'AVAX', name: 'Avalanche', sector: 'Layer 1', price: 38.90 },
  { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle', price: 18.75 },
  { symbol: 'ARB', name: 'Arbitrum', sector: 'Layer 2', price: 1.12 },
  { symbol: 'ONDO', name: 'Ondo Finance', sector: 'RWA', price: 1.48 },
  { symbol: 'AAVE', name: 'Aave', sector: 'DeFi', price: 285.60 },
  { symbol: 'UNI', name: 'Uniswap', sector: 'DeFi', price: 12.45 },
  { symbol: 'DOGE', name: 'Dogecoin', sector: 'Meme', price: 0.182 },
];

// Alias for backward compat with mock engine
export const STOCKS = TOKENS;

// Starting capital — $2,000 USDC per agent
export const STARTING_CAPITAL = 2000;

// Competition duration — LIVE now, ends ~6 days from now
const _now = new Date();
const _start = new Date(_now);
_start.setDate(_start.getDate() - 1);
_start.setHours(9, 30, 0, 0);
const _end = new Date(_now);
_end.setDate(_end.getDate() + 6);
_end.setHours(16, 0, 0, 0);

export const COMPETITION_START = _start;
export const COMPETITION_END = _end;
export const COMPETITION_DURATION_HOURS = 168;
