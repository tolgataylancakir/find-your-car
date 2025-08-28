from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional


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
        pass

    def search(self, query: str) -> Iterable[MarktplaatsAd]:
        # Stubbed sample data for MVP without real scraper/API
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

