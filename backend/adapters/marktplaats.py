from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional

import requests

from ..config import settings


@dataclass
class MarktplaatsAd:
    ad_id: str
    title: str
    price: Optional[int]
    distance_km: Optional[int]
    url: str
    photo_urls: List[str]
    corner_side: Optional[str]  # "left" or "right" if present in text


class MarktplaatsClient:
    def __init__(self) -> None:
        self.mode = settings.marktplaats_mode
        self.base_url = settings.marktplaats_api_base_url
        self.api_key = settings.marktplaats_api_key
        self.bearer = settings.marktplaats_bearer_token

    def search(self, query: str) -> Iterable[MarktplaatsAd]:
        if self.mode == "api" and self.base_url:
            try:
                headers = {}
                if self.api_key:
                    headers["X-API-Key"] = self.api_key
                if self.bearer:
                    headers["Authorization"] = f"Bearer {self.bearer}"
                resp = requests.get(
                    f"{self.base_url.rstrip('/')}/search",
                    params={"q": query},
                    headers=headers,
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
                ads: List[MarktplaatsAd] = []
                for item in data.get("results", []):
                    ads.append(
                        MarktplaatsAd(
                            ad_id=str(item.get("id")),
                            title=item.get("title") or "",
                            price=item.get("price"),
                            distance_km=item.get("distance_km"),
                            url=item.get("url") or "",
                            photo_urls=item.get("photos", [])[:3],
                            corner_side=item.get("corner_side"),
                        )
                    )
                return ads
            except Exception as exc:
                print(f"Marktplaats API error, falling back to stub: {exc}")
        # Fallback: stubbed sample data for MVP
        sample: List[MarktplaatsAd] = [
            MarktplaatsAd(
                ad_id="A1",
                title="Hoekbank links beige microleder",
                price=450,
                distance_km=12,
                url="https://www.marktplaats.nl/v/a/A1",
                photo_urls=[
                    "https://example.com/a1-1.jpg",
                    "https://example.com/a1-2.jpg",
                ],
                corner_side="left",
            ),
            MarktplaatsAd(
                ad_id="A2",
                title="Hoekbank rechts ribstof grijs",
                price=600,
                distance_km=25,
                url="https://www.marktplaats.nl/v/a/A2",
                photo_urls=[
                    "https://example.com/a2-1.jpg",
                    "https://example.com/a2-2.jpg",
                ],
                corner_side="right",
            ),
        ]
        return sample

