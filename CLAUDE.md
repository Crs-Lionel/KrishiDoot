# KrishiDoot.AI — Project Context for AI Agents

## Current Status: Integration complete, hackathon-ready + Crop Journey feature added

## HOW TO RUN (copy-paste)

```cmd
REM Terminal 1 — Backend
cd backend
python -m uvicorn main:app --reload

REM Terminal 2 — Frontend (run once after git pull: npm install)
cd frontend
npm install
npm run dev

REM Terminal 3 — Telegram bot (optional)
cd backend
python -m telegram_bot.bot
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Swagger: http://localhost:8000/docs

## Stack
- **FastAPI** + uvicorn — async API server
- **Pydantic v2** — request/response validation + LLM output enforcement
- **LangGraph** — agent orchestration
- **Gemma 3** (`gemma-3-27b-it`) — negotiation dialogue agent (Hinglish)
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) — crop vision grading (multimodal)
- **Supabase** — PostgreSQL DB (optional — sessions work in-memory without it)
- **python-telegram-bot** — Telegram interface
- **React 18 + Vite** — frontend at `frontend/` (`npm run dev` → localhost:5173)
- **react-leaflet + leaflet** — APMC mandi map with ranked pins
- **jsPDF** — client-side PDF receipt generation after negotiation

## Environment Setup
All keys go in `backend/.env`:
```
GEMINI_API_KEY=<key>
DATA_GOV_API_KEY=DEMO_KEY   # real API, limited to 30 req/hr
TELEGRAM_BOT_TOKEN=<token>
SUPABASE_URL=               # optional
SUPABASE_KEY=               # optional
```

## Folder Ownership
```
backend/
  main.py              → Person 1 (done)
  config.py            → Person 1 (done)
  models/              → Person 1 (done — read before touching routes)
  routes/
    negotiation.py     → Done (LangGraph wired in, grade-adjusted initial ask)
    grading.py         → Done
    market_data.py     → Done (mandis with lat/lon, fallback prices)
  services/
    apmc_api.py        → Done (MANDI_DB + coords, get_mandi_prices, FALLBACK_PRICES; get_modal_price uses local DB when DEMO_KEY set — no live API hit)
    vision.py          → Done (Gemini 2.5 Flash, auto-detect crop_type="auto")
    guardrails.py      → Done
  agents/              → Done (farmer_agent Hinglish, buyer_agent, orchestrator)
  db/schema.sql        → Person 1 (run once in Supabase SQL editor)
  telegram_bot/        → Person 1 (done)

