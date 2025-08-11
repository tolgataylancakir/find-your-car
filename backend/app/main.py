from typing import List, Optional, Dict, Any
from datetime import timedelta
import asyncio
from urllib.parse import quote, urlencode

import httpx
from bs4 import BeautifulSoup
from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Car Deals Scraper API", version="0.1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache: query->results for 15 minutes, per-source pages cached too
query_cache: TTLCache[str, Any] = TTLCache(maxsize=512, ttl=15 * 60)
page_cache: TTLCache[str, str] = TTLCache(maxsize=1024, ttl=15 * 60)


class Listing(BaseModel):
    id: str
    source: str
    url: str
    title: str
    price: Optional[float] = None
    currency: Optional[str] = None
    mileage_km: Optional[int] = None
    first_registration: Optional[str] = None
    location: Optional[str] = None
    thumbnail_url: Optional[str] = None
    extracted_at: Optional[str] = None
    deal_score: Optional[float] = None


class SearchResponse(BaseModel):
    deep_links: Dict[str, str]
    listings: List[Listing]
    errors: Dict[str, str] = Field(default_factory=dict)


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

MARKTPLAATS_HEADERS = {
    **DEFAULT_HEADERS,
    "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
    "Referer": "https://www.marktplaats.nl/",
}

MOBILE_DE_HEADERS = {
    **DEFAULT_HEADERS,
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    "Referer": "https://suchen.mobile.de/",
}


def build_marktplaats_link(make: str, model: Optional[str], price_max: Optional[int]) -> str:
    # Encode path segment for auto's
    base = "https://www.marktplaats.nl/q/auto's/"
    q_parts = []
    if make:
        q_parts.append(make)
    if model:
        q_parts.append(model)
    q = "+".join(q_parts)
    params = []
    if price_max:
        params.append(("prijsTot", str(price_max)))
    query = urlencode(params)
    return f"{base}{q}/?{query}" if query else f"{base}{q}/"


def build_mobile_de_link(make: str, model: Optional[str], price_max: Optional[int]) -> str:
    base = "https://suchen.mobile.de/fahrzeuge/search.html"
    params: Dict[str, str] = {
        "isSearchRequest": "true",
    }
    # Note: mobile.de expects numeric makeId; this is a placeholder deep link
    if make:
        params["makeModelVariant1.modelDescription"] = model or ""
        params["makeModelVariant1.makeId"] = make  # placeholder; later map names to IDs
    if price_max:
        params["maxPrice"] = str(price_max)
    return f"{base}?{urlencode(params)}"


def compute_deal_score(price: Optional[float], mileage_km: Optional[int]) -> Optional[float]:
    if price is None:
        return None
    normalized_price = min(max(price / 50000.0, 0), 1)
    mileage_factor = 1.0
    if mileage_km is not None:
        mileage_factor = max(0.5, min(1.2, 1.0 - (mileage_km - 100000) / 300000.0))
    score = max(0.0, min(1.0, (1.0 - normalized_price) * mileage_factor))
    return round(score, 3)


async def fetch_html(client: httpx.AsyncClient, url: str, headers: Optional[Dict[str, str]] = None) -> str:
    if url in page_cache:
        return page_cache[url]
    combined_headers = {**DEFAULT_HEADERS, **(headers or {})}
    resp = await client.get(url, headers=combined_headers, timeout=20)
    resp.raise_for_status()
    page_cache[url] = resp.text
    return resp.text


def parse_price(text: str) -> Optional[float]:
    try:
        digits = "".join(ch if ch.isdigit() else " " for ch in text)
        parts = digits.split()
        if not parts:
            return None
        value = float("".join(parts))
        return value
    except Exception:
        return None


def parse_int(text: str) -> Optional[int]:
    try:
        digits = "".join(ch if ch.isdigit() else "" for ch in text)
        return int(digits) if digits else None
    except Exception:
        return None


def norm_listing(source: str, url: str, title: str, price_text: Optional[str], mileage_text: Optional[str], thumb: Optional[str], location: Optional[str]) -> Listing:
    price = parse_price(price_text or "") if price_text else None
    mileage = parse_int(mileage_text or "") if mileage_text else None
    return Listing(
        id=f"{source}:{url}",
        source=source,
        url=url,
        title=title.strip(),
        price=price,
        currency="EUR",
        mileage_km=mileage,
        first_registration=None,
        location=location,
        thumbnail_url=thumb,
        deal_score=compute_deal_score(price, mileage),
    )


async def scrape_marktplaats(client: httpx.AsyncClient, make: str, model: Optional[str], price_max: Optional[int], limit: int = 10) -> List[Listing]:
    url = build_marktplaats_link(make, model, price_max)
    html = await fetch_html(client, url, headers=MARKTPLAATS_HEADERS)
    soup = BeautifulSoup(html, "html.parser")

    listings: List[Listing] = []
    # Heuristic selectors; may need adjustment if DOM changes
    cards = soup.select('[data-testid="listing-card"], article, li')
    for card in cards[:limit * 2]:
        a = card.select_one('a[href]')
        if not a:
            continue
        href = a.get('href')
        if not href:
            continue
        full_url = href if href.startswith('http') else f"https://www.marktplaats.nl{href}"
        title_el = card.select_one('[data-testid="listing-title"], h3, h2')
        title = title_el.get_text(strip=True) if title_el else a.get_text(strip=True) or "Listing"
        price_el = card.select_one('[data-testid="price"], .price, [class*="Price"]')
        price_text = price_el.get_text(strip=True) if price_el else None
        mile_el = card.find(string=lambda s: isinstance(s, str) and ('km' in s.lower()))
        mileage_text = str(mile_el) if mile_el else None
        img = card.select_one('img')
        thumb = (img.get('src') or img.get('data-src')) if img else None
        loc_el = card.select_one('[data-testid="location"], [class*="location" i]')
        loc = loc_el.get_text(strip=True) if loc_el else None
        listing = norm_listing('marktplaats', full_url, title, price_text, mileage_text, thumb, loc)
        if listing.title and listing.url:
            listings.append(listing)
        if len(listings) >= limit:
            break
    return listings


async def scrape_mobile_de(client: httpx.AsyncClient, make: str, model: Optional[str], price_max: Optional[int], limit: int = 10) -> List[Listing]:
    # Temporarily disabled scraping due to frequent 403; keep deep link only
    return []


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/search", response_model=SearchResponse)
async def search(
    make: str = Query(..., min_length=1),
    model: Optional[str] = Query(None),
    price_max: Optional[int] = Query(None, ge=0),
    limit: int = Query(10, ge=1, le=30),
) -> SearchResponse:
    cache_key = f"make={make}|model={model}|price_max={price_max}|limit={limit}"
    if cache_key in query_cache:
        return query_cache[cache_key]

    deep_links = {
        "marktplaats": build_marktplaats_link(make, model, price_max),
        "mobile.de": build_mobile_de_link(make, model, price_max),
    }

    errors: Dict[str, str] = {}

    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [
            scrape_marktplaats(client, make, model, price_max, limit),
            # scrape_mobile_de(client, make, model, price_max, limit),
        ]
        results: List[List[Listing]] = []
        for coro in asyncio.as_completed(tasks):
            try:
                res = await coro
                results.append(res)
            except Exception as exc:
                errors[type(exc).__name__] = str(exc)
        listings = [item for sub in results for item in sub]

    payload = SearchResponse(deep_links=deep_links, listings=listings, errors=errors)
    query_cache[cache_key] = payload
    return payload