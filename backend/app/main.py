from typing import List, Optional, Dict, Any
from datetime import timedelta
import asyncio

import httpx
from bs4 import BeautifulSoup
from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Car Deals Scraper API", version="0.1.0")

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


USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
HEADERS = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9,nl;q=0.8,de;q=0.7"}


def build_marktplaats_link(make: str, model: Optional[str], price_max: Optional[int]) -> str:
    base = "https://www.marktplaats.nl/q/auto's/"
    q_parts = []
    if make:
        q_parts.append(make)
    if model:
        q_parts.append(model)
    q = "+".join(q_parts)
    params = []
    if price_max:
        params.append(f"prijsTot={price_max}")
    return f"{base}{q}/?{'&'.join(params)}" if params else f"{base}{q}/"


def build_mobile_de_link(make: str, model: Optional[str], price_max: Optional[int]) -> str:
    # Basic link; mobile.de uses make/model slugs and params
    base = "https://suchen.mobile.de/fahrzeuge/search.html"
    params = []
    if make:
        params.append(f"makeModelVariant1.makeId={make}")  # Placeholder; future: map make->id
    if model:
        params.append(f"makeModelVariant1.modelDescription={model}")
    if price_max:
        params.append(f"maxPrice={price_max}")
    params.append("isSearchRequest=true")
    return f"{base}?{'&'.join(params)}"


def compute_deal_score(price: Optional[float], mileage_km: Optional[int]) -> Optional[float]:
    if price is None:
        return None
    # Simple heuristic: cheaper is better; adjust by mileage modestly
    normalized_price = min(max(price / 50000.0, 0), 1)  # assume 50k baseline
    mileage_factor = 1.0
    if mileage_km is not None:
        mileage_factor = max(0.5, min(1.2, 1.0 - (mileage_km - 100000) / 300000.0))
    score = max(0.0, min(1.0, (1.0 - normalized_price) * mileage_factor))
    return round(score, 3)


async def fetch_html(client: httpx.AsyncClient, url: str) -> str:
    if url in page_cache:
        return page_cache[url]
    resp = await client.get(url, headers=HEADERS, timeout=20)
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
    html = await fetch_html(client, url)
    soup = BeautifulSoup(html, "html.parser")

    listings: List[Listing] = []
    # Heuristic selectors; may need adjustment if DOM changes
    cards = soup.select('[data-testid="listing-card"]')
    for card in cards[:limit]:
        a = card.select_one('a[href]')
        if not a:
            continue
        href = a.get('href')
        full_url = href if href.startswith('http') else f"https://www.marktplaats.nl{href}"
        title_el = card.select_one('[data-testid="listing-title"]') or card.select_one('h3')
        title = title_el.get_text(strip=True) if title_el else "Listing"
        price_el = card.select_one('[data-testid="price"]') or card.select_one('.price')
        price_text = price_el.get_text(strip=True) if price_el else None
        mile_el = card.find(string=lambda s: s and ('km' in s or 'KM' in s))
        mileage_text = str(mile_el) if mile_el else None
        img = card.select_one('img')
        thumb = img.get('src') or img.get('data-src') if img else None
        loc_el = card.select_one('[data-testid="location"]')
        loc = loc_el.get_text(strip=True) if loc_el else None
        listings.append(norm_listing('marktplaats', full_url, title, price_text, mileage_text, thumb, loc))
    return listings


async def scrape_mobile_de(client: httpx.AsyncClient, make: str, model: Optional[str], price_max: Optional[int], limit: int = 10) -> List[Listing]:
    url = build_mobile_de_link(make, model, price_max)
    html = await fetch_html(client, url)
    soup = BeautifulSoup(html, "html.parser")

    listings: List[Listing] = []
    # Heuristic: look for result items
    cards = soup.select('[data-testid="result-list"] a[href*="/inserat/"]')
    seen = set()
    for a in cards:
        href = a.get('href')
        if not href or href in seen:
            continue
        seen.add(href)
        full_url = href if href.startswith('http') else f"https://suchen.mobile.de{href}"
        title = a.get_text(strip=True) or "Listing"
        # Try to find nearby price/mileage in ancestors
        item = a.find_parent(['article', 'div'])
        price_text = None
        mileage_text = None
        thumb = None
        loc = None
        if item:
            price_el = item.find(string=lambda s: s and any(sym in s for sym in ['€', 'EUR']))
            price_text = str(price_el) if price_el else None
            mileage_el = item.find(string=lambda s: s and 'km' in s.lower())
            mileage_text = str(mileage_el) if mileage_el else None
            img = item.find('img')
            thumb = img.get('src') or img.get('data-src') if img else None
            loc_el = item.find(string=lambda s: s and ' ' in s)
            loc = str(loc_el) if loc_el else None
        listings.append(norm_listing('mobile.de', full_url, title, price_text, mileage_text, thumb, loc))
        if len(listings) >= limit:
            break
    return listings


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
            scrape_mobile_de(client, make, model, price_max, limit),
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