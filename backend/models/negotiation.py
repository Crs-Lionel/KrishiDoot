from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─── Inbound Requests ────────────────────────────────────────────────────────

class NegotiationStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    farmer_id: str = Field(min_length=1)
    crop_type: str = Field(min_length=1)                  # e.g. "tomato", "wheat"
    quantity_kg: float = Field(gt=0)
    mandi_location: str = Field(min_length=1)             # e.g. "Bengaluru, Karnataka"
    crop_image_b64: Optional[str] = None                  # base64 image for auto-grading
    crop_grade: Optional[Literal["A", "B", "C"]] = None  # pre-known Agmark grade → adjusts initial_ask

    @field_validator("farmer_id", "crop_type", "mandi_location", mode="before")
    @classmethod
    def strip_required_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("crop_image_b64", mode="before")
    @classmethod
    def strip_optional_image(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip() or None
        return value


class NegotiationRespondRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str = Field(min_length=1)
    buyer_message: str = Field(min_length=1)       # Actual text from the user
    buyer_counter_offer: Optional[float] = None    # ₹/kg from buyer (optional fallback)
    voice_mode: bool = False                       # if True, return audio_b64 in response

    @field_validator("session_id", mode="before")
    @classmethod
    def strip_session_id(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value


# ─── Outbound Responses ──────────────────────────────────────────────────────

class NegotiationStartResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    batna_price: float = Field(ge=0)              # ₹/kg — absolute floor, NEVER go below this
    initial_ask: float = Field(ge=0)              # ₹/kg — agent's opening ask
    grade_report: Optional[dict] = None
    audio_b64: Optional[str] = None               # base64 WAV if voice_mode was requested


class NegotiationRespondResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_dialogue: str = Field(min_length=1)     # agent's spoken response
    new_ask: float = Field(ge=0)                  # ₹/kg — agent's updated ask
    status: Literal["ongoing", "agreed", "rejected"]
    final_price: Optional[float] = Field(default=None, ge=0)   # only when status == "agreed"
    audio_b64: Optional[str] = None               # base64 WAV if voice_mode was requested

    @field_validator("agent_dialogue", mode="before")
    @classmethod
    def strip_dialogue(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value


# ─── Internal Agent Contract (Pydantic enforces LLM JSON output) ─────────────

class AgentOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    """
    LLM MUST output exactly this shape. No free-form text.
    Enforced via structured output / prompt constraint.
    Guardrails check proposed_price >= reservation_price before passing to buyer.
    """
    proposed_price: float = Field(ge=0)           # ₹/kg
    dialogue: str = Field(min_length=1)           # what the agent says to the buyer
    strategy_used: Literal["boulware", "conceder"]

    @field_validator("dialogue", mode="before")
    @classmethod
    def strip_agent_dialogue(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value
