from __future__ import annotations

import json
from typing import Iterable

from ..data.models import MatchResult


def send_email_stub(to_email: str, subject: str, body: str) -> None:
    # Stub: integrate with real email provider later
    print(f"EMAIL to={to_email} subject={subject} body={body[:200]}...")


def send_whatsapp_stub(to_number: str, body: str) -> None:
    # Stub: integrate with WhatsApp API provider later
    print(f"WA to={to_number} body={body[:200]}...")


def format_alert_message(result: MatchResult) -> str:
    photos = []
    try:
        photos = json.loads(result.photo_urls_json or "[]")
    except Exception:
        photos = []
    pieces = [
        f"Match: {result.match_percent}%",
        f"Price: €{result.price}" if result.price is not None else None,
        f"Distance: {result.distance_km} km" if result.distance_km is not None else None,
        f"Link: {result.url}",
        f"Photos: {' | '.join(photos[:3])}" if photos else None,
    ]
    return "\n".join([p for p in pieces if p])

