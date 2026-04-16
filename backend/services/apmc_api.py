import httpx
from config import settings

APMC_API_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


async def get_modal_price(crop: str, state: str) -> float:
    """
    Fetch today's modal price (₹/kg) from the data.gov.in APMC Mandi Prices API.

    API UUID: 9ef84268-d588-465a-a308-a864a43d0070
    Key field: Modal_Price — the price at which maximum trade volume occurred today.
    Raw unit is ₹/quintal (100kg), so we divide by 100 to get ₹/kg.

    WARNING: DEMO_KEY is hard-limited to 30 requests/hour.
    Use a production key from data.gov.in for anything beyond basic testing.
    """
    params = {
        "api-key": settings.DATA_GOV_API_KEY,
        "format": "json",
        "filters[commodity]": crop.title(),
        "filters[state]": state.title(),
        "limit": 5,
        "sort[Arrival_Date]": "desc",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(APMC_API_BASE, params=params)
        response.raise_for_status()
        data = response.json()

    records = data.get("records", [])
    if not records:
        raise ValueError(f"No APMC data found for '{crop}' in '{state}'. Check spelling or try a different state.")

    modal_price_per_quintal = float(records[0]["Modal_Price"])
    return round(modal_price_per_quintal / 100, 2)  # ₹/quintal → ₹/kg


def compute_batna(modal_price_per_kg: float, transport_cost_per_kg: float = 2.0) -> float:
    """
    BATNA (Best Alternative To Negotiated Agreement) = Modal_Price - Transportation_Cost.
    This is the farmer's reservation price — the absolute floor.
    The agent MUST NEVER agree to a price below this.

    Default transport cost: ₹2/kg. Override per farmer if known.
    """
    batna = modal_price_per_kg - transport_cost_per_kg
    return round(max(batna, 0.0), 2)
