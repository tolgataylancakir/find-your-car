from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data.db import init_db
from .services import watcher_singleton
from .routers import router
from .ui import ui_router


app = FastAPI(title="Marktplaats Matcher API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.include_router(ui_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    watcher_singleton.start()


@app.get("/")
def read_root() -> dict:
    return {"message": "API up"}


@app.get("/health")
def read_health() -> dict:
    return {"status": "ok"}

