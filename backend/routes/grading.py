from fastapi import APIRouter, HTTPException
from models.grading import GradeRequest, GradeResponse

router = APIRouter()


@router.post("/crop", response_model=GradeResponse)
async def grade_crop(request: GradeRequest):
    """
    Grade a crop photo using Gemini Vision (Agmark standards).
    Person 2: wire in services/vision.py here.
    """
    # TODO Person 2: replace stub with services/vision.py call
    # from services.vision import grade_crop_image
    # return await grade_crop_image(request.image_b64, request.crop_type)
    raise HTTPException(status_code=501, detail="Vision grading not yet implemented — Person 2's task")
