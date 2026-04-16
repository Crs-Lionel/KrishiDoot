# Telegram Bot — Context for AI Agents
> Owned by Person 1. Bot is functional. Person 2 can enhance /negotiate to use LangGraph.

## What's Done
- `/start`, `/help` — welcome message
- `/price <crop> <state>` — fetches real APMC modal price + computes BATNA
- `/negotiate <crop> <qty> <location>` — text-based negotiation (simple stub logic, not LangGraph yet)
- Message handler — accepts buyer counter-offers as plain numbers during active session

## Run It
```bash
cd backend
python -m telegram_bot.bot
```

## Person 2 Enhancement (Optional)
Wire `/negotiate` into `agents/orchestrator.run_negotiation_round()` instead of the stub logic.
The session store `_tg_sessions` in `bot.py` can be replaced with a `MultiAgentState` dict.

## Bot Token
Get from @BotFather on Telegram → `/newbot` → copy token → add to `.env` as `TELEGRAM_BOT_TOKEN`
