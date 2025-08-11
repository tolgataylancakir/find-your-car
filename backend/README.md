# Car Deals Scraper API (MVP)

Lightweight FastAPI service that builds deep links and scrapes top listings from Marktplaats and mobile.de on demand, with a 15-minute in-memory cache.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- GET `/health` – Health check
- GET `/search?make=BMW&model=320&price_max=15000&limit=10` – Returns:
  - `deep_links`: Direct search URLs on each source
  - `listings`: Normalized top listings with `deal_score`
  - `errors`: Any per-source errors

## Notes

- Be respectful of target sites, use low frequency, and consider robots.txt.
- The mobile.de `makeId` is currently a placeholder. For better results, map make names to IDs later.
- This MVP avoids a database; caching is in-memory and resets on restart.