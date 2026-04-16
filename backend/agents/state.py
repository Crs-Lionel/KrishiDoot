"""
MultiAgentState — Central state object passed between all LangGraph nodes.
Owned by: Person 2

This is the shared memory of the negotiation. Every node reads from
and writes to this state. LangGraph passes it seamlessly between rounds.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Literal


@dataclass
class MultiAgentState:
    session_id: str
    farmer_id: str
    crop_type: str
    quantity_kg: float

    # True = Conceder strategy (tomato, leafy greens in heat)
    # False = Boulware strategy (wheat, rice, non-perishables)
    is_perishable: bool

    # HIDDEN from buyer agent — absolute floor in ₹/kg
    reservation_price: float

    # Negotiation state
    current_ask: float           # farmer agent's current asking price ₹/kg
    buyer_last_offer: float = 0.0
    round_number: int = 0
    max_rounds: int = 10

    # Full dialogue history — each entry: {"role": "farmer"|"buyer", "message": str, "price": float}
    dialogue_history: List[dict] = field(default_factory=list)

    # Outcome
    status: Literal["ongoing", "agreed", "rejected"] = "ongoing"
    final_price: Optional[float] = None

    # From Gemini Vision grading
    grade_report: Optional[dict] = None


# Perishable crops — use Conceder strategy
PERISHABLE_CROPS = {"tomato", "spinach", "coriander", "green_chilli", "brinjal", "okra", "cucumber"}

def is_perishable_crop(crop_type: str) -> bool:
    return crop_type.lower().replace(" ", "_") in PERISHABLE_CROPS
