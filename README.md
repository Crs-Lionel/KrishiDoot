# 🌾 KrishiDoot.AI

KrishiDoot.AI is an **Autonomous Negotiation System and Crop Management Platform** specifically designed for Indian agricultural markets. It empowers smallholder farmers by acting as a digital fiduciary—a dedicated adversarial representative that protects them from subjective grading and price exploitation by wholesale buyers and intermediaries (arhatiyas).

Beyond negotiation, KrishiDoot acts as an end-to-end digital agronomist. It guides the farmer from sowing (Beejai) to selling (Bikri) through weather-aware task calendars, real-time market discovery, and subsidy alerts.

---

## 🌟 Key Features

### 1. 🤝 Autonomous AI Negotiator
- **LangGraph Agent Orchestration**: Uses a `Farmer Agent` and `Buyer Agent` cyclic graph to simulate and conduct negotiations.
- **Microeconomic Game Theory**: Automatically calculates the BATNA (Reservation Price) using live APMC Mandi prices minus transportation costs.
- **Dynamic Negotiation Strategies**: Employs the *Boulware Strategy* (anchor high, concede late) for non-perishables and the *Conceder Strategy* for perishable crops.
- **Voice Mode (STT & TTS)**: Supports natural Hinglish conversational negotiations. Uses Gemini's native text-to-speech with a robust fallback to `gTTS`.

### 2. 🌱 Fasal Journey (Crop Journey)
- **AI Task Calendar**: Generates week-by-week agricultural plans tailored to the exact crop, location, soil type, and live weather conditions.
- **Photo Health Checks**: Allows farmers to upload photos of their crop for zero-shot visual disease detection and grading using **Gemini 2.5 Flash**.
- **Adaptive Planning**: Dynamically updates the remaining crop journey based on new weather patterns or disease detection.
- **Subsidy Alerts (Sahayata)**: Fetches real-time government subsidy alerts from the PIB RSS feed based on the farmer's location.

### 3. 📈 Market Discovery & Analytics
- **Live Mandi Prices**: Integrates with the `data.gov.in` APMC Mandi Prices API to fetch the latest Modal Price (with a robust offline fallback database).
- **Interactive Leaflet Map**: Visually ranks nearby mandis based on net value (price minus transport cost) using CARTO dark tiles.
- **PDF Receipt Generation**: Client-side generation of negotiation receipts using `jsPDF`.

---

## 🛠️ Technology Stack

**Frontend:**
- React 18 + Vite
- GSAP 3 (for premium glassmorphism animations and staggers)
- Tailwind CSS (Custom dark-green palette)
- React Leaflet (Market Mapping)

**Backend:**
- FastAPI (Python) for rapid, async API serving
- LangGraph (Agentic Orchestration)
- Pydantic v2 (Strict LLM output validation)
- Google Gemini (`gemma-3-27b-it` for dialogue, `gemini-2.5-flash` for vision)
- Supabase / PostgreSQL (Mocking immutable ledgers)

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js v18+
- A Google Gemini API Key

### 1. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies.
```cmd
cd backend
python -m venv myenv
myenv\Scripts\activate
pip install -r requirements.txt
```

Set up your environment variables by creating a `backend/.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATA_GOV_API_KEY=DEMO_KEY
TELEGRAM_BOT_TOKEN=optional_token_here
```

Start the FastAPI server:
```cmd
python -m uvicorn main:app --reload
```
*The backend will run at `http://localhost:8000` (Swagger UI at `/docs`)*

### 2. Frontend Setup
In a new terminal window, navigate to the frontend directory:
```cmd
cd frontend
npm install
npm run dev
```
*The frontend will run at `http://localhost:5173`*

---

## 🛡️ Hallucination Prevention & Strict Guardrails
Because KrishiDoot executes financial logic, zero-tolerance guardrails are built-in to prevent loss of farmer revenue:
1. **Programmatic Interception**: If the LLM proposes a price below the mathematically calculated reservation price, a Python exception is raised and handled before reaching the buyer.
2. **Structured Outputs**: All LangGraph AI nodes are strictly constrained using Pydantic JSON schemas.
3. **Fallback Chains**: Critical services like weather (`wttr.in`) gracefully fallback to AI-estimation and static data if rate-limited. TTS falls back to `gTTS` if Gemini quotas are exhausted.

---

## 📄 License
This project is built for the Indian agricultural ecosystem, intended as an open-innovation solution to systemic monopsony challenges.
