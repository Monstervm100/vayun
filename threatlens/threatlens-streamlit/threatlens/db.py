"""SQLite persistence layer (NFR: local-first, file-based storage).

A single file at ``data/threatlens.db`` — no database server, no recurring cost.
"""
import sqlite3
from contextlib import contextmanager

from threatlens.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS samples (
    id            INTEGER PRIMARY KEY,
    source        TEXT,
    collected_at  TEXT,
    sender        TEXT,
    subject       TEXT,
    body          TEXT,
    url           TEXT,
    label         TEXT            -- taxonomy category (TT-FR-03)
);

CREATE TABLE IF NOT EXISTS features (
    sample_id     INTEGER,
    name          TEXT,
    value         REAL,
    FOREIGN KEY (sample_id) REFERENCES samples(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
    id            TEXT PRIMARY KEY,
    first_seen    TEXT,
    sample_count  INTEGER,
    type          TEXT,
    shared_ioc    TEXT
);

CREATE TABLE IF NOT EXISTS predictions (
    sample_id     INTEGER,
    model         TEXT,
    prediction    TEXT,
    confidence    REAL,
    FOREIGN KEY (sample_id) REFERENCES samples(id)
);
"""


@contextmanager
def get_connection():
    """Yield a SQLite connection with row access by column name."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Create tables if they do not exist. Safe to call on every startup."""
    with get_connection() as conn:
        conn.executescript(SCHEMA)
