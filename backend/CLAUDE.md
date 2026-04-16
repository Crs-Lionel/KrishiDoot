# Backend — Context for AI Agents
> FastAPI backend. Read root `CLAUDE.md` first for full contracts.

## Stack
- **FastAPI** + uvicorn — async API server
- **Pydantic v2** — request/response validation + LLM output enforcement
- **LangGraph** — agent orchestration (Person 2)
- **Gemini 1.5 Pro** — vision + dialogue (Person 2)
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

## Person 2: What Needs Implementing
1. `services/vision.py` — `grade_crop_image()` function is stubbed out, implement the Gemini API call
2. `agents/` — see `agents/CLAUDE.md` for full spec
3. Wire agents into `routes/negotiation.py` where `# TODO Person 2` comments are

## Important Constraints
- **Never** let `proposed_price < reservation_price` reach the buyer — `guardrails.enforce_floor()` must be called on every `AgentOutput`
- All LLM output must be parsed as `AgentOutput` Pydantic model — no free-form text
- APMC API returns ₹/quintal — `apmc_api.py` divides by 100 to give ₹/kg (already handled)
