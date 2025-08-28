from __future__ import annotations

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session, select

from .data.db import get_engine
from .data.models import Client, CornerSide, SearchRequest
from .adapters.marktplaats import MarktplaatsClient
from .services.matching import upsert_match_results


ui_router = APIRouter()


def get_session():
    engine = get_engine()
    with Session(engine) as session:
        yield session


@ui_router.get("/ui", response_class=HTMLResponse)
def ui_home(request: Request):
    return HTMLResponse(
        """
        <html>
          <head><title>Marktplaats MVP</title></head>
          <body>
            <h2>Create Client</h2>
            <form action="/ui/create-client" method="post">
              <input name="name" placeholder="Name" required />
              <input name="email" placeholder="Email" />
              <input name="whatsapp" placeholder="WhatsApp" />
              <button type="submit">Create</button>
            </form>

            <h2>Create Search Request</h2>
            <form action="/ui/create-search" method="post">
              <input name="client_id" placeholder="Client ID" required />
              <label>Corner Side</label>
              <select name="corner_side">
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
              <input name="text_query" placeholder="Text query e.g. hoekbank" />
              <input name="include_keywords_csv" placeholder="include CSV" />
              <input name="exclude_keywords_csv" placeholder="exclude CSV" />
              <input name="budget" type="number" placeholder="Budget" />
              <input name="max_distance_km" type="number" placeholder="Max distance km" />
              <button type="submit">Create</button>
            </form>

            <p>Visit <a href="/docs">/docs</a> for API.</p>
          </body>
        </html>
        """
    )


@ui_router.post("/ui/create-client")
def ui_create_client(
    name: str = Form(...),
    email: str = Form(None),
    whatsapp: str = Form(None),
    session: Session = next(get_session()),
):
    c = Client(name=name, email=email, whatsapp=whatsapp)
    session.add(c)
    session.commit()
    return RedirectResponse(url="/ui", status_code=303)


@ui_router.post("/ui/create-search")
def ui_create_search(
    client_id: int = Form(...),
    corner_side: str = Form(...),
    text_query: str = Form("hoekbank"),
    include_keywords_csv: str = Form(None),
    exclude_keywords_csv: str = Form(None),
    budget: int = Form(None),
    max_distance_km: int = Form(None),
    session: Session = next(get_session()),
):
    sr = SearchRequest(
        client_id=client_id,
        is_photo_based=True,
        corner_side=CornerSide(corner_side),
        text_query=text_query,
        include_keywords_csv=include_keywords_csv,
        exclude_keywords_csv=exclude_keywords_csv,
        budget=budget,
        max_distance_km=max_distance_km,
    )
    session.add(sr)
    session.commit()
    session.refresh(sr)
    ads = MarktplaatsClient().search(query=text_query)
    upsert_match_results(session, sr, ads)
    return RedirectResponse(url="/docs", status_code=303)

