from fastapi import APIRouter, HTTPException, Query

from services.apmc_api import get_modal_price

router = APIRouter()


@router.get("/price")
async def get_market_price(
    crop: str = Query(..., min_length=1),
    state: str = Query(..., min_length=1),
):
    """
    Fetch today's APMC modal price for a crop in a state.
    Example: GET /market/price?crop=tomato&state=karnataka
    """
    crop = crop.strip()
    state = state.strip()

    try:
        price = await get_modal_price(crop, state)
        return {"crop": crop, "state": state, "modal_price_per_kg": price, "unit": "INR/kg"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail="APMC API error.") from e

