# PSX Long-Term Investment Research Agent — Specification

> **What this is:** An AI-powered research tool for long-term Pakistan Stock Exchange (PSX) screening. It does **not** execute trades and does **not** provide binding investment advice. It produces structured, explainable reports and enforces a human-review checkpoint before results are treated as actionable.

---

## Table of Contents

1. [What the system does (plain language)](#1-what-the-system-does-plain-language)
2. [LangGraph workflow basics](#2-langgraph-workflow-basics)
3. [Pipeline (implemented v1) — 8 nodes](#3-pipeline-implemented-v1--8-nodes)
4. [Scoring model (implemented)](#4-scoring-model-implemented)
5. [User inputs and schemas](#5-user-inputs-and-schemas)
6. [Data sources, tooling, and freshness](#6-data-sources-tooling-and-freshness)
7. [Compliance, guardrails, and human review](#7-compliance-guardrails-and-human-review)
8. [API contract (current)](#8-api-contract-current)
9. [Storage and audit trail](#9-storage-and-audit-trail)
10. [Known limitations and next-step questions](#10-known-limitations-and-next-step-questions)

---

## 1. What the System Does (Plain Language)

A user submits an investment profile (goal, horizon, risk, Shariah requirement, and optional preferences). The agent then:

1. Parses the profile from intake input
2. Selects a candidate PSX universe
3. Fetches data per symbol (fundamentals, prices, dividends, company info, announcements)
4. Validates data freshness and flags stale/missing points
5. Scores each company across weighted factors
6. Ranks companies and generates neutral explanations
7. Compiles global assumptions/risks/data gaps into a report
8. Pauses at human review, then resumes on approval/rejection

The output is explicitly **research-oriented** and framed with a mandatory disclaimer.

---

## 2. LangGraph Workflow Basics

This project uses `@langchain/langgraph` with:

- A typed shared state (`ResearchState`)
- A fixed linear node sequence
- Checkpointing via `MemorySaver`
- Human-in-the-loop pause/resume using `interrupt(...)` and `Command({ resume })`

High-level graph:

```
START
  -> parseProfile
  -> selectUniverse
  -> gatherData
  -> validateFreshness
  -> scoreCompanies
  -> rankExplain
  -> compileRisks
  -> humanReviewGate
  -> END
```

---

## 3. Pipeline (Implemented v1) — 8 Nodes

### Node 1 — `parseProfile`
- **Purpose:** Convert raw intake into `InvestmentProfile`
- **Primary path:** strict schema parse (`RawIntakeSchema -> InvestmentProfileSchema`)
- **Fallback path:** LLM extraction to JSON if schema parse fails
- **Final fallback:** conservative defaults if LLM extraction also fails
- **Status values:** `profile_parsed`, `profile_parsed_fallback`

### Node 2 — `selectUniverse`
- **Purpose:** Resolve candidate symbols to screen
- **Inputs:** `shariahOnly`, `sectorPreferences`, `MAX_CANDIDATES` (env, default `25`)
- **Behavior:**
  - Starts from a liquid seed universe
  - Expands with `/symbols` data when available
  - Applies optional sector broadening using sector stats
  - Applies Shariah filtering from fundamentals flags/index metadata
- **Output:** `candidates` list
- **Status:** `universe_selected`

### Node 3 — `gatherData`
- **Purpose:** Build a `CompanyBundle` for each candidate (parallelized with pool concurrency `4`)
- **Per bundle fields:**
  - `fundamentals`
  - `dividends`
  - `klines`
  - `company`
  - `announcements`
  - `eodFallback` (when primary price history is short)
  - `freshness`
  - `dataGaps`
- **Status:** `data_gathered`

### Node 4 — `validateFreshness`
- **Purpose:** Collect stale-data and missing-timestamp issues
- **Behavior:** scans bundle freshness labels and fundamentals timestamp presence
- **Output:** `freshnessIssues[]`
- **Status:** `freshness_validated`

### Node 5 — `scoreCompanies`
- **Purpose:** Calculate weighted scores and ranking
- **Behavior:**
  - Fetches optional sector stats
  - Computes sector median P/E reference
  - Scores each bundle with profile-aware weights
  - Ranks descending by `overallScore`
- **Status:** `scored`

### Node 6 — `rankExplain`
- **Purpose:** Add narrative explanation per company
- **Behavior:**
  - Uses LLM when configured
  - Falls back to deterministic narrative builder on failure/no-config
  - Sanitizes prohibited investment-advice language
- **Status:** `explained`

### Node 7 — `compileRisks`
- **Purpose:** Build final report object
- **Behavior:**
  - Aggregates global assumptions/risks/data gaps/freshness summary
  - Enforces guardrails and final schema validation
  - Forces `humanReviewRequired = true`
- **Status:** `awaiting_human_review`

### Node 8 — `humanReviewGate`
- **Purpose:** Pause for explicit human review and disclaimer acknowledgment
- **Mechanism:** `interrupt(...)` payload includes disclaimer and top companies
- **Resume input:** `{ approved: boolean, note?: string }`
- **Status values:** `human_reviewed` or `review_rejected`

---

## 4. Scoring Model (Implemented)

Each company is scored from 0-100 by weighted factor aggregation.

### Factor set (8 factors)

1. `fundamentals`
2. `progression`
3. `valuation`
4. `dividends`
5. `liquidity`
6. `sectorOutlook`
7. `news`
8. `shariah`

### Base weights (moderate profile)

| Factor | Weight |
|---|---:|
| fundamentals | 15 |
| progression | 15 |
| valuation | 12 |
| dividends | 12 |
| liquidity | 10 |
| sectorOutlook | 10 |
| news | 8 |
| shariah | 18 |

### Profile-based weight changes

- **Conservative:** higher dividends/liquidity/valuation, lower progression
- **Growth/Aggressive:** higher progression/fundamentals, lower dividends/valuation

### Fit threshold

- `fitsCriteria = overallScore >= 55`
- If `shariahOnly=true`, fit additionally requires full Shariah pass (`shariah` factor at compliant level)

### Important implementation notes

- Fundamentals and valuation are currently based on available P/E and sector-relative heuristics
- Progression uses recent price history (klines or DPS EOD fallback when needed)
- News score uses keyword-driven positive/negative impact
- Output includes both `fitReasons` and `noFitReasons`, plus assumptions/risks/data gaps per company

---

## 5. User Inputs and Schemas

### Intake payload (`RawIntakeSchema`)

| Field | Type | Required |
|---|---|---|
| `goal` | string | Yes |
| `horizonYears` | number (coerced) | Yes |
| `riskTolerance` | string | Yes |
| `shariahOnly` | boolean (coerced) | Optional (default `false`) |
| `sectorPreferences` | string (comma-separated) | Optional |
| `capitalPkr` | number (coerced) | Optional |
| `notes` | string | Optional |

### Normalized profile (`InvestmentProfileSchema`)

- `riskTolerance` enum: `conservative | moderate | growth | aggressive`
- `horizonYears` range: `1..40`
- `sectorPreferences` normalized to string array

---

## 6. Data Sources, Tooling, and Freshness

## Primary data source

- `https://psxterminal.com/api`
  - `/symbols`
  - `/fundamentals/{symbol}`
  - `/dividends/{symbol}`
  - `/klines/{symbol}/1d?limit={n}`
  - `/companies/{symbol}`
  - `/stats/sectors`

## Fallback / supplemental source

- `https://dps.psx.com.pk`
  - `/timeseries/eod/{symbol}` (price fallback)
  - `/announcements/companies?symbol={symbol}` (best-effort announcement parse)

## Freshness TTLs (cache policy)

| Data type | TTL |
|---|---:|
| fundamentals | 24h |
| dividends | 7d |
| prices | 1h |
| announcements | 6h |
| company | 7d |

The agent records freshness labels and surfaces stale entries in report-level data-gap context.

---

## 7. Compliance, Guardrails, and Human Review

### Mandatory disclaimer

```
For research and education only — not investment advice.
Data may be delayed or incomplete; verify before any decision.
```

### Narrative safety guardrails

Banned/advice-like patterns are sanitized (examples): guaranteed returns, "you should buy", "strong buy", "no risk", and similar certainty language.

### Human review enforcement

- Report is generated with `humanReviewRequired: true`
- Workflow pauses at `humanReviewGate`
- Resume requires explicit approval payload
- Approval/rejection is recorded in run review storage

---

## 8. API Contract (Current)

### `POST /api/research`
- Starts a new run
- Validates intake
- Creates run + thread IDs
- Executes workflow through review interrupt
- Returns:
  - `runId`
  - `threadId`
  - `status`
  - `report` (when available)
  - `interrupted` flag

### `GET /api/research/:id`
- Returns saved run metadata and current report/status

### `POST /api/research/:id/approve`
- Resumes interrupted graph with review payload:
  - `{ approved: boolean, note?: string }`
- Persists review and updated run status/report

---

## 9. Storage and Audit Trail

When PostgreSQL is available, run state and audit artifacts are persisted (`research_runs`, `run_reviews`, cache tables, etc.).  
When DB is unavailable, repository methods fall back to in-memory maps so development can continue.

Persisted run fields include:
- input profile
- status transitions
- state snapshot (selected fields)
- generated report
- thread linkage for LangGraph resume
- reviewer acknowledgment and note

---

## 10. Known Limitations and Next-Step Questions

### Current limitations

- Some announcement parsing is best-effort from DPS HTML and may miss edge cases
- Scoring is heuristic and should not be treated as return prediction
- Data quality depends on upstream API availability and latency

### Open decisions for next iterations

1. Whether to upgrade announcement ingestion to more deterministic parsing/source coverage
2. Whether to add explicit red-flag hard penalties in core scorer (currently mostly factor-driven and narrative/risks-driven)
3. Whether to expose run progress milestones via streaming/status events
4. Whether to formalize profile goal taxonomy into stricter enums at intake level

---

*Last updated: June 2026 (aligned to current implementation in this repository).*
