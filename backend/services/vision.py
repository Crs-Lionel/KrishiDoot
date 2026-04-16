"""
Gemini 1.5 Pro Vision — Crop Quality Grading
Owned by: Person 2

Input: base64 crop image + crop_type
Output: GradeResponse (grade A/B/C, defects, price band)

The prompt instructs Gemini to apply official Agmark grading standards
for the specific crop. Zero-shot multimodal reasoning.

Long-term: replace with fine-tuned YOLO11 for edge-device inference (13.5ms).
"""
import base64
import json
import google.generativeai as genai
from config import settings
from models.grading import GradeResponse

# Agmark standards per crop — add more as needed
AGMARK_PROMPTS = {
    "tomato": "Agmark Grade A: uniform red colour, firm, no cracks, no blossom-end rot. Grade B: slight colour variation, minor surface blemishes. Grade C: soft spots, significant discolouration, cracks.",
    "wheat": "Agmark Grade A: moisture <12%, uniform golden colour, no foreign matter. Grade B: moisture 12-14%, slight discolouration. Grade C: moisture >14%, visible impurities.",
    "onion": "Agmark Grade A: dry neck, firm bulb, uniform size 45-55mm, no sprouts. Grade B: slightly soft, size 35-45mm. Grade C: soft, sprouting, skin damage.",
    "potato": "Agmark Grade A: clean skin, firm, uniform size 45-65mm, no greening. Grade B: minor soil, slight size variation. Grade C: cuts, greening, soft spots.",
}


async def grade_crop_image(image_b64: str, crop_type: str) -> GradeResponse:
    """
    Send crop image to Gemini 1.5 Pro Vision for Agmark grading.
    Returns structured GradeResponse.
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")

    agmark_info = AGMARK_PROMPTS.get(crop_type.lower(), f"Apply standard Indian Agmark grading for {crop_type}.")

    prompt = f"""You are an expert Indian agricultural quality inspector applying official Agmark grading standards.

Crop: {crop_type.title()}
Agmark Standards: {agmark_info}

Inspect the image and respond ONLY with this exact JSON (no markdown, no explanation):
{{
  "grade": "A" or "B" or "C",
  "defects": ["defect1", "defect2"],
  "estimated_price_band": "₹XX-YY/kg",
  "confidence": 0.0 to 1.0,
  "agmark_standard": "brief description of which standard applied"
}}"""

    image_data = {"mime_type": "image/jpeg", "data": image_b64}
    response = model.generate_content([prompt, image_data])
    result = json.loads(response.text.strip())
    return GradeResponse(**result)
