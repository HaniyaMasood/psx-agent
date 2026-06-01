# PSX Long-Term Investment Research Agent

LangGraph-powered research agent for the **Pakistan Stock Exchange (PSX)**. It screens companies using fundamentals, multi-year price progression, valuation, dividends, liquidity, sector outlook, announcements, and Shariah-compliance — then ranks them with **transparent scoring**, explains fit/no-fit, and requires **human review** before any decision use.

> **Not investment advice.** This tool is for research and education only.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **LangGraph.js** — stateful agent workflow with human-in-the-loop interrupt
- **Knex.js + PostgreSQL** — cache + audit trail (optional; in-memory fallback if DB unavailable)
- **LLM** — OpenAI-compatible API (`@langchain/openai`): Grok, LibreChat gateway, or OpenAI

## Data sources

| Source | Used for |
|--------|----------|
| [psxterminal.com](https://psxterminal.com) API | Symbols, fundamentals, dividends, klines, company info, sector stats |
| [dps.psx.com.pk](https://dps.psx.com.pk) | EOD timeseries fallback, announcements (best-effort) |
| KMI / `isNonCompliant` flags | Shariah screening explanations |

PSX official data has usage restrictions for commercial redistribution. This project is for personal research; obtain a PSX data license for production/commercial use.

## Quick start

```bash
cp .env.example .env
# Set LLM_API_KEY, LLM_BASE_URL, LLM_MODEL (optional for narratives)
# Set DATABASE_URL if using PostgreSQL

npm install
npm run db:migrate   # creates `psx_agent` DB if missing, then runs migrations
npm run dev
```

If you see `database "psx_agent" does not exist`, either run `npm run db:migrate` (it auto-creates the DB) or manually:

```bash
createdb psx_agent
# or: psql -U postgres -c "CREATE DATABASE psx_agent;"
```

Open [http://localhost:3000](http://localhost:3000), fill the intake form, and wait for the research run (may take 1–3 minutes depending on candidate count).

### Sample scoring (no LLM)

```bash
npm run sample:run
```

## Environment

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | API key for Grok / LibreChat / OpenAI-compatible gateway |
| `LLM_BASE_URL` | e.g. `https://api.x.ai/v1` or your LibreChat URL |
| `LLM_MODEL` | Must match a model your gateway exposes (e.g. `grok-2-latest` on x.ai, or `groq/llama-3.3-70b-versatile` on LiteLLM). Run `npm run test:llm` to verify. |
| `DATABASE_URL` | PostgreSQL connection string |
| `MAX_CANDIDATES` | Max symbols to screen (default `25`) |

Without `LLM_API_KEY`, the agent still runs; company narratives use rule-based fallback text.

## Agent flow

1. **parseProfile** — structured investment profile from intake
2. **selectUniverse** — candidate symbols (Shariah filter, sectors, liquid universe)
3. **gatherData** — parallel fetch per symbol (cached in Postgres when available)
4. **validateFreshness** — TTL checks and stale-data flags
5. **scoreCompanies** — deterministic weighted scores (risk-profile weights)
6. **rankExplain** — LLM narratives (optional) with banned-advice sanitization
7. **compileRisks** — global assumptions, risks, data gaps, disclaimer
8. **humanReviewGate** — LangGraph interrupt; resume via approve API

## API

- `POST /api/research` — start a research run
- `GET /api/research/:id` — fetch run status + report
- `POST /api/research/:id/approve` — resume graph after human review `{ "approved": true, "note": "..." }`

## Project layout

```
app/                    # Next.js pages + API routes
components/             # Intake form, results dashboard, disclaimer
lib/agent/              # LangGraph graph, nodes, scoring, guardrails
lib/psx/                # PSX clients, cache, tools, Shariah helpers
lib/db/                 # Knex, migrations, repositories
lib/schemas/            # Zod profile + report schemas
scripts/                # migrate, sample-run
```

## License

MIT — use at your own risk. Always consult licensed professionals before investing.
