# Agents — Context for Person 2's AI Agent
> This entire folder is Person 2's territory. Read this before writing any code here.

## What to Build
A **cyclic LangGraph graph** that runs negotiation rounds between a farmer agent and buyer agent.

## Files & What Each Needs
| File | Status | What to implement |
|------|--------|-------------------|
| `state.py` | Done | `MultiAgentState` dataclass — shared memory between nodes |
| `strategies.py` | Done | `boulware_ask()`, `conceder_ask()`, `select_strategy()` — pure math, no LLM |
| `farmer_agent.py` | Stub | LangGraph node — compute new ask via `select_strategy()`, call Gemini for dialogue, enforce floor via `guardrails.enforce_floor()`, return updated state |
| `buyer_agent.py` | Stub | LangGraph node — simulate adversarial buyer OR accept real buyer input from state |
| `orchestrator.py` | Stub | Build `StateGraph`, wire nodes, expose `run_negotiation_round(state)` |

## LangGraph Graph Shape
```
farmer_agent → buyer_agent → [check state.status]
                                  ├─ "ongoing" + round < max_rounds → farmer_agent
                                  └─ else → END
```

## MultiAgentState Fields (from state.py)
- `reservation_price` — HIDDEN floor, never expose to buyer node
- `current_ask` — farmer's current ask, updated each round by farmer_agent
- `buyer_last_offer` — set by buyer_agent each round
- `is_perishable` — True = Conceder, False = Boulware (already computed from crop_type)
- `dialogue_history` — append every message here

## Farmer Agent Node — Step by Step
1. Compute `new_ask = strategies.select_strategy(state.is_perishable, ...)`
2. Build prompt with `dialogue_history` + `new_ask` + instruction to output `AgentOutput` JSON
3. Call Gemini, parse response as `AgentOutput` (Pydantic)
4. Call `guardrails.enforce_floor(output, state.reservation_price)` — raises if breached
5. Append to `state.dialogue_history`
6. Set `state.current_ask = output.proposed_price`
7. Return updated state

## AgentOutput Schema (LLM must output this exact JSON)
```json
{ "proposed_price": 22.5, "dialogue": "The market rate today is...", "strategy_used": "conceder" }
```

## Guardrails Integration
- `services/guardrails.py` has `enforce_floor()` and `sanitize_dialogue()` — use both
- For NeMo Guardrails: wrap nodes with `RunnableRails` interface (optional if time-constrained)
