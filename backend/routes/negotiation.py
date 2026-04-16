import uuid
from dataclasses import asdict, is_dataclass
from typing import Any

from fastapi import APIRouter, HTTPException, status

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
from services.vision import grade_crop_image

router = APIRouter()

# In-memory session store (replace with Supabase for persistence)
_sessions: dict[str, dict[str, Any]] = {}


def _serialize_state(state: MultiAgentState) -> dict:
    return asdict(state) if is_dataclass(state) else state


def _hydrate_state(payload: dict) -> MultiAgentState:
    return MultiAgentState(**payload)


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
async def start_negotiation(request: NegotiationStartRequest):
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
    initial_ask = round(modal_price * 1.15, 2)
    grade_report = None

    session_id = str(uuid.uuid4())
    if request.crop_image_b64:
        try:
            grade_report = (await grade_crop_image(request.crop_image_b64, request.crop_type)).model_dump()
        except Exception:
            grade_report = None

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

    return NegotiationStartResponse(
        session_id=session_id,
        batna_price=batna,
        initial_ask=initial_ask,
        grade_report=grade_report,
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

    buyer_offer = request.buyer_counter_offer
    state.buyer_last_offer = buyer_offer
    state.buyer_offer_source = "real"
    state.dialogue_history.append(
        {
            "role": "buyer",
            "message": sanitize_dialogue(f"I can pay ₹{buyer_offer}/kg."),
            "price": buyer_offer,
            "round": state.round_number + 1,
        }
    )

    # Guardrail: if buyer is above current ask, agree
    if buyer_offer >= state.current_ask:
        state.status = "agreed"
        state.final_price = buyer_offer
        _sessions[request.session_id] = _serialize_state(state)
        return NegotiationRespondResponse(
            agent_dialogue=f"Agreed! ₹{buyer_offer}/kg is acceptable.",
            new_ask=buyer_offer,
            status="agreed",
            final_price=buyer_offer,
        )

    # Guardrail: reject if buyer is below BATNA
    if buyer_offer < state.reservation_price:
        state.status = "rejected"
        _sessions[request.session_id] = _serialize_state(state)
        return NegotiationRespondResponse(
            agent_dialogue=f"I cannot accept below ₹{state.reservation_price}/kg. That doesn't cover my costs.",
            new_ask=state.current_ask,
            status="rejected",
        )

    try:
        state = await run_negotiation_round(state)
    except FloorBreachException:
        state.status = "rejected"
        _sessions[request.session_id] = _serialize_state(state)
        return NegotiationRespondResponse(
            agent_dialogue="I cannot reduce the price further without going below a safe minimum.",
            new_ask=state.current_ask,
            status="rejected",
        )
    _sessions[request.session_id] = _serialize_state(state)

    return NegotiationRespondResponse(
        agent_dialogue=_latest_farmer_dialogue(state),
        new_ask=state.current_ask,
        status=state.status,
        final_price=state.final_price,
    )
