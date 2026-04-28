from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GradeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_b64: str = Field(min_length=1)
    crop_type: str = Field(min_length=1, default="auto")  # "auto" = AI detects from image

    @field_validator("image_b64", "crop_type", mode="before")
    @classmethod
    def strip_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value


class GradeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_valid: bool = True                          # False if image is not a crop/vegetable/fruit
    invalid_reason: Optional[str] = None           # human-readable reason when is_valid=False
    grade: Optional[Literal["A", "B", "C"]] = None
    defects: list[str] = Field(default_factory=list)
    estimated_price_band: str = Field(default="N/A")
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    agmark_standard: str = Field(default="N/A")
    detected_crop_type: Optional[str] = None   # populated when crop_type="auto"

    @field_validator("estimated_price_band", "agmark_standard", mode="before")
    @classmethod
    def strip_response_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value
