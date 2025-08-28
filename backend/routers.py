from __future__ import annotations

import os
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlmodel import Session, select

from .data.db import get_engine
from .data.models import Client, CornerSide, MatchResult, ResultStatus, SearchRequest
from .services.matching import upsert_match_results
from .adapters.marktplaats import MarktplaatsClient


router = APIRouter()


def get_session():
    engine = get_engine()
    with Session(engine) as session:
        yield session


@router.post("/clients", response_model=Client)
def create_client(
    name: str = Form(...),
    email: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    c = Client(name=name, email=email, whatsapp=whatsapp)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.post("/search-requests", response_model=SearchRequest)
def create_search_request(
    client_id: int = Form(...),
    is_photo_based: bool = Form(True),
    corner_side: CornerSide = Form(...),
    color: Optional[str] = Form(None),
    fabric: Optional[str] = Form(None),
    shape: Optional[str] = Form(None),
    dimensions: Optional[str] = Form(None),
    budget: Optional[int] = Form(None),
    max_distance_km: Optional[int] = Form(None),
    include_keywords_csv: Optional[str] = Form(None),
    exclude_keywords_csv: Optional[str] = Form(None),
    text_query: Optional[str] = Form(None),
    min_price: Optional[int] = Form(None),
    max_price: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    upload_path = None
    if photo is not None:
        os.makedirs("uploads", exist_ok=True)
        upload_path = os.path.join("uploads", photo.filename)
        with open(upload_path, "wb") as f:
            f.write(photo.file.read())
    sr = SearchRequest(
        client_id=client_id,
        is_photo_based=is_photo_based,
        corner_side=corner_side,
        color=color,
        fabric=fabric,
        shape=shape,
        dimensions=dimensions,
        budget=budget,
        max_distance_km=max_distance_km,
        include_keywords_csv=include_keywords_csv,
        exclude_keywords_csv=exclude_keywords_csv,
        text_query=text_query,
        min_price=min_price,
        max_price=max_price,
        photo_path=upload_path,
    )
    session.add(sr)
    session.commit()
    session.refresh(sr)

    # initial catch-up search
    ads = MarktplaatsClient().search(query=text_query or "hoekbank")
    upsert_match_results(session, sr, ads)
    return sr


@router.get("/search-requests/{search_id}/results", response_model=List[MatchResult])
def list_results(
    search_id: int,
    min_match_percent: Optional[float] = None,
    max_price: Optional[int] = None,
    max_distance_km: Optional[int] = None,
    corner_side: Optional[CornerSide] = None,
    color: Optional[str] = None,
    status: Optional[ResultStatus] = None,
    session: Session = Depends(get_session),
):
    query = select(MatchResult).where(MatchResult.search_request_id == search_id)
    rows = session.exec(query).all()
    filtered = []
    for r in rows:
        if min_match_percent is not None and r.match_percent < min_match_percent:
            continue
        if max_price is not None and (r.price is None or r.price > max_price):
            continue
        if max_distance_km is not None and (
            r.distance_km is None or r.distance_km > max_distance_km
        ):
            continue
        if corner_side is not None and (r.corner_side != corner_side.value):
            continue
        if status is not None and r.status != status:
            continue
        filtered.append(r)
    return filtered


@router.post("/results/{result_id}/status", response_model=MatchResult)
def update_result_status(
    result_id: int,
    status: ResultStatus = Form(...),
    notes: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    r = session.get(MatchResult, result_id)
    if not r:
        raise RuntimeError("Result not found")
    r.status = status
    if notes is not None:
        r.notes = notes
    session.add(r)
    session.commit()
    session.refresh(r)
    return r


@router.post("/results/{result_id}/forward", response_model=MatchResult)
def forward_result(
    result_id: int,
    session: Session = Depends(get_session),
):
    r = session.get(MatchResult, result_id)
    if not r:
        raise RuntimeError("Result not found")
    r.forwarded = True
    session.add(r)
    session.commit()
    session.refresh(r)
    return r

