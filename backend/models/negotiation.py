from pydantic import BaseModel
from typing import Literal, Optional


# ─── Inbound Requests ────────────────────────────────────────────────────────

class NegotiationStartRequest(BaseModel):
    farmer_id: str
    crop_type: str                  # e.g. "tomato", "wheat"
    quantity_kg: float
    mandi_location: str             # e.g. "Bengaluru, Karnataka"
    crop_image_b64: Optional[str] = None  # base64 image for auto-grading


class NegotiationRespondRequest(BaseModel):
    session_id: str
    buyer_counter_offer: float      # ₹/kg from buyer


# ─── Outbound Responses ──────────────────────────────────────────────────────

class NegotiationStartResponse(BaseModel):
    session_id: str
    batna_price: float              # ₹/kg — absolute floor, NEVER go below this
    initial_ask: float              # ₹/kg — agent's opening ask
    grade_report: Optional[dict] = None


class NegotiationRespondResponse(BaseModel):
    agent_dialogue: str             # agent's spoken response
    new_ask: float                  # ₹/kg — agent's updated ask
    status: Literal["ongoing", "agreed", "rejected"]
    final_price: Optional[float] = None   # only when status == "agreed"


# ─── Internal Agent Contract (Pydantic enforces LLM JSON output) ─────────────

class AgentOutput(BaseModel):
    """
    LLM MUST output exactly this shape. No free-form text.
    Enforced via structured output / prompt constraint.
    Guardrails check proposed_price >= reservation_price before passing to buyer.
    """
    proposed_price: float           # ₹/kg
    dialogue: str                   # what the agent says to the buyer
    strategy_used: Literal["boulware", "conceder"]
