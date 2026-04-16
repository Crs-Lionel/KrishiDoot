from pydantic import BaseModel
from typing import List, Literal


class GradeRequest(BaseModel):
    image_b64: str                  # base64-encoded crop photo
    crop_type: str                  # e.g. "tomato", "wheat", "onion"


class GradeResponse(BaseModel):
    grade: Literal["A", "B", "C"]
    defects: List[str]              # e.g. ["surface cracks", "discolouration"]
    estimated_price_band: str       # e.g. "₹18-22/kg"
    confidence: float               # 0.0 to 1.0
    agmark_standard: str            # which Agmark standard was applied
