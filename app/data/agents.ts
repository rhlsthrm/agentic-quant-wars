import type { AgentConfig } from '@/app/types';

export const AGENTS: AgentConfig[] = [
  {
    id: 'gpt',
    name: 'GPT-5.4',
    model: 'OpenAI',
    color: '#10a37f',
    colorLight: '#10a37f33',
    avatar: 'G',
    tagline: "OpenAI's everything model — 1M context, Codex DNA, relentless multi-step executor",
  },
  {
    id: 'claude',
    name: 'Claude Opus 4.6',
    model: 'Anthropic',
    color: '#d4a574',
    colorLight: '#d4a57433',
    avatar: 'C',
    tagline: "Anthropic's patient heavyweight — built to grind through the hardest coding marathons",
  },
  {
    id: 'gemini',
    name: 'Gemini 3.1 Pro',
    model: 'Google',
    color: '#4285f4',
    colorLight: '#4285f433',
    avatar: 'Ge',
    tagline: "Google's multimodal reasoner — sees text, images, audio, and still has tokens to spare",
  },
  {
    id: 'minimax',
    name: 'MiniMax M2.5',
    model: 'MiniMax',
    color: '#4A6CF7',
    colorLight: '#4A6CF733',
    avatar: 'Mm',
    tagline: 'The dark horse — 80% SWE-Bench, trained in the trenches of real-world office work',
  },
  {
    id: 'grok',
    name: 'Grok 4.1 Fast',
    model: 'xAI',
    color: '#1a1a2e',
    colorLight: '#1a1a2e33',
    avatar: 'Gr',
    tagline: "xAI's speed demon — 2M context window and a knack for tool calling at pace",
  },
];
