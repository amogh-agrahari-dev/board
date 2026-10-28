import logging
import pandas as pd
from typing import Dict, Any, Tuple
from datetime import datetime
from app.data.fetcher import fetch_ohlcv

logger = logging.getLogger(__name__)

MACRO_SYMBOLS = {
    "us_vix": "^VIX",
    "india_vix": "^INDIAVIX",
    "us_10y_yield": "^TNX",
    "usd_inr": "USDINR=X",
    "nifty_index": "^NSEI",
    "sp500_index": "^GSPC"
}

def fetch_macro_series(years: int = 5) -> Dict[str, pd.DataFrame]:
    macro_data = {}
    for name, sym in MACRO_SYMBOLS.items():
        try:
            df, as_of, is_sample = fetch_ohlcv(sym, years=years)
            macro_data[name] = df[["Date", "Close"]].rename(columns={"Close": f"macro_{name}"})
        except Exception as e:
            logger.warning(f"Failed to fetch macro proxy {name} ({sym}): {e}")
    return macro_data

def get_macro_features(base_dates: pd.Series) -> pd.DataFrame:
    """
    Returns DataFrame indexed by Date with zero-lookahead aligned macro indicators:
    - VIX level and rolling percentile
    - 10Y yield changes
    - USD/INR changes
    - Days since last macro update
    """
    macro_dict = fetch_macro_series(years=5)
    merged = pd.DataFrame({"Date": pd.to_datetime(base_dates).dt.tz_localize(None).astype("datetime64[ns]")}).sort_values("Date").drop_duplicates()
    
    for name, df in macro_dict.items():
        if df is not None and len(df) > 0:
            df = df.copy()
            df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None).astype("datetime64[ns]")
            df = df.sort_values("Date")
            # Strict forward-fill: only use values released on or before current date
            merged = pd.merge_asof(merged, df, on="Date", direction="backward")
            
    # Add days since update for macro
    for name in macro_dict.keys():
        col = f"macro_{name}"
        if col in merged.columns:
            # Calculate rolling 63-day percentile
            merged[f"{col}_pctile_63"] = merged[col].rolling(63, min_periods=10).apply(
                lambda x: (x.iloc[-1] - x.min()) / (x.max() - x.min() + 1e-6) if len(x) > 0 else 0.5
            )
            merged[f"{col}_change_21"] = merged[col].pct_change(21).fillna(0)
            
    return merged
