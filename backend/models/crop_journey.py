from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class QuestionsRequest(BaseModel):
    location: str
    month: int = Field(ge=1, le=12)
    land_photo_b64: Optional[str] = None


class AnalyzeRequest(BaseModel):
    location: str
    month: int = Field(ge=1, le=12)
    answers: Dict[str, Any]
    land_photo_b64: Optional[str] = None


class StartJourneyRequest(BaseModel):
    location: str
    crop_type: str
    sowing_date: str
    land_size_acres: float = Field(gt=0)
    irrigation_type: str
    answers: Dict[str, Any]
    farmer_id: str = "default"
    land_photo_b64: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    task_id: str
    completed: bool
    note: Optional[str] = None


class PhotoCheckRequest(BaseModel):
    photo_b64: str
    week: int
    stage: str


class CompleteJourneyRequest(BaseModel):
    selling_price_per_kg: float
    quantity_sold_kg: Optional[float] = None
    final_grade: Optional[str] = None
    buyer_name: Optional[str] = None
