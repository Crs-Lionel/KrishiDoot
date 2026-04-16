-- KrishiDoot.AI — Supabase Schema
-- Run this in your Supabase project SQL editor (supabase.com → SQL Editor)

-- ─── Negotiation Sessions ───────────────────────────────────────────────────
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    quantity_kg FLOAT NOT NULL,
    mandi_location TEXT NOT NULL,
    batna_price FLOAT NOT NULL,       -- farmer's absolute floor ₹/kg
    initial_ask FLOAT NOT NULL,       -- agent's opening ask ₹/kg
    status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'agreed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Final Contracts (when status = 'agreed') ────────────────────────────────
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    farmer_id TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    quantity_kg FLOAT NOT NULL,
    final_price FLOAT NOT NULL,                                      -- ₹/kg
    total_value FLOAT GENERATED ALWAYS AS (quantity_kg * final_price) STORED,  -- ₹ total
    row_hash TEXT NOT NULL,           -- SHA-256 of (session_id+farmer_id+final_price+timestamp) — mock ledger
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Dialogue History ────────────────────────────────────────────────────────
CREATE TABLE dialogue_rounds (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer')),
    message TEXT NOT NULL,
    price FLOAT NOT NULL,             -- the price associated with this message
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_sessions_farmer ON sessions(farmer_id);
CREATE INDEX idx_contracts_session ON contracts(session_id);
CREATE INDEX idx_dialogue_session ON dialogue_rounds(session_id);
