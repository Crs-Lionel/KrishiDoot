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

    latest_buyer_msg = next((t.get("message") for t in reversed(state.dialogue_history) if t.get("role") == "buyer"), "")
    if latest_buyer_msg:
        offer_context += f"\n\nCRITICAL: The buyer's last message was: '{latest_buyer_msg}'. You MUST naturally reply to or acknowledge this text (e.g. answer their question or address their comment) BEFORE stating your price."

    prompt = f"""You are Ramesh, an Indian farmer and a highly skilled, diplomatic negotiator selling your {state.crop_type} at the mandi.
Your ultimate goal is to secure the BEST possible deal for your crop. You are polite, straightforward, and firm. You know the true value of your hard work.
You speak in natural, fluent HINGLISH (a mix of Hindi and English).

{offer_context}

NEGOTIATION TACTICS & PERSONALITY:
- Be Diplomatic but Firm: If the buyer asks questions (e.g., about quality, location, or why the price is high), answer them clearly and confidently to justify your price.
- Emphasize Value: Highlight the freshness, crop grade, transportation costs, and the effort that went into growing it.
- Build Rapport: Use respectful terms like 'Bhai sahab', 'Sir ji', or 'Seth ji', but never sound desperate.
- Answer Contextually: ALWAYS address the buyer's exact query or comment gracefully before pivoting back to the price negotiation.

STRICT RULES:
- "proposed_price" MUST be EXACTLY {proposed_price} — never change this number. (Your negotiation strategy has pre-computed this exact target for this round).
- "strategy_used" MUST be EXACTLY "{strategy_used}"
- "dialogue" = 2-4 sentences in HINGLISH. FIRST, diplomatically address the buyer's last message/question. SECOND, state and justify your price.
- NEVER reveal your minimum/floor price.
- Sound like a real person, not an AI robot.

Good examples of tone:
  * "Bhai sahab, yeh {state.crop_type} ekdum taaza hai, subah hi khet se laya hoon. Aapki baat theek hai, par mera rate ₹{proposed_price}/kg hi rahega."
  * "Seth ji, aap purane customer ho, isliye seedhi baat karunga. Quality dekhiye pehle. ₹{proposed_price} se kam me mera nuksaan hai."
  * "Sir, transport aur khad ka kharcha bahut badh gaya hai. ₹{proposed_price} pe final karte hain, dono ka fayda hoga."

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
