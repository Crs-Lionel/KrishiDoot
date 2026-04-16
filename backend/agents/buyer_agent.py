"""
Buyer Agent Node — LangGraph Node
Owned by: Person 2

Simulates the buyer/arhatiya's counter-offers for demo purposes.
In production, this node receives REAL buyer input from the frontend.

For the demo: simulates an adversarial buyer who:
- Starts with an aggressive low-ball (50% below ask)
- Increments slowly each round
- Tries prompt injection (handled by guardrails.sanitize_dialogue)

Steps to implement:
1. Read state.current_ask and state.round_number
2. Simulate a buyer counter-offer (or accept real input from state)
3. Append to state.dialogue_history
4. Return updated state with buyer_last_offer set
"""
# TODO Person 2: implement this node

from agents.state import MultiAgentState


async def buyer_agent_node(state: MultiAgentState) -> MultiAgentState:
    # TODO Person 2: implement buyer simulation
    raise NotImplementedError("buyer_agent_node not yet implemented — Person 2's task")
