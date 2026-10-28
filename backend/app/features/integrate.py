import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from app.features.technical import compute_technical_indicators
from app.features.sentiment import aggregate_daily_sentiment, learn_news_lag
from app.data.macro import get_macro_features

FEATURE_GROUPS = {
    "PRICE_TECH": [
        "return_1d", "log_return_1d", "pct_price_change",
        "sma_ratio_10", "sma_ratio_20", "sma_ratio_50", "sma_ratio_200",
        "ema_ratio_10", "ema_ratio_20", "ema_ratio_50", "ema_ratio_200",
        "rsi_14", "macd_line", "macd_signal", "macd_hist",
        "bollinger_pct_b", "bollinger_width", "atr_pct",
        "rolling_vol_10d", "rolling_vol_21d", "rolling_vol_63d",
        "volume_zscore_21d", "momentum_21d", "momentum_63d", "momentum_126d",
        "drawdown_52w"
    ],
    "SENTIMENT": [
        "sentiment_score", "sentiment_ema_7d", "news_count"
    ],
    "MACRO": [
        "macro_us_vix", "macro_us_vix_pctile_63", "macro_us_vix_change_21",
        "macro_india_vix", "macro_india_vix_pctile_63", "macro_india_vix_change_21",
        "macro_us_10y_yield", "macro_us_10y_yield_change_21",
        "macro_usd_inr", "macro_usd_inr_change_21"
    ],
    "SOCIAL": [
        "social_sentiment", "social_volume"
    ]
}

def integrate_all_features(
    ohlcv_df: pd.DataFrame,
    enriched_news: List[Dict[str, Any]] = None,
    social_data: List[Dict[str, Any]] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Integrates technical, sentiment, macro, and optional social features.
    Aligns different frequencies properly with zero lookahead:
    - Macro series forward-filled only from past release dates
    - Days since update added
    - Learns news lag profile
    """
    # 1. Technical features
    tech_df = compute_technical_indicators(ohlcv_df)
    tech_df["Date"] = pd.to_datetime(tech_df["Date"]).dt.tz_localize(None).astype("datetime64[ns]")
    
    # 2. News sentiment features
    if enriched_news:
        sent_df = aggregate_daily_sentiment(enriched_news, tech_df["Date"])
        sent_df["Date"] = pd.to_datetime(sent_df["Date"]).dt.tz_localize(None).astype("datetime64[ns]")
        tech_df = pd.merge(tech_df, sent_df[["Date", "sentiment_score", "sentiment_ema_7d", "news_count"]], on="Date", how="left")
        tech_df["sentiment_score"] = tech_df["sentiment_score"].fillna(0.0)
        tech_df["sentiment_ema_7d"] = tech_df["sentiment_ema_7d"].fillna(0.0)
        tech_df["news_count"] = tech_df["news_count"].fillna(0)
    else:
        tech_df["sentiment_score"] = 0.0
        tech_df["sentiment_ema_7d"] = 0.0
        tech_df["news_count"] = 0

    # 3. Macro features
    macro_df = get_macro_features(tech_df["Date"])
    macro_df["Date"] = pd.to_datetime(macro_df["Date"]).dt.tz_localize(None).astype("datetime64[ns]")
    tech_df = pd.merge(tech_df, macro_df, on="Date", how="left")
    
    # Forward fill macro series (strictly backward-looking direction as merged via merge_asof)
    for col in FEATURE_GROUPS["MACRO"]:
        if col in tech_df.columns:
            tech_df[col] = tech_df[col].ffill().bfill().fillna(0.0)

    # 4. Social (off by default)
    tech_df["social_sentiment"] = 0.0
    tech_df["social_volume"] = 0.0

    # Learn news lag
    next_day_ret = tech_df["log_return_1d"].shift(-1)
    sentiment_history_days = int((tech_df["sentiment_score"] != 0).sum())
    lag_info = learn_news_lag(tech_df["sentiment_score"], next_day_ret, sentiment_history_days)
    
    # Add lag-adjusted sentiment feature
    chosen_lag = lag_info.get("chosen_lag", 0)
    tech_df["sentiment_lag_adjusted"] = tech_df["sentiment_score"].shift(chosen_lag).fillna(0.0)
    
    return tech_df, lag_info
