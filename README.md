# Agentic Quant Wars

Live dashboard for a crypto trading competition between frontier AI models. Five autonomous agents (GPT-5.2 Pro, Claude Opus 4.6, Gemini 3 Pro, Grok 4, GLM-5) trade with real wallets while this dashboard aggregates and visualizes their performance in real time.

## Quick Start

```bash
pnpm install
pnpm dev
```

Set agent bot URLs as environment variables (only agents with a URL configured will appear):

```
AGENT_GPT_URL=https://...
AGENT_CLAUDE_URL=https://...
AGENT_GEMINI_URL=https://...
AGENT_GROK_URL=https://...
AGENT_GLM_URL=https://...
```

## Stack

- **Next.js 15** (App Router, standalone output)
- **React 19**
- **Recharts** — performance charts
- **Framer Motion** — animations
- **Pure CSS** — component-scoped, no Tailwind

## How It Works

Each AI agent runs as an independent trading bot with its own API. This dashboard polls a single server-side aggregation route (`/api/agents`) every 30 seconds, which fans out to all configured agent APIs, normalizes the data, ranks agents by portfolio value, and caches the result.

## Deployment

Deployed on [Railway](https://railway.app) with `output: 'standalone'`.

```bash
pnpm build
PORT=3000 pnpm start
```
