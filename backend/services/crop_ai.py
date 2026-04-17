"""
Gemini-powered crop lifecycle AI: questions, recommendation, task calendar, photo health, report.
"""
import base64
import json
from datetime import datetime

from google import genai
from google.genai import types as genai_types

from config import settings

CROP_DURATIONS = {
    "wheat": 130, "rice": 150, "cotton": 180, "tomato": 90,
    "onion": 120, "soybean": 100, "maize": 110, "mustard": 110,
    "gram": 100, "sugarcane": 360, "potato": 90, "groundnut": 120,
}


def _client() -> genai.Client:
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _extract(text: str, bracket: str = "{") -> str:
    close = "}" if bracket == "{" else "]"
    s = text.find(bracket)
    e = text.rfind(close) + 1
    if s == -1 or e == 0:
        raise ValueError("No JSON in response")
    return text[s:e]


def _decode_b64(b64: str) -> tuple[str, bytes]:
    b64 = b64.strip()
    if b64.startswith("data:") and "," in b64:
        header, raw = b64.split(",", 1)
        mime = header.split(";")[0].replace("data:", "") or "image/jpeg"
        return mime, base64.b64decode(raw)
    return "image/jpeg", base64.b64decode(b64)


# ── Onboarding Questions ────────────────────────────────────────────────────

async def generate_onboarding_questions(location: str, month: int, land_photo_b64: str = None) -> list:
    if not settings.GEMINI_API_KEY:
        return _fallback_questions()

    month_name = datetime(2025, month, 1).strftime("%B")
    contents: list = []

    if land_photo_b64:
        mime, img_bytes = _decode_b64(land_photo_b64)
        contents.append(genai_types.Part.from_bytes(data=img_bytes, mime_type=mime))

    photo_instruction = ""
    if land_photo_b64:
        photo_instruction = """
IMPORTANT: Analyze the land photo carefully. For any question whose answer is clearly visible in the photo
(e.g. soil colour, terrain type, water body presence, crop residue), add a "detected_from_photo" field
with the exact matching option string. Only set this when you are confident — do NOT guess."""

    contents.append(f"""You are KrishiDoot AI — expert Indian agricultural advisor.
{"Farmer shared a land photo (see above)." if land_photo_b64 else ""}
Location: {location} | Month: {month_name}
{photo_instruction}

Generate exactly 6 simple Hinglish questions to understand the farmer's situation.
Cover: soil type/colour, water/irrigation source, land size in acres, last crop grown, budget, farming experience.

Return ONLY valid JSON array (no markdown, no explanation):
[
  {{"id":"q1","question":"Aapki zameen ki mitti ka rang kaisa hai?","type":"choice","options":["Kali (Black)","Laal (Red)","Bhoori (Brown/Loamy)","Reti (Sandy)"]}},
  {{"id":"q2","question":"Kitne acre zameen hai?","type":"number","unit":"acres","min":0.1,"max":100}},
  {{"id":"q3","question":"Pani ka source kya hai?","type":"choice","options":["Nalkoop (Borewell)","Nahar (Canal)","Barish par nirbhar","Talab / Pond"]}},
  {{"id":"q4","question":"Pichli fasal kya thi?","type":"choice","options":["Gehun (Wheat)","Chawal (Rice)","Daal (Pulses)","Kuch nahi (Fallow)"]}},
  {{"id":"q5","question":"Kitne saal se kheti kar rahe hain?","type":"choice","options":["2 saal se kam","2-5 saal","5-15 saal","15+ saal"]}},
  {{"id":"q6","question":"Ek acre par kitna budget hai?","type":"choice","options":["₹5,000 tak","₹5,000-15,000","₹15,000-30,000","₹30,000+"]}}
]
Example with photo detection: {{"id":"q1",...,"detected_from_photo":"Kali (Black)"}}""")

    try:
        r = await _client().aio.models.generate_content(model="gemini-2.5-flash", contents=contents)
        return json.loads(_extract(r.text, "["))
    except Exception as exc:
        print(f"[crop_ai] questions failed: {exc}")
        return _fallback_questions()


def _fallback_questions() -> list:
    return [
        {"id": "q1", "question": "Mitti ka rang kaisa hai?", "type": "choice", "options": ["Kali (Black)", "Laal (Red)", "Bhoori (Brown)", "Reti (Sandy)"]},
        {"id": "q2", "question": "Kitne acre zameen hai?", "type": "number", "unit": "acres", "min": 0.1, "max": 100},
        {"id": "q3", "question": "Pani ka source kya hai?", "type": "choice", "options": ["Borewell", "Canal", "Rain-fed", "Pond/River"]},
        {"id": "q4", "question": "Pichli fasal kya thi?", "type": "choice", "options": ["Gehun (Wheat)", "Chawal (Rice)", "Daal (Pulses)", "Kuch nahi"]},
        {"id": "q5", "question": "Kheti ka anubhav?", "type": "choice", "options": ["Naya (<2 saal)", "Thoda (2-5 saal)", "Anubhavi (5-15 saal)", "Maahir (15+)"]},
        {"id": "q6", "question": "Acre per budget?", "type": "choice", "options": ["₹5,000 tak", "₹5,000-15,000", "₹15,000-30,000", "₹30,000+"]},
    ]


