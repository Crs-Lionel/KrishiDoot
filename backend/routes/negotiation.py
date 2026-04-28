import uuid
import re
import json
from dataclasses import asdict, is_dataclass
from typing import Any

from fastapi import APIRouter, HTTPException, status
from google import genai

from config import settings
from agents.orchestrator import run_negotiation_round
from agents.state import MultiAgentState, is_perishable_crop
from models.negotiation import (
    NegotiationRespondRequest,
    NegotiationRespondResponse,
    NegotiationStartRequest,
    NegotiationStartResponse,
)
from services.apmc_api import compute_batna, get_modal_price
from services.guardrails import FloorBreachException
from services.guardrails import sanitize_dialogue
from services.tts import generate_speech
from services.vision import grade_crop_image

router = APIRouter()

# In-memory session store (replace with Supabase for persistence)
_sessions: dict[str, dict[str, Any]] = {}


def _serialize_state(state: MultiAgentState) -> dict:
    return asdict(state) if is_dataclass(state) else state


def _hydrate_state(payload: dict) -> MultiAgentState:
    return MultiAgentState(**payload)

async def _extract_price_from_text(text: str, current_ask: float) -> float:
    if not settings.GEMINI_API_KEY:
        match = re.search(r"(\d+(?:\.\d+)?)", text)
        return float(match.group(1)) if match else round(current_ask * 0.85, 2)
        
    prompt = f"""Extract the numerical price offer from the buyer's message.
Buyer message: "{text}"
Current asking price: ₹{current_ask}/kg

If the buyer proposes a specific price per kg, return that number.
If the buyer asks for a percentage discount, calculate it.
If the buyer just says "too high" or "reduce it" without a number, guess a reasonable counter-offer (e.g., 10-15% less).
Return ONLY a JSON object with the key 'price'.
Example: {{"price": 45.0}}
"""
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL)
        payload = json.loads(raw)
        return float(payload.get("price", current_ask * 0.85))
    except Exception:
        match = re.search(r"(\d+(?:\.\d+)?)", text)
        return float(match.group(1)) if match else round(current_ask * 0.85, 2)



def _opening_message(initial_ask: float) -> str:
    return f"My opening ask is ₹{initial_ask}/kg based on current mandi conditions."


def _latest_farmer_dialogue(state: MultiAgentState) -> str:
    latest_farmer_turn = next(
        (turn for turn in reversed(state.dialogue_history) if turn.get("role") == "farmer"),
        None,
    )
    if latest_farmer_turn:
        return latest_farmer_turn["message"]
    return f"I can offer ₹{state.current_ask}/kg."


@router.post("/start", response_model=NegotiationStartResponse)
async def start_negotiation(request: NegotiationStartRequest, voice_mode: bool = False):
    """
    Start a negotiation session.
    1. Fetch APMC modal price (Person 1 - done)
    2. Compute BATNA (Person 1 - done)
    3. Grade crop if image provided (Person 2 - wire vision.py)
    4. Set initial ask = modal_price * 1.15 (15% above market)
    5. Create LangGraph session (Person 2 - wire orchestrator.py)
    """
    # Step 1+2: Get market price and compute BATNA
    state_name = request.mandi_location.split(",")[-1].strip()
    try:
        modal_price = await get_modal_price(request.crop_type, state_name)
    except Exception:
        modal_price = 20.0  # fallback for demo if API fails

    batna = compute_batna(modal_price)
    grade_report = None

    session_id = str(uuid.uuid4())
    if request.crop_image_b64:
        try:
            grade_report = (await grade_crop_image(request.crop_image_b64, request.crop_type)).model_dump()
        except Exception:
            grade_report = None

    # Grade-adjusted initial ask: A=+25%, B=+15% (default), C=+5%
    grade = None
    if grade_report:
        grade = grade_report.get("grade")
    elif request.crop_grade:
        grade = request.crop_grade
    grade_multiplier = {"A": 1.25, "B": 1.15, "C": 1.05}.get(grade or "B", 1.15)
    initial_ask = round(modal_price * grade_multiplier, 2)

    negotiation_state = MultiAgentState(
        session_id=session_id,
        farmer_id=request.farmer_id,
        crop_type=request.crop_type,
        quantity_kg=request.quantity_kg,
        is_perishable=is_perishable_crop(request.crop_type),
        reservation_price=batna,
        current_ask=initial_ask,
        grade_report=grade_report,
    )
    negotiation_state.dialogue_history.append(
        {
            "role": "farmer",
            "message": _opening_message(initial_ask),
            "price": initial_ask,
            "round": 0,
        }
    )
    _sessions[session_id] = _serialize_state(negotiation_state)

    opening_text = _opening_message(initial_ask)
    audio_b64 = await generate_speech(opening_text) if voice_mode else None

    return NegotiationStartResponse(
        session_id=session_id,
        batna_price=batna,
        initial_ask=initial_ask,
        grade_report=grade_report,
        audio_b64=audio_b64,
    )


@router.post("/respond", response_model=NegotiationRespondResponse)
async def respond_to_offer(request: NegotiationRespondRequest):
    """
    Receive buyer's counter-offer and return agent's response.
    Person 2: replace the stub logic below with LangGraph orchestrator call.
    """
    session_payload = _sessions.get(request.session_id)
    if not session_payload:
        raise HTTPException(status_code=404, detail="Session not found")

    state = _hydrate_state(session_payload)

    if state.status != "ongoing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Negotiation is already {state.status}. Start a new session to continue.",
        )

    if request.buyer_counter_offer is not None and request.buyer_counter_offer > 0:
        buyer_offer = request.buyer_counter_offer
    else:
        buyer_offer = await _extract_price_from_text(request.buyer_message, state.current_ask)

    state.buyer_last_offer = buyer_offer
    state.buyer_offer_source = "real"
    
    # Store the ACTUAL message from the user instead of hardcoded
    state.dialogue_history.append(
        {
            "role": "buyer",
            "message": sanitize_dialogue(request.buyer_message),
            "price": buyer_offer,
            "round": state.round_number + 1,
        }
    )

    # Guardrail: if buyer is above current ask, agree
    if buyer_offer >= state.current_ask:
        state.status = "agreed"
        state.final_price = buyer_offer
        _sessions[request.session_id] = _serialize_state(state)
        agreed_text = f"Shukriya! ₹{buyer_offer}/kg par deal pakki hui. Bahut accha kaam kiya!"
        audio_b64 = await generate_speech(agreed_text) if request.voice_mode else None
        return NegotiationRespondResponse(
            agent_dialogue=agreed_text,
            new_ask=buyer_offer,
            status="agreed",
            final_price=buyer_offer,
            audio_b64=audio_b64,
        )

    try:
        state = await run_negotiation_round(state)
    except FloorBreachException:
        state.status = "rejected"
        _sessions[request.session_id] = _serialize_state(state)
        rejected_text = "Mafi karna, is daam par deal sambhav nahi. Meri lagat nahi nikalti."
        audio_b64 = await generate_speech(rejected_text) if request.voice_mode else None
        return NegotiationRespondResponse(
            agent_dialogue=rejected_text,
            new_ask=state.current_ask,
            status="rejected",
            audio_b64=audio_b64,
        )
    _sessions[request.session_id] = _serialize_state(state)

    dialogue = _latest_farmer_dialogue(state)
    audio_b64 = await generate_speech(dialogue) if request.voice_mode else None

    return NegotiationRespondResponse(
        agent_dialogue=dialogue,
        new_ask=state.current_ask,
        status=state.status,
        final_price=state.final_price,
        audio_b64=audio_b64,
    )
