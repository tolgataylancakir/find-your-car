from typing import Optional

from sqlmodel import SQLModel, create_engine


_engine: Optional[object] = None


def get_engine():
    global _engine
    if _engine is None:
        # For MVP scaffolding, use a local SQLite DB file
        _engine = create_engine("sqlite:///./app.db", echo=False)
    return _engine


def init_db() -> None:
    engine = get_engine()
    SQLModel.metadata.create_all(engine)