# ── Crop Recommendation ─────────────────────────────────────────────────────

async def analyze_and_recommend(location: str, month: int, answers: dict, weather: dict, land_photo_b64: str = None) -> dict:
    if not settings.GEMINI_API_KEY:
        return _fallback_rec()

    month_name = datetime(2025, month, 1).strftime("%B")
    contents: list = []

    if land_photo_b64:
        mime, img_bytes = _decode_b64(land_photo_b64)
        contents.append(genai_types.Part.from_bytes(data=img_bytes, mime_type=mime))

    w_str = ""
    if weather.get("current"):
        wc = weather["current"]
        w_str = f"Temp {wc['temp_c']}°C, Humidity {wc['humidity']}%, {wc['desc']}"

    contents.append(f"""You are KrishiDoot AI. Analyze this Indian farmer's situation and recommend the best crop.

Location: {location} | Month: {month_name}
{"Land photo: attached above." if land_photo_b64 else ""}
Weather: {w_str or "unknown"}
Farmer answers: {json.dumps(answers, ensure_ascii=False)}

Return ONLY valid JSON (no markdown):
{{
  "recommended_crop": "wheat",
  "alternative_crops": ["mustard","gram"],
  "soil_assessment": "2 line Hinglish assessment",
  "why_this_crop": "2-3 line Hinglish reasoning",
  "expected_yield_per_acre": "18-22 quintal",
  "expected_income_per_acre": "₹45,000-55,000",
  "key_risks": ["Paala","Kum baarish"],
  "best_sowing_window": "Nov 1 - Nov 15",
  "confidence": 82
}}""")

    try:
        r = await _client().aio.models.generate_content(model="gemini-2.5-flash", contents=contents)
        return json.loads(_extract(r.text))
    except Exception as exc:
        print(f"[crop_ai] recommend failed: {exc}")
        return _fallback_rec()


def _fallback_rec() -> dict:
    return {
        "recommended_crop": "wheat",
        "alternative_crops": ["mustard", "gram"],
        "soil_assessment": "Mitti ki jaankari ke liye photo chahiye",
        "why_this_crop": "Rabi season mein gehun sabse suitable fasal hai",
        "expected_yield_per_acre": "15-20 quintal",
        "expected_income_per_acre": "₹35,000-50,000",
        "key_risks": ["Kum baarish", "Keeton ka hamlaa"],
        "best_sowing_window": "Nov 1 - Nov 20",
        "confidence": 50,
    }


# ── Task Calendar ───────────────────────────────────────────────────────────

