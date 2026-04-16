# KrishiDoot.AI — Master Context File
> Read this first. Every AI agent working on this repo must read this file before touching any code.

## What is this?
An autonomous multi-agent AI negotiation system that acts as a **digital fiduciary for Indian smallholder farmers**, protecting them from price exploitation at APMC mandis. It uses real market data, computer vision crop grading, and game-theory-based negotiation strategies.

## Team & Ownership
| Person | Role | Owns |
|--------|------|------|
| Person 1 (Crs-Lionel) | Backbone + Infra | `backend/main.py`, `config.py`, `models/`, `routes/`, `services/apmc_api.py`, `services/guardrails.py`, `agents/strategies.py`, `db/`, `telegram_bot/` |
| Person 2 | AI Brain | `backend/agents/farmer_agent.py`, `agents/buyer_agent.py`, `agents/orchestrator.py`, `services/vision.py` |
| Person 3 | Frontend | `frontend/` |

**Rule: If you change a Pydantic model or add/remove an endpoint, update this file and the relevant subfolder CLAUDE.md in the same commit.**

---

## API Contracts (Pydantic Models — source of truth)

### `POST /negotiate/start`
```
Input:  NegotiationStartRequest  { farmer_id: str, crop_type: str, quantity_kg: float, mandi_location: str, crop_image_b64: str|None }
Output: NegotiationStartResponse { session_id: str, batna_price: float, initial_ask: float, grade_report: dict|None }
```

### `POST /negotiate/respond`
```
Input:  NegotiationRespondRequest  { session_id: str, buyer_counter_offer: float }
Output: NegotiationRespondResponse { agent_dialogue: str, new_ask: float, status: "ongoing"|"agreed"|"rejected", final_price: float|None }
```

### `GET /market/price?crop=tomato&state=karnataka`
```
Output: { crop: str, state: str, modal_price_per_kg: float, unit: "INR/kg" }
```

### `POST /grade/crop`
```
Input:  GradeRequest  { image_b64: str, crop_type: str }
Output: GradeResponse { grade: "A"|"B"|"C", defects: list[str], estimated_price_band: str, confidence: float, agmark_standard: str }
```

### Internal: `AgentOutput` (LLM must output this exact JSON)
```
{ proposed_price: float, dialogue: str, strategy_used: "boulware"|"conceder" }
```

---

## Key Architecture Decisions
- **BATNA** = `modal_price - transport_cost(₹2/kg)` — absolute floor, enforced by `services/guardrails.py`
- **Boulware strategy** → non-perishables (wheat, rice) — hold price, concede late
- **Conceder strategy** → perishables (tomato, greens) — concede fast to close deal
- **Gemini 1.5 Pro Vision** → zero-shot Agmark grading from crop photo
- **LangGraph MultiAgentState** → shared state passed between farmer/buyer agent nodes
- **Supabase** → sessions + contracts tables (row_hash = mock blockchain ledger)
- **No Docker** — run backend with `uvicorn main:app --reload`, frontend with `npm run dev`

---

## .env Keys Required
```
DATA_GOV_API_KEY=   # data.gov.in production key (NOT DEMO_KEY — 30 req/hr limit)
GEMINI_API_KEY=     # Google AI Studio
SUPABASE_URL=       # supabase.com project URL
SUPABASE_KEY=       # supabase anon key
TELEGRAM_BOT_TOKEN= # from @BotFather on Telegram
```

---

## How to Run
```bash
# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in your keys
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL
npm run dev

# Telegram bot (separate terminal)
cd backend
python -m telegram_bot.bot
```

## Phone Access (same WiFi)
1. `ipconfig` → find IPv4 address (e.g. 192.168.1.45)
2. Set `VITE_API_URL=http://192.168.1.45:8000` in frontend/.env
3. Open `http://192.168.1.45:5173` on phone

---

## Changelog
| Date | Who | What |
|------|-----|------|
| 2026-04-16 | Person 1 | Initial scaffold: models, routes, services, agents stubs, telegram bot, frontend skeleton |
