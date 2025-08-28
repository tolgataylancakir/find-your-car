from __future__ import annotations

import json
from typing import Iterable, List, Tuple

from sqlmodel import Session, select

from ..adapters.marktplaats import MarktplaatsAd
from ..data.models import CornerSide, MatchResult, SearchRequest


def compute_match_percent(search: SearchRequest, ad: MarktplaatsAd) -> float:
    score: float = 0.0
    max_score: float = 0.0

    # Corner side is essential
    max_score += 50
    if ad.corner_side and ad.corner_side == search.corner_side.value:
        score += 50

    # Budget: closer is better, under budget counts
    if search.budget is not None and ad.price is not None:
        max_score += 20
        if ad.price <= search.budget:
            score += 20

    # Distance
    if search.max_distance_km is not None and ad.distance_km is not None:
        max_score += 10
        if ad.distance_km <= search.max_distance_km:
            score += 10

    # Keywords include/exclude
    include_words: List[str] = (
        [w.strip().lower() for w in (search.include_keywords_csv or "").split(",") if w.strip()]
    )
    exclude_words: List[str] = (
        [w.strip().lower() for w in (search.exclude_keywords_csv or "").split(",") if w.strip()]
    )
    title_lc = (ad.title or "").lower()
    if include_words:
        max_score += 10
        if all(word in title_lc for word in include_words):
            score += 10
    if exclude_words:
        max_score += 10
        if any(word in title_lc for word in exclude_words):
            # hard fail on exclude: zero score
            return 0.0
        else:
            score += 10

    if max_score == 0:
        return 0.0
    return round(100.0 * score / max_score, 1)


def upsert_match_results(
    session: Session, search: SearchRequest, ads: Iterable[MarktplaatsAd]
) -> List[Tuple[MatchResult, bool]]:
    """Create or update MatchResult for each ad. Returns list of (result, is_new)."""
    results: List[Tuple[MatchResult, bool]] = []
    for ad in ads:
        match_percent = compute_match_percent(search, ad)
        if match_percent <= 0:
            continue
        existing = session.exec(
            select(MatchResult).where(
                (MatchResult.search_request_id == search.id) & (MatchResult.ad_id == ad.ad_id)
            )
        ).first()
        if existing:
            # Update fields if changed
            existing.match_percent = match_percent
            existing.price = ad.price
            existing.distance_km = ad.distance_km
            existing.photo_urls_json = json.dumps(ad.photo_urls)
            existing.corner_side = ad.corner_side
            existing.title = ad.title
            existing.url = ad.url
            results.append((existing, False))
        else:
            new_r = MatchResult(
                search_request_id=search.id,
                ad_id=ad.ad_id,
                title=ad.title,
                price=ad.price,
                distance_km=ad.distance_km,
                url=ad.url,
                photo_urls_json=json.dumps(ad.photo_urls),
                corner_side=ad.corner_side,
                match_percent=match_percent,
            )
            session.add(new_r)
            results.append((new_r, True))
    session.commit()
    return results

