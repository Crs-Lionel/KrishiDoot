# Backend — Context for AI Agents
> FastAPI backend. Read root `CLAUDE.md` first for full contracts.

## Stack
- **FastAPI** + uvicorn — async API server
- **Pydantic v2** — request/response validation + LLM output enforcement
- **LangGraph** — agent orchestration (Person 2)
- **Gemma 3** (`gemma-3-27b-it`) — negotiation dialogue (farmer agent)
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) — crop vision grading
- **Supabase** — PostgreSQL DB, run `db/schema.sql` once to set up tables
- **python-telegram-bot** — Telegram interface (Person 1)

## Folder Ownership
```
main.py          → Person 1 (done — don't touch)
config.py        → Person 1 (done)
models/          → Person 1 (done — contracts, read before coding)
routes/          → Person 1 skeleton, Person 2 wires agents in
services/
  apmc_api.py    → Person 1 (done)
  vision.py      → Person 2 (implement Gemini Vision call)
  guardrails.py  → Person 1 skeleton, Person 2 adds NeMo Guardrails
agents/          → Person 2 (see agents/CLAUDE.md)
db/schema.sql    → Person 1 (done — run in Supabase SQL editor)
telegram_bot/    → Person 1 (done)
```

## All Implemented — Nothing Pending
- `services/vision.py` — Gemini 2.5 Flash multimodal grading, auto-detect mode
- `agents/` — LangGraph orchestrator + Hinglish farmer agent (Gemma 3-27b-it)
- `routes/negotiation.py` — grade-adjusted initial_ask (A=1.25×, B=1.15×, C=1.05×)
- `services/apmc_api.py` — 90+ mandi coordinates via `_MANDI_COORDS` + `_enrich_coords()`; `get_modal_price` uses local `_MANDI_DB`/`FALLBACK_PRICES` when `DEMO_KEY` is set (no live API call)
- `routes/crop_journey.py` — full beejai-to-bikri journey pipeline (10 endpoints)
- `services/crop_ai.py` — Gemini: onboarding questions, crop recommendation, task calendar, photo health, report
- `services/weather_api.py` — 5-day weather via wttr.in (free, no API key)
- `services/subsidy_rss.py` — PIB Agriculture RSS feed → govt scheme alerts (feedparser, 1hr cache)

## Important Constraints
- **Never** let `proposed_price < reservation_price` reach the buyer — `guardrails.enforce_floor()` must be called on every `AgentOutput`
- All LLM output must be parsed as `AgentOutput` Pydantic model — no free-form text
- APMC API returns ₹/quintal — `apmc_api.py` divides by 100 to give ₹/kg (already handled)
