import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from models.crop_journey import (
    QuestionsRequest,
    AnalyzeRequest,
    StartJourneyRequest,
    TaskUpdateRequest,
    PhotoCheckRequest,
    CompleteJourneyRequest,
)
from services.crop_ai import (
    generate_onboarding_questions,
    analyze_and_recommend,
    generate_task_calendar,
    analyze_crop_photo,
    generate_journey_report,
)
from services.weather_api import get_weather
from services.subsidy_rss import fetch_subsidy_alerts

router = APIRouter()

_journeys: dict[str, dict[str, Any]] = {}


@router.post("/questions")
async def get_questions(req: QuestionsRequest):
    questions = await generate_onboarding_questions(req.location, req.month, req.land_photo_b64)
    return {"questions": questions}


@router.post("/analyze")
async def analyze_land(req: AnalyzeRequest):
    weather = await get_weather(req.location)
    recommendation = await analyze_and_recommend(
        req.location, req.month, req.answers, weather, req.land_photo_b64
    )
    return {"recommendation": recommendation, "weather": weather}


@router.post("/start")
async def start_journey(req: StartJourneyRequest):
    journey_id = str(uuid.uuid4())[:8]

    calendar = await generate_task_calendar(
        req.crop_type,
        req.sowing_date,
        req.location,
        req.land_size_acres,
        req.irrigation_type,
    )

    tasks_total = sum(len(w.get("tasks", [])) for w in calendar)

    _journeys[journey_id] = {
        "journey_id": journey_id,
        "farmer_id": req.farmer_id,
        "crop_type": req.crop_type,
        "location": req.location,
        "sowing_date": req.sowing_date,
        "land_size_acres": req.land_size_acres,
        "irrigation_type": req.irrigation_type,
        "answers": req.answers,
        "task_calendar": calendar,
        "completed_tasks": [],
        "photo_checks": [],
        "total_weeks": len(calendar),
        "tasks_completed": 0,
        "tasks_total": tasks_total,
        "status": "active",
        "final_grade": None,
        "selling_price_per_kg": None,
        "total_income": None,
        "buyer_name": None,
        "report": None,
    }

    return {
        "journey_id": journey_id,
        "total_weeks": len(calendar),
        "tasks_total": tasks_total,
        "crop_type": req.crop_type,
    }


@router.get("/{journey_id}")
async def get_journey(journey_id: str):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")
    return _journeys[journey_id]


@router.get("/{journey_id}/weather")
async def get_journey_weather(journey_id: str):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")
    return await get_weather(_journeys[journey_id]["location"])


@router.post("/{journey_id}/task")
async def update_task(journey_id: str, req: TaskUpdateRequest):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")

    j = _journeys[journey_id]
    done: list = j["completed_tasks"]

    if req.completed and req.task_id not in done:
        done.append(req.task_id)
    elif not req.completed and req.task_id in done:
        done.remove(req.task_id)

    j["tasks_completed"] = len(done)
    return {"tasks_completed": j["tasks_completed"], "tasks_total": j["tasks_total"]}


@router.post("/{journey_id}/photo-check")
async def photo_check(journey_id: str, req: PhotoCheckRequest):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")

    j = _journeys[journey_id]
    analysis = await analyze_crop_photo(req.photo_b64, j["crop_type"], req.stage, req.week)

    j["photo_checks"].append({"week": req.week, "stage": req.stage, **analysis})
    return analysis


@router.get("/{journey_id}/subsidies")
async def get_subsidies(journey_id: str):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")

    j = _journeys[journey_id]
    state = j["location"].split(",")[-1].strip() if "," in j["location"] else j["location"]
    alerts = await fetch_subsidy_alerts(j["crop_type"], state)
    return {"alerts": alerts}


@router.post("/{journey_id}/complete")
async def complete_journey(journey_id: str, req: CompleteJourneyRequest):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")

    j = _journeys[journey_id]
    j["status"] = "completed"
    j["selling_price_per_kg"] = req.selling_price_per_kg
    j["final_grade"] = req.final_grade
    j["buyer_name"] = req.buyer_name
    if req.quantity_sold_kg:
        j["total_income"] = round(req.selling_price_per_kg * req.quantity_sold_kg, 2)

    j["report"] = await generate_journey_report(j)
    return {"status": "completed", "report": j["report"]}


@router.get("/{journey_id}/report")
async def get_report(journey_id: str):
    if journey_id not in _journeys:
        raise HTTPException(status_code=404, detail="Journey not found")

    j = _journeys[journey_id]
    if not j.get("report"):
        j["report"] = await generate_journey_report(j)
    return j["report"]
