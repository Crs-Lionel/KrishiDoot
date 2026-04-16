from fastapi import APIRouter, HTTPException, Query

from services.apmc_api import get_modal_price, get_mandi_prices, FALLBACK_PRICES

router = APIRouter()


@router.get("/price")
async def get_market_price(
    crop: str = Query(..., min_length=1),
    state: str = Query(..., min_length=1),
):
    """
    Fetch today's APMC modal price for a crop in a state.
    Example: GET /market/price?crop=tomato&state=karnataka
    Falls back to representative prices if data.gov.in is rate-limited.
    """
    crop = crop.strip().replace("_", " ")
    state = state.strip().replace("_", " ")

    try:
        price = await get_modal_price(crop, state)
        return {"crop": crop, "state": state, "modal_price_per_kg": price, "unit": "INR/kg"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        fallback = FALLBACK_PRICES.get(crop.lower(), 20.0)
        return {"crop": crop, "state": state, "modal_price_per_kg": fallback, "unit": "INR/kg"}


@router.get("/mandis")
async def get_mandi_comparison(
    crop: str = Query(..., min_length=1),
    state: str = Query(..., min_length=1),
):
    """
    Return 3-4 nearby APMC mandis ranked by today's modal price — tells the farmer
    WHERE to sell for maximum return, not just what the price is.

    Response includes per-mandi: name, district, distance_km, modal price,
    arrivals volume (tonnes), and price trend (up/stable/down).

    Uses data.gov.in OGD bulk dataset for price accuracy.
    Falls back to curated representative dataset when DEMO_KEY is rate-limited.

    Example: GET /market/mandis?crop=tomato&state=karnataka
    """
    crop = crop.strip().replace("_", " ")
    state = state.strip().replace("_", " ")

    try:
        mandis = await get_mandi_prices(crop, state)
        best = mandis[0] if mandis else None
        return {
            "crop": crop,
            "state": state,
            "mandis": mandis,
            "best_mandi": best["name"] if best else None,
            "best_price_per_kg": best["price"] if best else None,
            "data_source": "data.gov.in OGD Platform — APMC Mandi Prices",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
