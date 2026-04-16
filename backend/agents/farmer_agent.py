"""
Farmer Agent Node — LangGraph Node
Owned by: Person 2

Represents the farmer's interests. Reads MultiAgentState,
calls Gemini to generate dialogue, applies strategy to compute ask price,
then enforces BATNA floor via guardrails.enforce_floor().

Steps to implement:
1. Import MultiAgentState from agents/state.py
2. Compute new_ask using strategies.select_strategy()
3. Call Gemini with dialogue_history + new_ask to generate AgentOutput
4. Run guardrails.enforce_floor(output, state.reservation_price)
5. Append to state.dialogue_history
6. Return updated state
"""
# TODO Person 2: implement this node

from agents.state import MultiAgentState
from agents.strategies import select_strategy
from services.guardrails import enforce_floor
from models.negotiation import AgentOutput


async def farmer_agent_node(state: MultiAgentState) -> MultiAgentState:
    # TODO Person 2: implement with Gemini LLM call
    raise NotImplementedError("farmer_agent_node not yet implemented — Person 2's task")
