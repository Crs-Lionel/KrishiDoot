"""
Weather data via wttr.in — free, no API key required.
"""
import time
import httpx

_cache: dict[str, tuple[float, dict]] = {}
_TTL = 300  # 5 minutes


async def get_weather(location: str) -> dict:
    now = time.time()
    if location in _cache and now - _cache[location][0] < _TTL:
        return _cache[location][1]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://wttr.in/{location}?format=j1",
                headers={"Accept-Language": "en"},
            )
            data = r.json()

        cur = data["current_condition"][0]
        days = data.get("weather", [])[:5]

        result = {
            "location": location,
            "current": {
                "temp_c": int(cur["temp_C"]),
                "feels_like_c": int(cur["FeelsLikeC"]),
                "humidity": int(cur["humidity"]),
                "desc": cur["weatherDesc"][0]["value"],
                "wind_kmph": int(cur["windspeedKmph"]),
                "precip_mm": float(cur.get("precipMM", 0)),
            },
            "forecast": [
                {
                    "date": d["date"],
                    "max_c": int(d["maxtempC"]),
                    "min_c": int(d["mintempC"]),
                    "avg_c": int(d["avgtempC"]),
                    "precip_mm": round(sum(float(h.get("precipMM", 0)) for h in d["hourly"]), 1),
                    "desc": d["hourly"][4]["weatherDesc"][0]["value"],
                }
                for d in days
            ],
            "advisory": _advisory(cur, days),
        }
        _cache[location] = (now, result)
        return result

    except Exception as e:
        return {
            "location": location,
            "current": None,
            "forecast": [],
            "advisory": "Weather data unavailable",
            "error": str(e),
        }


def _advisory(cur: dict, forecast: list) -> str:
    temp = int(cur["temp_C"])
    humidity = int(cur["humidity"])
    rain_tomorrow = sum(float(h.get("precipMM", 0)) for h in forecast[1]["hourly"]) if len(forecast) > 1 else 0

    tips = []
    if humidity > 80:
        tips.append("Nami zyada — fungal disease se bachao")
    if temp > 38:
        tips.append("Bahut garmi — sham ko pani de")
    if rain_tomorrow > 5:
        tips.append("Kal baarish — pesticide mat chhidke")
    if temp < 10:
        tips.append("Raat thandi — seedlings dhake")

    return " | ".join(tips) if tips else "Mausam theek hai — khet ka kaam ho sakta hai"
