from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GradeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_b64: str = Field(min_length=1)          # base64-encoded crop photo
    crop_type: str = Field(min_length=1)          # e.g. "tomato", "wheat", "onion"

    @field_validator("image_b64", "crop_type", mode="before")
    @classmethod
    def strip_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value


class GradeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    grade: Literal["A", "B", "C"]
    defects: list[str] = Field(default_factory=list)    # e.g. ["surface cracks", "discolouration"]
    estimated_price_band: str = Field(min_length=1)     # e.g. "₹18-22/kg"
    confidence: float = Field(ge=0.0, le=1.0)           # 0.0 to 1.0
    agmark_standard: str = Field(min_length=1)          # which Agmark standard was applied

    @field_validator("estimated_price_band", "agmark_standard", mode="before")
    @classmethod
    def strip_response_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value
