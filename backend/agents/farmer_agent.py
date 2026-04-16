"""
Farmer Agent Node — LangGraph Node
Owned by: Person 2

Represents the farmer's interests. Reads MultiAgentState,
calls Gemini to generate dialogue, applies strategy to compute ask price,
then enforces BATNA floor via guardrails.enforce_floor().
"""
import json
import re
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
    buyer_offer = state.buyer_last_offer

    if buyer_offer > 0 and buyer_offer < state.reservation_price:
        offer_context = (
            f"The buyer offered ₹{buyer_offer}/kg which is far below your cost of production. "
            f"Express genuine frustration — you put months of hard work into this crop. "
            f"Firmly counter at ₹{proposed_price}/kg without revealing your exact floor."
        )
    elif buyer_offer > 0 and buyer_offer < proposed_price * 0.9:
        offer_context = (
            f"The buyer offered ₹{buyer_offer}/kg. It's still too low. "
            f"Counter firmly at ₹{proposed_price}/kg — reference quality and current mandi rates."
        )
    elif buyer_offer > 0:
        offer_context = (
            f"The buyer offered ₹{buyer_offer}/kg. You are getting closer. "
            f"Hold at ₹{proposed_price}/kg — show you are reasonable but not desperate."
        )
    else:
        offer_context = f"Open the negotiation at ₹{proposed_price}/kg. Be confident and reference market rates."

    prompt = f"""You are Ramesh, an Indian farmer selling your {state.crop_type} at the mandi.
You are proud of your crop and worried about your family. You speak in HINGLISH — natural mix of Hindi and English.

{offer_context}

STRICT RULES:
- "proposed_price" MUST be EXACTLY {proposed_price} — never change this number
- "strategy_used" MUST be EXACTLY "{strategy_used}"
- "dialogue" = 1-2 short sentences in HINGLISH. Sound like a real person, not a robot.
- NEVER reveal your minimum/floor price
- Good examples of tone:
  * "Bhai sahab, seedhi baat — is rate pe mera kharcha bhi nahi niklega. ₹{proposed_price} se neeche possible nahi."
  * "Dekho, is baar ki fasal bahut achhi hai. Mandi mein yahi rate chal raha hai. ₹{proposed_price} fair price hai."
  * "Itna kam? Beej, khad, paani — sab ka kharcha hai. ₹{proposed_price} pe karo deal, dono ka fayda hoga."

Return ONLY this JSON (no markdown, nothing else):
{{"proposed_price": {proposed_price}, "dialogue": "...", "strategy_used": "{strategy_used}"}}

Crop: {state.crop_type} | Qty: {state.quantity_kg} kg | Round: {state.round_number + 1}/{state.max_rounds}
Conversation:
{_history_as_text(state.dialogue_history)}
"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemma-3-27b-it",
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL)
        payload = json.loads(raw)
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
