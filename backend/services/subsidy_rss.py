"""
Government subsidy & scheme alerts via RSS feeds.
"""
import asyncio
import time
import httpx
import feedparser

RSS_FEEDS = [
    ("PIB Agriculture", "https://pib.gov.in/RSSNewsByCategory.aspx?Category=Agriculture"),
    ("Govt India Agriculture", "https://www.india.gov.in/topics/agriculture/rss"),
]

_SUBSIDY_KW = {
    "subsidy", "yojana", "scheme", "kisan", "fasal bima", "pm-kisan",
    "compensation", "relief", "grant", "insurance", "msp",
    "minimum support", "kisaan", "krishi", "agriculture support", "loan waiver",
}

_cache: dict[str, tuple[float, list]] = {}
_TTL = 3600  # 1 hour


async def fetch_subsidy_alerts(crop_type: str, state: str) -> list[dict]:
    key = f"{crop_type.lower()}:{state.lower()}"
    now = time.time()
    if key in _cache and now - _cache[key][0] < _TTL:
        return _cache[key][1]

    crop_l = crop_type.lower()
    state_l = state.lower()

    async with httpx.AsyncClient(timeout=8) as client:
        results = await asyncio.gather(
            *[_fetch_feed(client, name, url) for name, url in RSS_FEEDS],
            return_exceptions=True,
        )

    alerts: list[dict] = []
    for res in results:
        if isinstance(res, Exception):
            continue
        for entry in res:
            text = (entry.get("title", "") + " " + entry.get("summary", "")).lower()
            is_subsidy = any(kw in text for kw in _SUBSIDY_KW)
            is_relevant = crop_l in text or state_l in text or "kisan" in text or "kisaan" in text or "all farmer" in text
            if is_subsidy and is_relevant:
                alerts.append(entry)

    seen: set[str] = set()
    unique: list[dict] = []
    for a in alerts:
        k = a["title"][:60]
        if k not in seen:
            seen.add(k)
            unique.append(a)

    result = unique[:6]
    _cache[key] = (now, result)
    return result


async def _fetch_feed(client: httpx.AsyncClient, name: str, url: str) -> list[dict]:
    try:
        r = await client.get(url, headers={"User-Agent": "KrishiDoot/1.0"})
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, r.text)
        return [
            {
                "title": e.get("title", ""),
                "summary": (e.get("summary", "") or "")[:350],
                "link": e.get("link", ""),
                "published": e.get("published", ""),
                "source": name,
            }
            for e in feed.entries[:20]
        ]
    except Exception:
        return []
