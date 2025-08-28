from __future__ import annotations

import threading
import time
from contextlib import contextmanager
from typing import Optional

from sqlmodel import Session, select

from ..adapters.marktplaats import MarktplaatsClient
from ..data.db import get_engine
from ..data.models import Client, MatchResult, SearchRequest
from .alerts import format_alert_message, send_email_stub, send_whatsapp_stub
from .matching import upsert_match_results


@contextmanager
def get_session():
    engine = get_engine()
    with Session(engine) as session:
        yield session


class Watcher:
    def __init__(self, poll_seconds: int = 15) -> None:
        self.poll_seconds = poll_seconds
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self._client = MarktplaatsClient()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _run_loop(self) -> None:
        while not self._stop.is_set():
            try:
                self._poll_once()
            except Exception as exc:  # keep background loop alive in MVP
                print(f"watcher error: {exc}")
            finally:
                self._stop.wait(self.poll_seconds)

    def _poll_once(self) -> None:
        with get_session() as session:
            active_searches = session.exec(
                select(SearchRequest).where(SearchRequest.is_active == True)
            ).all()
            for s in active_searches:
                query = s.text_query or "hoekbank"
                ads = self._client.search(query=query)
                results = upsert_match_results(session, s, ads)
                # alert on new results only
                for result, is_new in results:
                    if is_new:
                        self._notify(session, s, result)

    def _notify(self, session: Session, s: SearchRequest, r: MatchResult) -> None:
        client = session.get(Client, s.client_id)
        if not client:
            return
        msg = format_alert_message(r)
        if client.email:
            send_email_stub(client.email, subject="New match found", body=msg)
        elif client.whatsapp:
            send_whatsapp_stub(client.whatsapp, body=msg)


watcher_singleton = Watcher()

