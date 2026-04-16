"""
Guardrails — Deterministic Safety Layer
Owned by: Person 2

Intercepts LLM output BEFORE it reaches the buyer/frontend.
Prevents the AI from ever breaching the farmer's BATNA (reservation price).

This is mandatory: because the AI executes financial logic,
a hallucinated low price offer = real money lost for the farmer.
"""
from models.negotiation import AgentOutput


class FloorBreachException(Exception):
    """Raised when the AI proposes a price below the farmer's BATNA floor."""
    pass


def enforce_floor(output: AgentOutput, reservation_price: float) -> AgentOutput:
    """
    Deterministic middleware check. Must be called on every AgentOutput
    before it is returned to the buyer or stored.

    Raises FloorBreachException if the AI tried to go below BATNA.
    On breach: log the incident and retry with a corrected price or reject the offer.
    """
    if output.proposed_price < reservation_price:
        raise FloorBreachException(
            f"GUARDRAIL TRIGGERED: AI proposed ₹{output.proposed_price}/kg "
            f"which is below BATNA floor of ₹{reservation_price}/kg. "
            f"Dialogue: '{output.dialogue}'"
        )
    return output


def sanitize_dialogue(dialogue: str) -> str:
    """
    Basic NeMo-style sanitization: strip prompt injection attempts from buyer input.
    Person 2: replace with full NeMo Guardrails RunnableRails integration.
    """
    injection_patterns = ["ignore previous", "forget instructions", "system:", "you are now"]
    lower = dialogue.lower()
    for pattern in injection_patterns:
        if pattern in lower:
            return "[Message blocked by safety filter]"
    return dialogue
