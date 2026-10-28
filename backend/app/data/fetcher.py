import logging
import time
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any, Optional
import pandas as pd
import yfinance as yf
from app.data.cache import get_ohlcv, save_ohlcv
from app.data.sample_fallback import get_sample_df, get_sample_info, UNIVERSE_INFO
from app.config import settings

logger = logging.getLogger(__name__)

LAST_REQUEST_TIME = 0.0
MIN_REQUEST_INTERVAL = 0.35  # Throttle yfinance requests

def throttle():
    global LAST_REQUEST_TIME
    elapsed = time.time() - LAST_REQUEST_TIME
    if elapsed < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - elapsed)
    LAST_REQUEST_TIME = time.time()

def fetch_ohlcv(ticker: str, years: int = 5) -> Tuple[pd.DataFrame, str, bool]:
    """
    Returns (DataFrame, as_of_iso, is_sample)
    Tries:
    1. Fresh yfinance data if online & not cached today
    2. SQLite cached data
    3. Sample bundled data with is_sample=True
    """
    market = "IN" if ticker.endswith(".NS") or ticker in ["^INDIAVIX", "^NSEI"] else "US"
    cached = get_ohlcv(ticker)
    
    # Check if cache is fresh (less than 6 hours old during trading week)
    if cached and not settings.fast_mode:
        try:
            cached_time = datetime.fromisoformat(cached["as_of"])
            if (datetime.now() - cached_time).total_seconds() < 21600:
                df = pd.DataFrame(cached["data"])
                df["Date"] = pd.to_datetime(df["Date"])
                return df, cached["as_of"], cached["is_sample"]
        except Exception as e:
            logger.warning(f"Error parsing cache time for {ticker}: {e}")

    # Try live yfinance fetch
    try:
        throttle()
        yf_ticker = yf.Ticker(ticker)
        period = f"{years}y"
        hist = yf_ticker.history(period=period, auto_adjust=False)
        
        if hist is not None and len(hist) > 100:
            hist = hist.reset_index()
            # Standardize date column
            if "Date" in hist.columns:
                hist["Date"] = pd.to_datetime(hist["Date"]).dt.tz_localize(None)
            elif "Datetime" in hist.columns:
                hist["Date"] = pd.to_datetime(hist["Datetime"]).dt.tz_localize(None)
                
            cols_needed = ["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"]
            for col in ["Open", "High", "Low", "Close", "Adj Close", "Volume"]:
                if col not in hist.columns and "Close" in hist.columns:
                    hist[col] = hist["Close"]
            
            clean_df = hist[cols_needed].dropna().sort_values("Date").reset_index(drop=True)
            as_of = datetime.now().isoformat()
            
            # Save to cache
            records = clean_df.to_dict(orient="records")
            # format date strings for json
            for r in records:
                if isinstance(r["Date"], (pd.Timestamp, datetime)):
                    r["Date"] = r["Date"].strftime("%Y-%m-%d")
            save_ohlcv(ticker, market, records, as_of, is_sample=False)
            return clean_df, as_of, False
    except Exception as e:
        logger.warning(f"yfinance fetch failed for {ticker}: {e}. Falling back to cache/sample.")

    # Fallback to cache if available
    if cached:
        df = pd.DataFrame(cached["data"])
        df["Date"] = pd.to_datetime(df["Date"])
        return df, cached["as_of"], cached["is_sample"]

    # Fallback to bundled sample data
    sample_df = get_sample_df(ticker)
    as_of = datetime.now().isoformat()
    return sample_df, as_of, True

FUNDAMENTALS_CACHE: Dict[str, Dict[str, Any]] = {}

def fetch_fundamentals(ticker: str) -> Dict[str, Any]:
    """Fetches key valuation, profitability, and size metrics with in-memory caching."""
    if ticker in FUNDAMENTALS_CACHE:
        return FUNDAMENTALS_CACHE[ticker]
        
    default_info = get_sample_info(ticker)
    if settings.fast_mode:
        FUNDAMENTALS_CACHE[ticker] = default_info
        return default_info
        
    try:
        throttle()
        yf_ticker = yf.Ticker(ticker)
        raw_info = yf_ticker.info or {}
        
        info = {
            "name": raw_info.get("shortName") or raw_info.get("longName") or default_info.get("name", ticker),
            "market": "IN" if ticker.endswith(".NS") else "US",
            "sector": raw_info.get("sector") or default_info.get("sector", "Equities"),
            "pe": raw_info.get("trailingPE") or raw_info.get("forwardPE") or default_info.get("pe"),
            "pb": raw_info.get("priceToBook") or default_info.get("pb"),
            "ps": raw_info.get("priceToSalesTrailing12Months") or default_info.get("ps"),
            "roa": raw_info.get("returnOnAssets") or default_info.get("roa"),
            "roe": raw_info.get("returnOnEquity") or default_info.get("roe"),
            "market_cap": raw_info.get("marketCap") or default_info.get("market_cap"),
            "current_price": raw_info.get("currentPrice") or raw_info.get("regularMarketPrice") or default_info.get("base_price")
        }
        FUNDAMENTALS_CACHE[ticker] = info
        return info
    except Exception as e:
        logger.warning(f"Error fetching fundamentals for {ticker}: {e}")
        FUNDAMENTALS_CACHE[ticker] = default_info
        return default_info

