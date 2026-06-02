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
- **GSAP 3** — animation library: `gsap.context()` for scoped cleanup, page transitions, stagger reveals
- **Space Grotesk** (display/headings) + **DM Sans** (body) — font stack via Google Fonts
- **Green-tinted dark palette** — custom Tailwind: `gray-950: #080c09`, `gray-900: #0d1410`, etc.
- **Global CSS tokens** — `--ease-out-expo`, `--dur-micro/ui/entrance`, reduced-motion support
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
    weather_api.py     → Done (wttr.in free API, 5-min cache; Gemini fallback if wttr.in fails → realistic AI-generated weather; static fallback if both fail; source field: wttr.in|ai_estimate|static_fallback)
    subsidy_rss.py     → Done (PIB Agriculture RSS feed, 1-hr cache, crop/state keyword filtering)
    crop_ai.py         → Done (all Crop Journey AI: 2-round questions, analyze+recommend, task calendar with per-week weather + detailed chemicals[], photo health check, adaptive plan update, journey report)
  agents/              → Done (farmer_agent Hinglish, buyer_agent, orchestrator)
  db/schema.sql        → Person 1 (run once in Supabase SQL editor)
  telegram_bot/        → Person 1 (done)

frontend/
  src/pages/
    Landing.jsx        → Done (GSAP animated marketing page)
    Grade.jsx          → Done (upload → grade → "Start Negotiation" auto-start CTA; GSAP timeline reveal: grade letter scale, stat stagger, confidence bar)
    Negotiate.jsx      → Done (multi-crop tabs, auto-start, PDF receipt, voice)
    Market.jsx         → Done (Leaflet map with ranked pins + mandi cards; GSAP map reveal + card stagger)
  src/components/ui.jsx → shared UI primitives (INPUT_CLS, SELECT_CLS, ErrorAlert, SpinnerIcon, LeafIcon, AlertIcon, InfoIcon)
    CropJourney.jsx    → Done (full beejai-to-bikri pipeline: 2-round weather-aware AI questions, adaptive task calendar, WeekCard, photo health check, auto plan update, PDF report)
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
| POST | `/crop-journey/questions` | Weather-aware AI onboarding questions (optional land photo); returns `weather` block |
| POST | `/crop-journey/followup-questions` | Round-2 targeted questions based on Round-1 answers + weather; returns `[]` if no follow-up needed |
| POST | `/crop-journey/analyze` | Analyze land + answers + weather → crop recommendation with `weather_fit`, `weather_warnings` |
| POST | `/crop-journey/start` | Start journey → AI task calendar (all weeks, each with `expected_weather` block) |
| GET | `/crop-journey/{id}` | Get full journey state (includes `plan_updates_count`, `plan_update_log`) |
| GET | `/crop-journey/{id}/weather` | 5-day weather via wttr.in (no API key) |
| POST | `/crop-journey/{id}/task` | Toggle task completion |
| POST | `/crop-journey/{id}/photo-check` | Gemini photo health analysis — returns `weather_related_risks`, `do_not_do`, `plan_update_needed` |
| POST | `/crop-journey/{id}/update-plan` | Adaptive re-plan: re-generates remaining weeks from `current_week` using fresh weather + latest photo; trigger: `manual\|weather_change\|photo_check` |
| GET | `/crop-journey/{id}/subsidies` | PIB RSS govt scheme alerts |
| POST | `/crop-journey/{id}/complete` | Mark sold → generate journey report with `roi_percent`, `weather_impact` |
| GET | `/crop-journey/{id}/report` | Final PDF-ready report |

## Feature: Crop Journey (Fasal Journey) — Beejai to Bikri

### Two-Round AI Questioning with Live Weather Integration
1. Farmer enters location + month (auto-detected via `new Date()`, read-only with "Badlo" toggle), optionally uploads land photo
2. **Round 1**: `POST /crop-journey/questions` fetches wttr.in weather first → Gemini generates 6 Hinglish questions aware of current humidity/rain/temp (e.g., asks about backup water if dry forecast). Land photo detected fields auto-filled with "📷 Photo se detect hua" badge
3. **Round 2** (conditional): `POST /crop-journey/followup-questions` — AI decides if follow-up needed based on answers + weather (rain-fed + dry forecast → ask backup; high humidity → ask sprayer; borewell → ask depth). Returns `[]` to skip straight to analysis
4. AI analyzes all answers + live weather → recommends crop with `weather_fit` (blue block) + `weather_warnings` (amber block) + yield/income estimate
5. Farmer picks sowing date + land size → `POST /start` fetches fresh weather → AI generates week-by-week task calendar

