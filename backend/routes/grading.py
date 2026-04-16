from fastapi import APIRouter, HTTPException

from models.grading import GradeRequest, GradeResponse
from services.vision import grade_crop_image

router = APIRouter()


@router.post("/crop", response_model=GradeResponse)
async def grade_crop(request: GradeRequest):
    """
    Grade a crop photo using Gemini Vision (Agmark standards).
    """
    try:
        return await grade_crop_image(request.image_b64, request.crop_type)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Vision grading failed.") from exc
