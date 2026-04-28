"""
Gemini 2.5 Flash Vision — Crop Quality Grading + Auto-Detection
"""
import base64
import json
import re

from google import genai
from google.genai import types as genai_types

from config import settings
from models.grading import GradeResponse

AGMARK_PROMPTS = {
    "tomato":    "Agmark Grade A: uniform red colour, firm, no cracks, no blossom-end rot. Grade B: slight colour variation, minor surface blemishes. Grade C: soft spots, significant discolouration, cracks.",
    "wheat":     "Agmark Grade A: moisture <12%, uniform golden colour, no foreign matter. Grade B: moisture 12-14%, slight discolouration. Grade C: moisture >14%, visible impurities.",
    "onion":     "Agmark Grade A: dry neck, firm bulb, uniform size 45-55mm, no sprouts. Grade B: slightly soft, size 35-45mm. Grade C: soft, sprouting, skin damage.",
    "potato":    "Agmark Grade A: clean skin, firm, uniform size 45-65mm, no greening. Grade B: minor soil, slight size variation. Grade C: cuts, greening, soft spots.",
    "rice":      "Agmark Grade A: moisture <14%, uniform white/cream, no broken grains >5%. Grade B: moisture 14-15%, slight discolouration. Grade C: >15% broken, visible impurities.",
    "maize":     "Agmark Grade A: moisture <14%, uniform yellow, no mould. Grade B: moisture 14-15%, slight damage. Grade C: mouldy, >15% moisture.",
    "soybean":   "Agmark Grade A: moisture <12%, uniform yellowish, no splits >2%. Grade B: moisture 12-14%, some splits. Grade C: >14% moisture, visible damage.",
    "cotton":    "Agmark Grade A: staple length >28mm, clean, uniform. Grade B: 25-28mm, minor trash. Grade C: <25mm, significant trash.",
    "sugarcane": "Agmark Grade A: brix >18%, clean, no pith damage. Grade B: brix 16-18%, minor damage. Grade C: brix <16%, significant deterioration.",
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
    detected = crop_type if crop_type.lower() not in ("auto", "") else None
    return GradeResponse(
        is_valid=True,
        grade="B",
        defects=["manual_review_recommended"],
        estimated_price_band="₹18-22/kg",
        confidence=0.35,
        agmark_standard="Fallback estimate — please retry with clearer image",
        detected_crop_type=detected,
    )


def _invalid_response(reason: str) -> GradeResponse:
    return GradeResponse(
        is_valid=False,
        invalid_reason=reason,
        grade=None,
        defects=[],
        estimated_price_band="N/A",
        confidence=0.0,
        agmark_standard="N/A",
        detected_crop_type=None,
    )


async def grade_crop_image(image_b64: str, crop_type: str) -> GradeResponse:
    """
    Send crop image to Gemini 2.5 Flash for Agmark grading.
    If crop_type == "auto", Gemini also identifies the crop from the image.
    """
    if not settings.GEMINI_API_KEY:
        return _fallback_grade(crop_type)

    auto_mode = crop_type.strip().lower() == "auto"
    normalized_crop = crop_type.strip() if not auto_mode else "auto"
    mime_type, raw_image = _normalize_image_data(image_b64)

    if auto_mode:
        agmark_info = "Identify the crop and apply the appropriate Indian Agmark standards."
        crop_line = "Identify what crop this is, then grade it according to Agmark standards."
        detected_field = '  "detected_crop_type": "exact crop name e.g. tomato",\n'
    else:
        agmark_info = AGMARK_PROMPTS.get(normalized_crop.lower(), f"Apply standard Indian Agmark grading for {normalized_crop}.")
        crop_line = f"Crop: {normalized_crop.title()}"
        detected_field = ""

    prompt = f"""You are an expert Indian agricultural quality inspector applying official Agmark grading standards.

Your FIRST task is to check if the image contains an agricultural crop, vegetable, fruit, or grain.
- If the image does NOT contain any crop/vegetable/fruit/grain (e.g. it shows a person, animal, vehicle, building, landscape, text, etc.), you MUST respond ONLY with:
  {{"is_valid": false, "invalid_reason": "<one sentence explaining what the image actually shows and why it cannot be graded>"}}
- Do NOT attempt to grade a non-agricultural image. Do NOT assign a grade to it.

If the image IS a crop/vegetable/fruit/grain, proceed with grading:
{crop_line}
Agmark Standards: {agmark_info}

Respond ONLY with this exact JSON (no markdown, no explanation):
{{
  "is_valid": true,
{detected_field}  "grade": "A" or "B" or "C",
  "defects": ["defect1", "defect2"],
  "estimated_price_band": "₹XX-YY/kg",
  "confidence": 0.0 to 1.0,
  "agmark_standard": "brief description of which standard applied"
}}

If the image is a crop but you cannot determine quality clearly, set confidence to 0.15 and grade to "C"."""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        image_bytes = base64.b64decode(raw_image)
        image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, image_part],
        )
        result = _extract_json_payload(response.text)

        # Handle invalid/non-crop image response
        if not result.get("is_valid", True):
            return _invalid_response(result.get("invalid_reason", "Image does not contain a recognizable crop."))

        # Ensure detected_crop_type is populated for auto mode
        result["is_valid"] = True
        if auto_mode and "detected_crop_type" not in result:
            result["detected_crop_type"] = "unknown"
        elif not auto_mode:
            result["detected_crop_type"] = normalized_crop
        return GradeResponse(**result)
    except Exception as e:
        print(f"[vision] Gemini grading failed: {e}")
        return _fallback_grade(normalized_crop)
