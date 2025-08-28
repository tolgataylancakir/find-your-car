from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv


load_dotenv()


@dataclass
class Settings:
    # Adapter mode: "stub" (default) or "api"
    marktplaats_mode: str = os.getenv("MARKTPLAATS_MODE", "stub").lower()

    # If using API mode, configure these
    marktplaats_api_base_url: Optional[str] = os.getenv("MARKTPLAATS_API_BASE_URL")
    marktplaats_api_key: Optional[str] = os.getenv("MARKTPLAATS_API_KEY")
    marktplaats_bearer_token: Optional[str] = os.getenv("MARKTPLAATS_BEARER_TOKEN")

    # Poll interval for the background watcher
    poll_seconds: int = int(os.getenv("POLL_SECONDS", "15"))


settings = Settings()

