Project Master Blueprint: KrishiDoot.AI
Autonomous Negotiation System for Indian Agricultural Markets

1. Core Problem Statement & Pain Points
The Indian agricultural marketing system (APMC) nominally protects farmers but operationally functions as a localized monopsony characterized by deep power asymmetries.

Severe Revenue Extraction: Farmers receive only 25% to 30% of the final retail price for perishables (e.g., tomatoes selling for ₹40/kg retail yield only ₹4/kg at the farm gate).

Subjective Quality Grading: Wholesale buyers and intermediaries routinely downgrade produce quality citing arbitrary visual defects to justify sub-optimal price offers.

The Arhatiya Conflict of Interest: Commission agents (arhatiyas) act as informal financiers, holding the farmer's debt. This creates a captive supply chain where the agent dictates the clearing price, effectively neutralizing the farmer's bargaining power.

Regulatory Constraint: Recent repeals (e.g., in Karnataka) mandate trade must occur within APMC yards. Therefore, the system cannot bypass APMCs; it must act as a pre-auction informational empowerment tool.

The Solution: Deploy an autonomous, multi-agent negotiation system powered by computer vision to act as a digital fiduciary (a dedicated adversarial representative) for the smallholder farmer, protecting them from subjective grading and price exploitation.

2. Technical Architecture & Tech Stack
Frontend: React.js.

Requirement: Must integrate a regulated Consent Manager framework to secure explicit, vernacular opt-ins prior to image uploading, ensuring compliance with India's DPDP Act 2023.

Backend: FastAPI (Python) for asynchronous routing and rapid API handling.

Agent Orchestration: LangGraph.

Implementation: Utilizes a cyclical MultiAgentState where a "Farmer Agent" and "Buyer Agent" are distinct nodes. This state object passes dialogue history, numerical bids, and hidden reservation prices seamlessly, preventing context loss during prolonged negotiations.

Vision Model (Quality Grading): Gemini 1.5 Pro Vision.

Implementation: Passes a raw RGB image with a prompt detailing official Agmark grading standards. Operates on zero-shot multimodal reasoning.

Long-Term Scale: Fine-tune and deploy YOLO11 models for ultra-fast (13.5ms) edge-device inference.

Database/Ledger Mocking: PostgreSQL/Supabase (using cryptographic row-level hashing to mock immutable blockchain ledgers for final contracts).

3. Critical API Integrations & Data Pipelines
Ground Truth Market Data (Mandatory): data.gov.in Current Daily APMC Mandi Prices API.

Index UUID: 9ef84268-d588-465a-a308-a864a43d0070

Key Data Field: Modal_Price (the price at which maximum trade volume occurred that day).

Implementation Warning: The default DEMO_KEY is hard-limited to 30 requests/hour. A production key is required for testing. Do not attempt eNAM/API Setu integration for the MVP, as it requires lengthy government approval.

Vernacular Voice Interface (Future/Mock): Bhashini (ULCA) Streaming Speech-to-Text (STT) WebSocket APIs.

Implementation: Route audio arrays via bhashini.asr_nmt('sourceLang', 'targetLang', 'Base64') using ISO-639 codes to translate regional languages to English for the LangGraph backend.

Low-Bandwidth Fallback: USSD/SMS fallback for 2G connectivity.

Implementation: Use XML/HTTP API gateways (e.g., TechTo Networks) or mock via Twilio/Plivo SMS webhooks feeding directly into FastAPI.

4. AI Negotiation Logic & Game Theory
The AI must operate on explicit microeconomic heuristics, not just conversational prediction.

Establishing the BATNA (Reservation Price): The absolute mathematical price floor stored as a hidden variable in the LangGraph state.

Formula: Modal_Price (fetched from API) - Transportation_Cost (logistics to the mandi).

Automated Negotiation Strategies:

Boulware Strategy: The AI maintains an initial high asking price for the majority of the time, conceding only near the deadline. Used for non-perishables (e.g., wheat).

Conceder Strategy: The AI rapidly drops its price early to secure a quick agreement. Mandatory for highly perishable crops (e.g., tomatoes) in extreme heat.

FPO Batch Negotiation (Expansion Feature): Alter the LangGraph state JSON payload to accept an array of 50+ farmer profiles, allowing the agent to calculate a weighted average reservation price and negotiate bulk premiums.

5. Hallucination Prevention & Strict Guardrails
Because the AI executes financial logic, zero-tolerance guardrails are mandatory to prevent tort liability and loss of farmer revenue.

Structured Output Enforcement (Pydantic): The LLM's prompt is strictly constrained to output JSON schemas (e.g., {"proposed_price": 1450, "dialogue": "..."}).

Deterministic Python Middleware: Hardcoded programmatic logic intercepting the LLM's output before it reaches the buyer/frontend.

Logic: if payload.proposed_price < state.reservation_price: raise Exception("Floor breached")

NeMo Guardrails: Wrap LangGraph nodes using the RunnableRails interface (with passthrough: true configured). This establishes programmatic safety boundaries against prompt injection attacks from adversarial buyers.