### Per-Week Weather-Integrated Task Calendar
Each week object includes:
- `expected_weather`: `{temp_range, rain_mm_week, humidity_pct, frost_risk, heat_stress, conditions}`
- `weather_advisory`: Hinglish warning for the week
- `week_cost_estimate`: estimated spend (seeds/fertiliser/labour)
- `critical_window`: boolean — if true, week card shows CRITICAL badge
- `date_range`: actual calendar dates computed from sowing_date
- `plan_change_reason`: populated after adaptive update (shows UPDATED badge in UI)

Each task within a week includes a `chemicals[]` array:
- `name`: specific product name (e.g., "Chlorpyrifos 20EC", "Urea 46% N", "Mancozeb 75WP")
- `type`: fertilizer | pesticide | fungicide | herbicide | insecticide
- `quantity_per_acre`: exact dose with unit
- `dilution`: e.g., "2ml/L → 200L water/acre" or "Dry broadcast"
- `cost_approx`: ₹ per acre
- `application_method`: foliar spray | basal incorporation | top-dress | seed treatment | fertigation
- `timing`: Morning | Evening | Avoid if rain forecast
- Frontend shows `ChemicalDetail` expandable section per task (color-coded by type)

### Dashboard Tabs
- **Tasks tab**: current week weather block (color-coded: blue=rain, red=heat, cyan=frost) + checkbox tasks + "🔄 Mausam Se Plan Update Karo" button
- **Weather tab**: wttr.in 5-day forecast + Hinglish advisory
- **Subsidies (Sahayata) tab**: `HARDCODED_SCHEMES` (19 schemes: 4 national + 15 state-specific for MH/PB/UP/RJ/MP/KA/GJ/HR); `extractState(location)` maps city→state to filter; live PIB RSS above if available
- **Timeline tab**: expandable `WeekCard` components with per-week weather, cost, tasks + "Refresh Plan" button

### Photo Health Check
`POST /{id}/photo-check` → Gemini analyzes with fresh weather context → returns:
- `health_score` (0-100), `observations`, `immediate_action`, `subsidy_tip`
- `weather_related_risks`: risks amplified by current weather
- `do_not_do`: actions to avoid given weather
- `plan_update_needed`: boolean — if true, frontend auto-calls `/update-plan` with trigger `photo_check`

### Adaptive Plan Update
`POST /{id}/update-plan` with `{current_week, trigger}`:
- Fetches fresh weather, optionally uses latest photo check result
- Re-generates only remaining weeks (week > current_week) via Gemini
- Merges updated weeks back into `task_calendar` in-place
- Tracks `plan_updates_count` and `plan_update_log` in journey state
- Frontend "🔄 Mausam Se Plan Update Karo" button triggers this manually

### Post-Harvest Redirect — Grade → Negotiate Pipeline
When last week of the journey is reached (`curWeek >= total_weeks`):
- Tasks tab shows "Fasal Harvest Ready Hai!" card with two buttons
- "📸 Fasal Grade Karo" → stores `kd_harvest_crop` in localStorage → navigates to `/grade`
- "🤝 Mandi Mein Beche" → navigates to `/negotiate`
- Same buttons repeated on the report page after PDF download
- This closes the full beejai-to-bikri loop: Grow → Grade → Negotiate

### Weather Fallback Chain
`weather_api.py` tries in order:
1. **wttr.in** (free live API, 5-min cache) — returns `source: "wttr.in"`
2. **Gemini AI** (if wttr.in fails) — generates realistic weather from regional climate knowledge — returns `source: "ai_estimate"` — shown with amber "AI Estimate" badge in weather tab
3. **Static fallback** (if Gemini also fails) — returns `source: "static_fallback"` — shown with red "Offline" badge

### Journey Completion & Report
- Enter selling price → `POST /{id}/complete` → AI generates report with `roi_percent`, `weather_impact` summary
- `GET /{id}/report` → full report; frontend renders as PDF via jsPDF

### State & Persistence
- Journey stored in-memory `_journeys` dict — lost on server restart (acceptable for demo)
- Journey ID in `localStorage kd_journey_id` — auto-restores on page reload

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
