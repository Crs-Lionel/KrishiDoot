from fastapi import APIRouter, HTTPException
from models.negotiation import (
    NegotiationStartRequest, NegotiationStartResponse,
    NegotiationRespondRequest, NegotiationRespondResponse,
)
from services.apmc_api import get_modal_price, compute_batna
import uuid

router = APIRouter()

# In-memory session store (replace with Supabase for persistence)
_sessions: dict = {}


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
    state = request.mandi_location.split(",")[-1].strip()
    try:
        modal_price = await get_modal_price(request.crop_type, state)
    except Exception:
        modal_price = 20.0  # fallback for demo if API fails

    batna = compute_batna(modal_price)
    initial_ask = round(modal_price * 1.15, 2)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "farmer_id": request.farmer_id,
        "crop_type": request.crop_type,
        "quantity_kg": request.quantity_kg,
        "batna_price": batna,
        "initial_ask": initial_ask,
        "current_ask": initial_ask,
        "round": 0,
    }

    # TODO Person 2: grade crop if request.crop_image_b64 is not None
    # TODO Person 2: initialize LangGraph session in orchestrator.py

    return NegotiationStartResponse(
        session_id=session_id,
        batna_price=batna,
        initial_ask=initial_ask,
        grade_report=None,
    )


@router.post("/respond", response_model=NegotiationRespondResponse)
async def respond_to_offer(request: NegotiationRespondRequest):
    """
    Receive buyer's counter-offer and return agent's response.
    Person 2: replace the stub logic below with LangGraph orchestrator call.
    """
    session = _sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    batna = session["batna_price"]
    buyer_offer = request.buyer_counter_offer

    # Guardrail: if buyer is above current ask, agree
    if buyer_offer >= session["current_ask"]:
        return NegotiationRespondResponse(
            agent_dialogue=f"Agreed! ₹{buyer_offer}/kg is acceptable.",
            new_ask=buyer_offer,
            status="agreed",
            final_price=buyer_offer,
        )

    # Guardrail: reject if buyer is below BATNA
    if buyer_offer < batna:
        return NegotiationRespondResponse(
            agent_dialogue=f"I cannot accept below ₹{batna}/kg. That doesn't cover my costs.",
            new_ask=session["current_ask"],
            status="rejected",
        )

    # TODO Person 2: replace this stub with LangGraph orchestrator.py
    # For now: simple concession (10% towards buyer offer each round)
    session["round"] += 1
    new_ask = round(session["current_ask"] - (session["current_ask"] - buyer_offer) * 0.1, 2)
    new_ask = max(new_ask, batna)
    session["current_ask"] = new_ask

    return NegotiationRespondResponse(
        agent_dialogue=f"I can offer ₹{new_ask}/kg. The market rate today supports this price.",
        new_ask=new_ask,
        status="ongoing",
    )
