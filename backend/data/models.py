from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class CornerSide(str, Enum):
    left = "left"
    right = "right"


class ResultStatus(str, Enum):
    new = "new"
    viewed = "viewed"
    completed = "completed"


class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SearchRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(index=True)

    # Mode: photo-based or manual text-based
    is_photo_based: bool = True

    # Common requirements
    corner_side: CornerSide
    color: Optional[str] = None
    fabric: Optional[str] = None
    shape: Optional[str] = None
    dimensions: Optional[str] = None
    budget: Optional[int] = None
    max_distance_km: Optional[int] = None

    # Keyword lists as CSV for simplicity in MVP
    include_keywords_csv: Optional[str] = None
    exclude_keywords_csv: Optional[str] = None

    # Photo-based
    photo_path: Optional[str] = None

    # Manual search
    text_query: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None

    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MatchResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    search_request_id: int = Field(index=True)
    ad_id: str = Field(index=True)

    # Snapshot of ad details for display and dedup
    title: Optional[str] = None
    price: Optional[int] = None
    distance_km: Optional[int] = None
    url: Optional[str] = None
    photo_urls_json: Optional[str] = None  # JSON-encoded list
    corner_side: Optional[str] = None

    match_percent: float = 0.0
    status: ResultStatus = Field(default=ResultStatus.new)
    notes: Optional[str] = None
    forwarded: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

