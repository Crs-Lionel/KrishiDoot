"""
Gemini 1.5 Pro Vision — Crop Quality Grading
Owned by: Person 2
"""
import json
import re

from google import genai

from config import settings
from models.grading import GradeResponse

# Agmark standards per crop — add more as needed
AGMARK_PROMPTS = {
    "tomato": "Agmark Grade A: uniform red colour, firm, no cracks, no blossom-end rot. Grade B: slight colour variation, minor surface blemishes. Grade C: soft spots, significant discolouration, cracks.",
    "wheat": "Agmark Grade A: moisture <12%, uniform golden colour, no foreign matter. Grade B: moisture 12-14%, slight discolouration. Grade C: moisture >14%, visible impurities.",
    "onion": "Agmark Grade A: dry neck, firm bulb, uniform size 45-55mm, no sprouts. Grade B: slightly soft, size 35-45mm. Grade C: soft, sprouting, skin damage.",
    "potato": "Agmark Grade A: clean skin, firm, uniform size 45-65mm, no greening. Grade B: minor soil, slight size variation. Grade C: cuts, greening, soft spots.",
}


def _normalize_image_data(image_b64: str) -> tuple[str, str]:
    cleaned = image_b64.strip()
    if cleaned.startswith("data:") and "," in cleaned:
        header, raw = cleaned.split(",", 1)
        mime_type = header.split(";")[0].replace("data:", "") or "image/jpeg"
        return mime_type, raw
    return "image/jpeg", cleaned


def _extract_json_payload(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.DOTALL)
    return json.loads(cleaned)


def _fallback_grade(crop_type: str) -> GradeResponse:
    return GradeResponse(
        grade="B",
        defects=["manual_review_recommended"],
        estimated_price_band="₹18-22/kg",
        confidence=0.35,
        agmark_standard=f"Fallback estimate for {crop_type}",
    )


async def grade_crop_image(image_b64: str, crop_type: str) -> GradeResponse:
    """
    Send crop image to Gemini 1.5 Pro Vision for Agmark grading.
    Returns structured GradeResponse.
    """
    if not settings.GEMINI_API_KEY:
        return _fallback_grade(crop_type)

    genai.Client(api_key=settings.GEMINI_API_KEY)  # early check

    normalized_crop = crop_type.strip()
    agmark_info = AGMARK_PROMPTS.get(normalized_crop.lower(), f"Apply standard Indian Agmark grading for {normalized_crop}.")
    mime_type, raw_image = _normalize_image_data(image_b64)

    prompt = f"""You are an expert Indian agricultural quality inspector applying official Agmark grading standards.

Crop: {normalized_crop.title()}
Agmark Standards: {agmark_info}

Inspect the image and respond ONLY with this exact JSON (no markdown, no explanation):
{{
  "grade": "A" or "B" or "C",
  "defects": ["defect1", "defect2"],
  "estimated_price_band": "₹XX-YY/kg",
  "confidence": 0.0 to 1.0,
  "agmark_standard": "brief description of which standard applied"
}}"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        import base64
        image_part = {"inline_data": {"mime_type": mime_type, "data": raw_image}}
        response = client.models.generate_content(
            model="gemini-1.5-pro",
            contents=[prompt, image_part],
        )
        result = _extract_json_payload(response.text)
        return GradeResponse(**result)
    except Exception:
        return _fallback_grade(normalized_crop)
