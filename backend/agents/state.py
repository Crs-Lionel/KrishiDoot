"""
MultiAgentState — Central state object passed between all LangGraph nodes.
Owned by: Person 2

This is the shared memory of the negotiation. Every node reads from
and writes to this state. LangGraph passes it seamlessly between rounds.
"""
from dataclasses import dataclass, field
from typing import Literal, Optional, TypedDict


class DialogueTurn(TypedDict, total=False):
    role: Literal["farmer", "buyer"]
    message: str
    price: float
    strategy_used: Literal["boulware", "conceder"]
    round: int


def _normalize_crop_name(crop_type: str) -> str:
    return crop_type.strip().lower().replace(" ", "_")


@dataclass
class MultiAgentState:
    session_id: str
    farmer_id: str
    crop_type: str
    quantity_kg: float

    # True = Conceder strategy (tomato, leafy greens in heat)
    # False = Boulware strategy (wheat, rice, non-perishables)
    is_perishable: bool

    # HIDDEN from buyer agent — absolute floor in INR/kg
    reservation_price: float

    # Negotiation state
    current_ask: float
    buyer_last_offer: float = 0.0
    buyer_offer_source: Literal["none", "real", "simulated"] = "none"
    round_number: int = 0
    max_rounds: int = 10

    # Full dialogue history shared across all nodes
    dialogue_history: list[DialogueTurn] = field(default_factory=list)

    # Outcome
    status: Literal["ongoing", "agreed", "rejected"] = "ongoing"
    final_price: Optional[float] = None

    # From Gemini Vision grading
    grade_report: Optional[dict] = None

    def __post_init__(self) -> None:
        self.crop_type = self.crop_type.strip()
        self.quantity_kg = float(self.quantity_kg)
        self.reservation_price = round(float(self.reservation_price), 2)
        self.current_ask = round(float(self.current_ask), 2)
        self.buyer_last_offer = round(float(self.buyer_last_offer), 2)
        if self.buyer_last_offer <= 0 and self.buyer_offer_source != "real":
            self.buyer_offer_source = "none"
        self.round_number = max(0, int(self.round_number))
        self.max_rounds = max(1, int(self.max_rounds))

        if self.final_price is not None:
            self.final_price = round(float(self.final_price), 2)


# Perishable crops — use Conceder strategy
PERISHABLE_CROPS = {"tomato", "spinach", "coriander", "green_chilli", "brinjal", "okra", "cucumber"}


def is_perishable_crop(crop_type: str) -> bool:
    return _normalize_crop_name(crop_type) in PERISHABLE_CROPS
