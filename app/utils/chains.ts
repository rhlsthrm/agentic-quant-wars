export interface ChainInfo {
  name: string;
  short: string;
  color: string;
}

const CHAINS: Record<number, ChainInfo> = {
  1: { name: 'Ethereum', short: 'ETH', color: '#627EEA' },
  10: { name: 'Optimism', short: 'OPT', color: '#FF0420' },
  56: { name: 'BNB Chain', short: 'BNB', color: '#F0B90B' },
  100: { name: 'Gnosis', short: 'GNO', color: '#04795B' },
  137: { name: 'Polygon', short: 'POL', color: '#8247E5' },
  250: { name: 'Fantom', short: 'FTM', color: '#1969FF' },
  324: { name: 'zkSync', short: 'ZKS', color: '#8C8DFC' },
  8453: { name: 'Base', short: 'BASE', color: '#0052FF' },
  42161: { name: 'Arbitrum', short: 'ARB', color: '#12AAFF' },
  43114: { name: 'Avalanche', short: 'AVAX', color: '#E84142' },
  534352: { name: 'Scroll', short: 'SCR', color: '#FFEEDA' },
  59144: { name: 'Linea', short: 'LNA', color: '#61DFFF' },
  1101: { name: 'Polygon zkEVM', short: 'ZKEVM', color: '#8247E5' },
};

const FALLBACK: ChainInfo = { name: 'Unknown', short: '???', color: '#888888' };

export function getChainInfo(chainId: number | null | undefined): ChainInfo {
  if (chainId == null) return FALLBACK;
  return CHAINS[chainId] ?? { name: `Chain ${chainId}`, short: `${chainId}`, color: '#888888' };
}
