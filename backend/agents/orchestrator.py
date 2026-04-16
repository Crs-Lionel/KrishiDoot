"""
LangGraph Orchestrator — Negotiation Graph
Owned by: Person 2

Builds the cyclic MultiAgentState graph:
  farmer_agent → buyer_agent → [check status] → farmer_agent (loop)
                                              ↘ END (agreed/rejected/max_rounds)

Steps to implement:
1. Import StateGraph from langgraph
2. Add farmer_agent_node and buyer_agent_node as nodes
3. Add conditional edge: after buyer_agent, check state.status
   - if "ongoing" AND round < max_rounds: → farmer_agent
   - else: → END
4. Compile the graph
5. Expose run_negotiation_round(state) function that steps the graph

Example:
    from langgraph.graph import StateGraph, END
    from agents.farmer_agent import farmer_agent_node
    from agents.buyer_agent import buyer_agent_node
"""
# TODO Person 2: implement the LangGraph graph

from agents.state import MultiAgentState


async def run_negotiation_round(state: MultiAgentState) -> MultiAgentState:
    """
    Run one round of the negotiation graph.
    Called by routes/negotiation.py on each POST /negotiate/respond.
    """
    # TODO Person 2: replace with actual LangGraph graph.invoke(state)
    raise NotImplementedError("LangGraph orchestrator not yet implemented — Person 2's task")
