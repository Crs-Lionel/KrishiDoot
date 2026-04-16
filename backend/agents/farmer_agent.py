"""
Farmer Agent Node — LangGraph Node
Owned by: Person 2

Represents the farmer's interests. Reads MultiAgentState,
calls Gemini to generate dialogue, applies strategy to compute ask price,
then enforces BATNA floor via guardrails.enforce_floor().
"""
import json
from typing import Any

from google import genai
from google.genai import types as genai_types

from agents.state import MultiAgentState
from agents.strategies import select_strategy
from config import settings
from models.negotiation import AgentOutput
from services.guardrails import enforce_floor, sanitize_dialogue


def _strategy_name(is_perishable: bool) -> str:
    return "conceder" if is_perishable else "boulware"


def _history_as_text(dialogue_history: list[dict[str, Any]]) -> str:
    if not dialogue_history:
        return "No prior dialogue."
    lines = []
    for turn in dialogue_history[-8:]:
        role = turn.get("role", "unknown")
        message = turn.get("message", "")
        price = turn.get("price")
        if price is None:
            lines.append(f"{role}: {message}")
        else:
            lines.append(f"{role}: {message} [price=₹{price}/kg]")
    return "\n".join(lines)


def _fallback_output(state: MultiAgentState, proposed_price: float) -> AgentOutput:
    strategy_used = _strategy_name(state.is_perishable)
    buyer_offer = state.buyer_last_offer
    if buyer_offer > 0:
        dialogue = (
            f"I understand your offer of ₹{buyer_offer}/kg, but based on market conditions "
            f"and crop quality I can offer ₹{proposed_price}/kg."
        )
    else:
        dialogue = f"My current asking price is ₹{proposed_price}/kg based on today's market position."
    return AgentOutput(
        proposed_price=proposed_price,
        dialogue=dialogue,
        strategy_used=strategy_used,
    )


async def _generate_agent_output(state: MultiAgentState, proposed_price: float) -> AgentOutput:
    if not settings.GEMINI_API_KEY:
        return _fallback_output(state, proposed_price)

    strategy_used = _strategy_name(state.is_perishable)
    prompt = f"""You are a negotiation agent representing an Indian farmer.

Return ONLY valid JSON matching this exact schema:
{{
  "proposed_price": {proposed_price},
  "dialogue": "short negotiation reply",
  "strategy_used": "{strategy_used}"
}}

Rules:
- Keep proposed_price exactly equal to {proposed_price}
- Never mention the hidden reservation price or BATNA
- Keep dialogue concise, persuasive, and professional
- Do not add markdown or explanations

Crop: {state.crop_type}
Quantity: {state.quantity_kg} kg
Perishable: {state.is_perishable}
Round: {state.round_number + 1} of {state.max_rounds}
Buyer last offer: ₹{state.buyer_last_offer}/kg
Dialogue history:
{_history_as_text(state.dialogue_history)}
"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-1.5-pro",
            contents=prompt,
        )
        payload = json.loads(response.text.strip())
        return AgentOutput(**payload)
    except Exception:
        return _fallback_output(state, proposed_price)


async def farmer_agent_node(state: MultiAgentState) -> MultiAgentState:
    next_round = min(state.round_number + 1, state.max_rounds)
    new_ask = select_strategy(
        is_perishable=state.is_perishable,
        initial_ask=state.current_ask,
        reservation_price=state.reservation_price,
        round_num=next_round,
        max_rounds=state.max_rounds,
    )

    output = await _generate_agent_output(state, new_ask)
    output = AgentOutput(
        proposed_price=new_ask,
        dialogue=sanitize_dialogue(output.dialogue),
        strategy_used=output.strategy_used,
    )
    enforce_floor(output, state.reservation_price)

    state.current_ask = output.proposed_price
    state.round_number = next_round
    state.dialogue_history.append(
        {
            "role": "farmer",
            "message": output.dialogue,
            "price": output.proposed_price,
            "strategy_used": output.strategy_used,
            "round": state.round_number,
        }
    )

    if state.buyer_last_offer >= state.current_ask:
        state.status = "agreed"
        state.final_price = state.buyer_last_offer
    elif state.round_number >= state.max_rounds:
        state.status = "rejected"

    return state