frontend/
  src/pages/
    Landing.jsx        → Done (GSAP animated marketing page)
    Grade.jsx          → Done (upload → grade → "Start Negotiation" auto-start CTA)
    Negotiate.jsx      → Done (multi-crop tabs, auto-start, PDF receipt, voice)
    Market.jsx         → Done (Leaflet map with ranked pins + mandi cards)
  src/components/ui.jsx → shared UI primitives (INPUT_CLS, SELECT_CLS, ErrorAlert, SpinnerIcon, LeafIcon, AlertIcon, InfoIcon)
    CropJourney.jsx    → Done (beejai-to-bikri journey: AI questions, task calendar, weather, subsidies, report; auto-detected month + hardcoded schemes)
  src/App.jsx          → Done (glassmorphism header + LIVE badge, 4-tab nav: Grade/Negotiate/Prices/Grow)
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/negotiate/start` | Start session — returns `session_id`, `batna_price`, `initial_ask` (grade-adjusted) |
| POST | `/negotiate/respond` | Send buyer counter-offer — returns agent dialogue + new ask |
| POST | `/grade/crop` | Base64 image → Agmark grade (A/B/C) + price band |
| GET | `/market/price?crop=&state=` | APMC modal price + fallback if rate-limited |
| GET | `/market/mandis?crop=&state=` | 3-4 nearby mandis ranked by net value — includes lat/lon for map pins |
| GET | `/docs` | Swagger UI |
| POST | `/crop-journey/questions` | AI-generated onboarding questions (optional land photo) |
| POST | `/crop-journey/analyze` | Analyze land + answers → crop recommendation + weather |
| POST | `/crop-journey/start` | Start journey → generate AI task calendar (all weeks) |
| GET | `/crop-journey/{id}` | Get full journey state |
| GET | `/crop-journey/{id}/weather` | 5-day weather via wttr.in (no API key) |
| POST | `/crop-journey/{id}/task` | Toggle task completion |
| POST | `/crop-journey/{id}/photo-check` | Gemini photo health analysis |
| GET | `/crop-journey/{id}/subsidies` | PIB RSS govt scheme alerts |
| POST | `/crop-journey/{id}/complete` | Mark sold → generate journey report |
| GET | `/crop-journey/{id}/report` | Final PDF-ready report |

## Feature: Crop Journey (Fasal Journey) — Beejai to Bikri
1. Farmer enters location + month (auto-detected via `new Date()`, shown read-only with "Badlo" override toggle), optionally uploads land photo
2. Gemini generates 6 Hinglish onboarding questions (soil, water, budget, experience); when land photo is provided, Gemini adds `detected_from_photo` field to questions it can answer from the image — frontend auto-pre-fills those answers and shows a "📷 Photo se detect hua" badge
3. AI analyzes answers + weather → recommends best crop with yield/income estimate
4. Farmer picks sowing date + land size → AI generates week-by-week task calendar
5. Dashboard: Tasks tab (checkbox per task), Weather tab (wttr.in forecast + advisory), Subsidies tab (PIB RSS + hardcoded schemes), Timeline tab
6. Photo Check: upload crop photo at any week → Gemini returns health score + immediate action + subsidy tip
7. Journey Complete: enter selling price → AI generates profit/loss report → PDF download
- Journey state stored in-memory (`_journeys` dict in `routes/crop_journey.py`) — lost on restart
- Journey ID persisted in localStorage (`kd_journey_id`) — auto-restores on page reload
- Sahayata tab: always shows `HARDCODED_SCHEMES` (19 schemes — 4 national + state-specific for MH/PB/UP/RJ/MP/KA/GJ/HR); `extractState(location)` parses city/state name from location string to filter relevant state schemes; live PIB RSS results shown above if available

## Feature: Grade → Negotiate Seamless Flow
1. User uploads crop photo on `/grade`
2. Gemini 2.5 Flash returns: grade (A/B/C), detected crop, price band, confidence
3. "Start Negotiation" button stores grade in localStorage + sets `kd_autostart=1`
4. `/negotiate` auto-detects the flag, pre-fills crop, passes `crop_grade` to backend
5. `/negotiate/start` adjusts `initial_ask` based on grade:
   - **Grade A**: `modal_price × 1.25` (25% premium)
   - **Grade B**: `modal_price × 1.15` (15% — default)
   - **Grade C**: `modal_price × 1.05` (5%)
6. Negotiation chat starts immediately — no extra clicks

## Feature: APMC Mandi Map
- `/market/mandis` now returns `lat` and `lon` for each mandi (from `_MANDI_COORDS` dict, 90+ mandis)
- `Market.jsx` renders a Leaflet map (CARTO dark tiles, no API key needed)
- Pins: gold = rank 1, silver = rank 2, gray = rank 3+; popup shows price + net value
- Map auto-fits bounds to show all pins

## Feature: PDF Receipt
- After all negotiations complete, "Download Receipt" button appears
- Uses `jsPDF` (client-side only, no backend)
- Receipt includes: header with green branding, receipt number, date, crop table with grade/price/total, BATNA vs agreed price, total revenue
- Saved as `KrishiDoot-Receipt-KD-YYYYMMDD-XXXX.pdf`

## Known Issues / Remaining Work
- Supabase not wired — sessions lost on server restart (acceptable for demo)
- DEMO_KEY rate-limited at 30 req/hr — `get_modal_price` and `get_mandi_prices` both skip live API and read from local `_MANDI_DB` / `FALLBACK_PRICES` when `DEMO_KEY` is set
- Gemini 2.5 Flash grading: if API call fails, returns fallback (Grade B, 35% confidence)
- Telegram bot negotiation uses simple stub logic, not LangGraph
- Voice (STT/TTS) uses Web Speech API (hi-IN) — works on Chrome/Edge, not Safari/Firefox
- Multi-crop negotiation: up to 5 parallel sessions, each a separate LangGraph state instance
- Crop auto-detection: send crop_type="auto" to /grade/crop — Gemini identifies crop from image
- Farmer agent speaks Hinglish (Hindi+English mix) via gemma-3-27b-it
- Leaflet map uses CARTO dark tiles (free, no key) — requires internet connection

## Important Constraints
- **`crop_ai.py` uses `await client.aio.models.generate_content()`** (async Gemini API) for ALL calls — do NOT revert to sync `client.models.generate_content()`, which causes "client has been closed" errors in FastAPI async context


- **Never** let `proposed_price < reservation_price` reach the buyer — `guardrails.enforce_floor()` enforced in `routes/negotiation.py`
- All LLM output parsed as `AgentOutput` Pydantic model — no free-form text
- `NegotiationStartRequest` has `extra="forbid"` — only send fields: `farmer_id, crop_type, quantity_kg, mandi_location, crop_image_b64, crop_grade`
- APMC API returns ₹/quintal — `apmc_api.py` divides by 100 to give ₹/kg (already handled)
- `/market/mandis` uses curated OGD Platform bulk dataset as fallback — covers 13 states × 12 crops with real APMC market names, distances, arrivals, and price trends
- Net value per mandi = `modal_price − (distance_km × transport_rate_per_km)` — farmer inputs ₹/kg/km rate (default ₹0.025)
- `FALLBACK_PRICES` dict in `services/apmc_api.py` (single source of truth)
- `_MANDI_COORDS` dict in `services/apmc_api.py` — 90+ APMC markets with lat/lon; `_enrich_coords()` called in both `get_mandi_prices()` and `_fetch_mandis_from_api()`

## Dependencies
Install with: `pip install -r backend/requirements.txt`
Note: `supabase==2.4.6` and `python-telegram-bot==21.3` pin `websockets==12.0` which conflicts with `google-genai`. Fix: `pip install "websockets>=13.0,<17.0"` after requirements install.

New backend package: `feedparser>=6.0.0` — RSS feed parsing for subsidy alerts (no extra API key needed).

Frontend packages (installed via `npm install` in `frontend/`):
- `react-leaflet@^4.2.1` + `leaflet@^1.9.4` — interactive mandi map
- `jspdf@^2.5.1` — PDF receipt + journey report generation
