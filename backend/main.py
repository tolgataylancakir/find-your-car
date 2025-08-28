from fastapi import FastAPI

from .data.db import init_db


app = FastAPI(title="Marktplaats Matcher API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def read_root() -> dict:
    return {"message": "API up"}


@app.get("/health")
def read_health() -> dict:
    return {"status": "ok"}

