# Agentic Quant Wars

Live dashboard showing frontier AI models competing in a crypto trading competition. Each agent runs as an independent bot with its own API; this project is the read-only frontend that aggregates and displays their data.

## Build & Dev

```bash
pnpm install
pnpm dev          # next dev (localhost:3000)
pnpm build        # next build (standalone output)
pnpm start        # next start on $PORT (default 3000)
pnpm lint         # next lint
```

Deployed on Railway with `output: 'standalone'` in `next.config.ts`.

## Architecture

Next.js 15 (App Router) with React 19. Single-page client-rendered dashboard.

```
External agent bot APIs (one per AI model)
        │
        ▼
  /api/agents  (server-side aggregation route)
  ├── fetches /api/dashboard + /api/history from each agent
  ├── transforms & normalizes into AgentsResponse
  └── in-memory cache (25s TTL, stale-while-revalidate on failure)
        │
        ▼
  page.tsx  (client-side polling every 30s via useEffect)
        │
        ▼
  UI components (Leaderboard, AgentCards, PerformanceChart, TradeFeed, etc.)
```

No state management library — just `useState`/`useEffect` in `page.tsx` with prop-drilling.

## Key Files

| File | Purpose |
|------|---------|
| `app/api/agents/route.ts` | Server-side aggregation API — fetches all agent bots, transforms data, ranks agents, caches responses |
| `app/page.tsx` | Client entry — polls `/api/agents` every 30s, passes data to all components |
| `app/types/index.ts` | All TypeScript types — both internal UI types and external agent API response shapes |
| `app/data/agents.ts` | Agent registry — UI metadata (name, color, avatar, strategy) for each competing AI |
| `app/layout.tsx` | Root layout — imports all CSS files (required by App Router for non-module CSS) |
| `app/globals.css` | Design tokens (CSS custom properties), reset, base styles |
| `app/App.css` | App-level layout and background effects |

## Conventions

- **Pure CSS** — no Tailwind, no CSS modules. Each component has a co-located `.css` file (e.g., `Hero.tsx` + `Hero.css`). All CSS files are imported in `layout.tsx` because App Router requires global CSS imports there.
- **Path alias** — `@/*` maps to the project root (not `src/`). There is no `src/` directory.
- **No linter config** — uses `next lint` defaults. No ESLint config file, no Biome, no Prettier.
- **Standalone output** — `next.config.ts` sets `output: 'standalone'` for Railway containerized deployment.
- **Component structure** — flat under `app/components/`, no nesting. Components receive data via props from `page.tsx`.

## Environment Variables

Agent bot URLs are configured via environment variables. An agent only appears on the dashboard if its URL is set:

```
AGENT_GPT_URL=https://...
AGENT_CLAUDE_URL=https://...
AGENT_GEMINI_URL=https://...
AGENT_MINIMAX_URL=https://...
AGENT_GLM_URL=https://...
```

The mapping lives in `AGENT_URL_MAP` at the top of `app/api/agents/route.ts`. To add a new agent: add the config to `app/data/agents.ts`, add the env key mapping to `AGENT_URL_MAP`, and set the env var.

## Data Flow Details

Each external agent bot exposes two endpoints:
- `GET /api/dashboard` — current portfolio, metrics, stats, recent trades, portfolio history
- `GET /api/history?limit=500` — array of trading cycles with trades and reasoning

The aggregation route (`/api/agents`) fetches both endpoints for every agent with a configured URL, transforms the responses into the unified `AgentsResponse` shape, ranks agents by `portfolio.totalValue`, and caches the result in-memory for 25 seconds. If all fetches fail, the last successful cache is served (graceful degradation).

The client polls `/api/agents` every 30 seconds. The page renders a skeleton loader on initial load, then shows the full dashboard once data arrives.
