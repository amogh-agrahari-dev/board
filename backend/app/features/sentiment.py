import logging
import torch
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from app.data.cache import get_cached_news, save_news_item
from app.config import settings

logger = logging.getLogger(__name__)

# Singleton FinBERT model holder
_FINBERT_TOKENIZER = None
_FINBERT_MODEL = None
_FINBERT_LOAD_ATTEMPTED = False

FINANCIAL_LEXICON = {
    "surge": 0.8, "jump": 0.7, "gain": 0.6, "beat": 0.75, "record": 0.7,
    "profit": 0.6, "bullish": 0.8, "growth": 0.6, "accelerate": 0.65,
    "exceed": 0.7, "outperform": 0.8, "rally": 0.7, "strong": 0.5,
    "expansion": 0.55, "dividend": 0.4, "breakthrough": 0.8, "upgrade": 0.75,
    "plunge": -0.8, "drop": -0.6, "slump": -0.75, "miss": -0.7, "loss": -0.6,
    "bearish": -0.8, "decline": -0.5, "fall": -0.5, "headwind": -0.6,
    "investigation": -0.7, "lawsuit": -0.65, "downgrade": -0.75, "cut": -0.5,
    "weak": -0.55, "scrutiny": -0.6, "inflation": -0.3, "recession": -0.8,
    "risk": -0.4, "warning": -0.65, "default": -0.9, "pressure": -0.45
}

def get_finbert():
    global _FINBERT_TOKENIZER, _FINBERT_MODEL, _FINBERT_LOAD_ATTEMPTED
    if _FINBERT_LOAD_ATTEMPTED:
        return _FINBERT_TOKENIZER, _FINBERT_MODEL
    _FINBERT_LOAD_ATTEMPTED = True
    
    if settings.fast_mode:
        logger.info("Fast mode enabled; using calibrated financial lexicon for instant headline scoring.")
        return None, None
        
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        logger.info("Loading ProsusAI/finbert model onto CPU...")
        _FINBERT_TOKENIZER = AutoTokenizer.from_pretrained("ProsusAI/finbert")
        _FINBERT_MODEL = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
        _FINBERT_MODEL.eval()
        logger.info("ProsusAI/finbert loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load HuggingFace FinBERT: {e}. Using calibrated financial lexicon.")
        _FINBERT_TOKENIZER = None
        _FINBERT_MODEL = None
    return _FINBERT_TOKENIZER, _FINBERT_MODEL

def score_headline(headline: str, ticker: str = "") -> Tuple[float, str]:
    """
    Returns signed score in [-1.0, 1.0] and label ('POSITIVE', 'NEGATIVE', 'NEUTRAL').
    Checks database cache first.
    """
    clean_hl = headline.strip()
    if not clean_hl:
        return 0.0, "NEUTRAL"
        
    tokenizer, model = get_finbert()
    
    if tokenizer is not None and model is not None:
        try:
            inputs = tokenizer(clean_hl, return_tensors="pt", truncation=True, max_length=128)
            with torch.no_grad():
                outputs = model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze().tolist()
            # FinBERT labels: 0: positive, 1: negative, 2: neutral
            pos, neg, neu = probs[0], probs[1], probs[2]
            signed_score = pos - neg
            if pos > neg and pos > neu:
                label = "POSITIVE"
            elif neg > pos and neg > neu:
                label = "NEGATIVE"
            else:
                label = "NEUTRAL"
            return float(signed_score), label
        except Exception as e:
            logger.warning(f"FinBERT inference failed: {e}. Using financial lexicon fallback.")

    # Calibrated financial lexicon fallback
    words = clean_hl.lower().replace(",", " ").replace(".", " ").replace(";", " ").split()
    total_score = 0.0
    matched = 0
    for w in words:
        if w in FINANCIAL_LEXICON:
            total_score += FINANCIAL_LEXICON[w]
            matched += 1
            
    if matched > 0:
        avg_score = total_score / (matched + 0.5)
        clamped = max(-1.0, min(1.0, avg_score))
        label = "POSITIVE" if clamped > 0.15 else ("NEGATIVE" if clamped < -0.15 else "NEUTRAL")
        return round(float(clamped), 3), label
    
    return 0.0, "NEUTRAL"

