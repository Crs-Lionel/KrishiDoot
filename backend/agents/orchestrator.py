"""
LangGraph Orchestrator — Negotiation Graph
Owned by: Person 2
"""
from agents.buyer_agent import buyer_agent_node
from agents.farmer_agent import farmer_agent_node
from agents.state import MultiAgentState

try:
    from langgraph.graph import END, StateGraph

    def _should_continue(state: MultiAgentState) -> str:
        if state.status == "ongoing" and state.round_number < state.max_rounds:
            return "continue"
        return "end"

    def _build_graph():
        graph = StateGraph(MultiAgentState)
        graph.add_node("farmer_agent", farmer_agent_node)
        graph.add_node("buyer_agent", buyer_agent_node)
        graph.set_entry_point("farmer_agent")
        graph.add_edge("farmer_agent", "buyer_agent")
        graph.add_conditional_edges(
            "buyer_agent",
            _should_continue,
            {
                "continue": "farmer_agent",
                "end": END,
            },
        )
        return graph.compile()

    _NEGOTIATION_GRAPH = _build_graph()

except Exception:  # pragma: no cover — allows startup even if langgraph graph build fails
    _NEGOTIATION_GRAPH = None


async def run_negotiation_round(state: MultiAgentState) -> MultiAgentState:
    """
    Run one negotiation step.

    If a real buyer offer is already present in state, return only the farmer's
    next reply for the API flow. Otherwise, run the full cyclic graph for demo
    simulation until agreement/rejection/max rounds.
    """
    if state.buyer_offer_source == "real" or _NEGOTIATION_GRAPH is None:
        return await farmer_agent_node(state)
    result = await _NEGOTIATION_GRAPH.ainvoke(state)
    # langgraph may return a dict or the state object, handle both
    if isinstance(result, dict):
        return MultiAgentState(**{k: v for k, v in result.items() if not k.startswith("__")})
    return result
