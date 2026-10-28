import sqlite3
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

def get_connection():
    conn = sqlite3.connect(str(settings.db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ohlcv_cache (
                ticker TEXT PRIMARY KEY,
                market TEXT,
                data_json TEXT,
                as_of TEXT,
                is_sample INTEGER DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS news_cache (
                ticker TEXT,
                headline TEXT,
                published_at TEXT,
                source TEXT,
                sentiment_score REAL,
                sentiment_label TEXT,
                PRIMARY KEY (ticker, headline, published_at)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS model_cache (
                cache_key TEXT PRIMARY KEY,
                ticker TEXT,
                model_type TEXT,
                horizon INTEGER,
                metrics_json TEXT,
                created_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS validation_cache (
                ticker TEXT,
                market TEXT,
                results_json TEXT,
                updated_at TEXT,
                PRIMARY KEY (ticker, market)
            )
        """)
    conn.close()

def save_ohlcv(ticker: str, market: str, data: list, as_of: str, is_sample: bool = False):
    conn = get_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO ohlcv_cache (ticker, market, data_json, as_of, is_sample)
            VALUES (?, ?, ?, ?, ?)
        """, (ticker, market, json.dumps(data), as_of, 1 if is_sample else 0))
    conn.close()

def get_ohlcv(ticker: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT ticker, market, data_json, as_of, is_sample FROM ohlcv_cache WHERE ticker = ?", (ticker,))
    row = cur.fetchone()
    conn.close()
    if row:
        return {
            "ticker": row["ticker"],
            "market": row["market"],
            "data": json.loads(row["data_json"]),
            "as_of": row["as_of"],
            "is_sample": bool(row["is_sample"])
        }
    return None

def save_news_item(ticker: str, headline: str, published_at: str, source: str, score: float, label: str):
    conn = get_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO news_cache (ticker, headline, published_at, source, sentiment_score, sentiment_label)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (ticker, headline, published_at, source, score, label))
    conn.close()

def get_cached_news(ticker: str, limit: int = 50) -> list:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT headline, published_at, source, sentiment_score, sentiment_label
        FROM news_cache
        WHERE ticker = ?
        ORDER BY published_at DESC
        LIMIT ?
    """, (ticker, limit))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

init_db()