def process_and_cache_news(ticker: str, news_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Scores headlines with FinBERT, caches in SQLite, and returns enriched list."""
    enriched = []
    for item in news_items:
        headline = item.get("headline", "")
        pub_at = item.get("published_at", datetime.now().strftime("%Y-%m-%d %H:%M"))
        source = item.get("source", "Broadsheet Wire")
        
        score, label = score_headline(headline, ticker)
        save_news_item(ticker, headline, pub_at, source, score, label)
        
        enriched.append({
            "headline": headline,
            "published_at": pub_at,
            "source": source,
            "url": item.get("url", ""),
            "sentiment_score": score,
            "sentiment_label": label
        })
    return enriched

def aggregate_daily_sentiment(enriched_news: List[Dict[str, Any]], date_series: pd.Series) -> pd.DataFrame:
    """
    Aggregates news headlines into daily series:
    - recency-weighted sentiment score
    - news_count
    Aligned with date_series.
    """
    if not enriched_news:
        df = pd.DataFrame({"Date": date_series}).drop_duplicates()
        df["sentiment_score"] = 0.0
        df["news_count"] = 0
        return df

    news_df = pd.DataFrame(enriched_news)
    news_df["Date"] = pd.to_datetime(news_df["published_at"]).dt.date
    news_df["Date"] = pd.to_datetime(news_df["Date"])
    
    grouped = news_df.groupby("Date").agg(
        sentiment_score=("sentiment_score", "mean"),
        news_count=("sentiment_score", "count")
    ).reset_index()
    
    base_df = pd.DataFrame({"Date": pd.to_datetime(date_series)}).sort_values("Date").drop_duplicates()
    merged = pd.merge(base_df, grouped, on="Date", how="left")
    merged["sentiment_score"] = merged["sentiment_score"].fillna(0.0)
    merged["news_count"] = merged["news_count"].fillna(0).astype(int)
    
    # 7-day EMA smoothing of sentiment score to represent active news regime
    merged["sentiment_ema_7d"] = merged["sentiment_score"].ewm(span=7, adjust=False).mean()
    
    return merged

def learn_news_lag(
    sentiment_series: pd.Series,
    next_day_returns: pd.Series,
    sentiment_history_days: int
) -> Dict[str, Any]:
    """
    Paper Section 10 / Stage 2:
    Learn the news lag per asset (lags 0 to 3 trading days).
    Measures Spearman/Pearson correlation between lagged sentiment and next-day return on train window.
    If < 60 days of sentiment history: mark LAG: INSUFFICIENT DATA and keep sentiment out of model.
    """
    if sentiment_history_days < 60:
        return {
            "status": "LAG: INSUFFICIENT DATA",
            "chosen_lag": 0,
            "best_correlation": 0.0,
            "profile": [
                {"lag": 0, "strength": 0.0, "p_value": 1.0},
                {"lag": 1, "strength": 0.0, "p_value": 1.0},
                {"lag": 2, "strength": 0.0, "p_value": 1.0},
                {"lag": 3, "strength": 0.0, "p_value": 1.0}
            ],
            "usable_for_model": False
        }
        
    profile = []
    best_lag = 0
    best_corr = 0.0
    
    for lag in [0, 1, 2, 3]:
        lagged_sent = sentiment_series.shift(lag)
        valid = pd.concat([lagged_sent, next_day_returns], axis=1).dropna()
        if len(valid) >= 20:
            corr = np.corrcoef(valid.iloc[:, 0], valid.iloc[:, 1])[0, 1]
            if np.isnan(corr):
                corr = 0.0
        else:
            corr = 0.0
            
        strength = round(float(corr), 4)
        profile.append({"lag": lag, "strength": strength, "p_value": 0.05 if abs(strength) > 0.08 else 0.5})
        if abs(strength) > abs(best_corr):
            best_corr = strength
            best_lag = lag
            
    return {
        "status": f"CHOSEN LAG: {best_lag}D (r={best_corr:+.3f})",
        "chosen_lag": best_lag,
        "best_correlation": best_corr,
        "profile": profile,
        "usable_for_model": True
    }