async def generate_task_calendar(crop_type: str, sowing_date: str, location: str, land_size_acres: float, irrigation_type: str) -> list:
    if not settings.GEMINI_API_KEY:
        return _fallback_calendar(crop_type)

    duration = CROP_DURATIONS.get(crop_type.lower(), 120)
    weeks = (duration // 7) + 1

    prompt = f"""Generate a complete farming task calendar for {crop_type} crop in India.
Sowing date: {sowing_date} | Location: {location}
Land: {land_size_acres} acres | Irrigation: {irrigation_type}
Duration: ~{duration} days ({weeks} weeks)

Return ONLY valid JSON array (no markdown). Each week must have all relevant tasks:
[
  {{
    "week": 1,
    "stage": "Beejai (Sowing)",
    "days_range": "Day 1-7",
    "tasks": [
      {{
        "task_id": "w1_t1",
        "title": "Beejai lagana",
        "desc": "4-5 cm gehraai mein beejai kare",
        "category": "sowing",
        "water_liters_per_acre": 4000,
        "inputs": [{{"name": "Certified Seed", "quantity": "40 kg/acre", "cost_approx": "₹1200"}}],
        "photo_needed": true,
        "critical": true
      }}
    ]
  }}
]
categories: sowing|irrigation|fertilizer|pesticide|weeding|observation|harvest
Set photo_needed=true for week 1 (sowing), any disease week, and final harvest week.
Include water schedule, fertilizer timing (basal vs top-dress), pesticide windows, weeding.
Task titles in Hinglish. Cover ALL {weeks} weeks including harvest."""

    try:
        r = await _client().aio.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return json.loads(_extract(r.text, "["))
    except Exception as exc:
        print(f"[crop_ai] calendar failed: {exc}")
        return _fallback_calendar(crop_type)


def _fallback_calendar(crop_type: str) -> list:
    duration = CROP_DURATIONS.get(crop_type.lower(), 120)
    stages = ["Beejai", "Ugaav", "Vegetative", "Flowering", "Maturity", "Harvest"]
    total = (duration // 7) + 1
    return [
        {
            "week": w,
            "stage": stages[min(int((w / total) * len(stages)), len(stages) - 1)],
            "days_range": f"Day {(w-1)*7+1}-{w*7}",
            "tasks": [
                {
                    "task_id": f"w{w}_t1",
                    "title": "Khet ka nireekshan",
                    "desc": "Paudhe ki growth aur bimari dekhe",
                    "category": "observation",
                    "water_liters_per_acre": 3000 if w % 2 == 0 else 0,
                    "inputs": [],
                    "photo_needed": w in (1, total),
                    "critical": w == total,
                }
            ],
        }
        for w in range(1, total + 1)
    ]


# ── Crop Photo Health Check ─────────────────────────────────────────────────

async def analyze_crop_photo(photo_b64: str, crop_type: str, stage: str, week: int) -> dict:
    if not settings.GEMINI_API_KEY:
        return {"health_score": 75, "status": "healthy", "observations": ["Manual review needed"], "immediate_action": "Nireekshan kare", "subsidy_claim_tip": "", "next_check_week": week + 2}

    mime, img_bytes = _decode_b64(photo_b64)
    img_part = genai_types.Part.from_bytes(data=img_bytes, mime_type=mime)

    prompt = f"""Analyze this {crop_type} crop photo. Stage: {stage} (Week {week}).

Return ONLY valid JSON (no markdown):
{{
  "health_score": 85,
  "status": "healthy",
  "observations": ["Patta hara hai", "Koyi bimari nahi"],
  "immediate_action": "Agli hafte nitrogen top-dressing kare",
  "subsidy_claim_tip": "Fasal Bima Yojana mein nuksaan ho to claim kare",
  "next_check_week": {week + 2}
}}
status options: healthy|mild_stress|diseased|pest_attack|nutrient_deficiency|drought_stress
health_score: 0-100. Observations and action in Hinglish."""

    try:
        r = await _client().aio.models.generate_content(model="gemini-2.5-flash", contents=[img_part, prompt])
        return json.loads(_extract(r.text))
    except Exception as exc:
        print(f"[crop_ai] photo check failed: {exc}")
        return {"health_score": 70, "status": "healthy", "observations": ["Photo analysis unavailable"], "immediate_action": "Dobara try kare", "subsidy_claim_tip": "", "next_check_week": week + 2}


# ── Journey Report ──────────────────────────────────────────────────────────

async def generate_journey_report(journey: dict) -> dict:
    if not settings.GEMINI_API_KEY:
        return _fallback_report()

    done = len(journey.get("completed_tasks", []))
    total = sum(len(w.get("tasks", [])) for w in journey.get("task_calendar", []))

    prompt = f"""Generate a complete Indian farming journey summary.
Crop: {journey.get("crop_type")} | Location: {journey.get("location")}
Land: {journey.get("land_size_acres")} acres | Sowing: {journey.get("sowing_date")}
Tasks done: {done}/{total} | Photo checks: {len(journey.get("photo_checks", []))}
Final grade: {journey.get("final_grade", "B")}
Selling price: ₹{journey.get("selling_price_per_kg", 0)}/kg
Total income: ₹{journey.get("total_income", 0)}

Return ONLY valid JSON (no markdown):
{{
  "summary_hinglish": "Is baar ki kheti bahut achhi rahi...",
  "total_cost_estimate": "₹28,000",
  "net_profit_estimate": "₹42,000",
  "yield_achieved": "18 quintal/acre",
  "highlights": ["Samay par pani diya", "Bimari se bacha"],
  "lessons": ["Agle baar DAP pehle dalna"],
  "next_season_tip": "Agle rabi mein sarson try kare",
  "care_score": 82
}}"""

    try:
        r = await _client().aio.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return json.loads(_extract(r.text))
    except Exception as exc:
        print(f"[crop_ai] report failed: {exc}")
        return _fallback_report()


def _fallback_report() -> dict:
    return {
        "summary_hinglish": "Aapki kheti ki journey poori ho gayi. Badhai ho!",
        "total_cost_estimate": "₹25,000",
        "net_profit_estimate": "₹35,000",
        "yield_achieved": "15-18 quintal/acre",
        "highlights": ["Fasal poori ki", "Record rakha"],
        "lessons": ["AI advisory follow karte rahe"],
        "next_season_tip": "Mitti test karwaaye agle season se pehle",
        "care_score": 75,
    }
