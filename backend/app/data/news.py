import logging
import feedparser
import urllib.parse
from datetime import datetime, timedelta
from typing import List, Dict, Any
import httpx
from app.config import settings
from app.data.cache import get_cached_news, save_news_item
from app.data.sample_fallback import SAMPLE_HEADLINES, get_sample_info

logger = logging.getLogger(__name__)

def fetch_company_news(ticker: str, limit: int = 25) -> List[Dict[str, Any]]:
    """
    Fetches news headlines from:
    1. Finnhub (if FINNHUB_API_KEY present)
    2. Google News RSS via feedparser
    3. Bundled realistic sample headlines
    """
    clean_ticker = ticker.replace(".NS", "")
    info = get_sample_info(ticker)
    company_name = info.get("name", clean_ticker)
    
    # 1. Check Finnhub if key provided (institutional real-time news)
    if settings.finnhub_api_key:
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            from_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
            url = f"https://finnhub.io/api/v1/company-news?symbol={clean_ticker}&from={from_date}&to={today}&token={settings.finnhub_api_key}"
            resp = httpx.get(url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    results = []
                    for item in data[:limit]:
                        pub_time = datetime.fromtimestamp(item.get("datetime", int(datetime.now().timestamp())))
                        results.append({
                            "headline": item.get("headline", ""),
                            "published_at": pub_time.strftime("%Y-%m-%d %H:%M"),
                            "source": item.get("source", "Finnhub"),
                            "url": item.get("url", "")
                        })
                    if results:
                        return results
        except Exception as e:
            logger.warning(f"Finnhub fetch error for {ticker}: {e}")

    # 2. Check NewsAPI if key provided
    if settings.newsapi_key:
        try:
            url = f"https://newsapi.org/v2/everything?q={urllib.parse.quote(company_name)}&sortBy=publishedAt&pageSize={limit}&apiKey={settings.newsapi_key}"
            resp = httpx.get(url, timeout=5.0)
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                if articles:
                    results = []
                    for item in articles[:limit]:
                        pub_str = item.get("publishedAt", "")[:16].replace("T", " ")
                        results.append({
                            "headline": item.get("title", ""),
                            "published_at": pub_str or datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "source": item.get("source", {}).get("name", "NewsAPI"),
                            "url": item.get("url", "")
                        })
                    if results:
                        return results
        except Exception as e:
            logger.warning(f"NewsAPI fetch error for {ticker}: {e}")

    # 3. If fast mode and no keys succeeded, return calibrated sample headlines
    if settings.fast_mode:
        fallback_items = SAMPLE_HEADLINES.get(ticker, SAMPLE_HEADLINES.get(clean_ticker, []))
        if not fallback_items:
            fallback_items = [
                (f"{company_name} updates financial performance metrics and quarterly guidance", 0.35, "POSITIVE"),
                (f"Market analysts review competitive landscape and sector momentum for {company_name}", 0.10, "NEUTRAL"),
                (f"Macro headwinds and currency fluctuations factored into {company_name} risk model", -0.22, "NEGATIVE"),
                (f"Operational execution remains steady as {company_name} plans expansion", 0.45, "POSITIVE")
            ]
        results = []
        base_time = datetime.now()
        for idx, item in enumerate(fallback_items):
            headline = item[0]
            pub_time = base_time - timedelta(days=idx * 2, hours=idx * 3)
            results.append({
                "headline": headline,
                "published_at": pub_time.strftime("%Y-%m-%d %H:%M"),
                "source": "Sample Broadsheet Wire",
                "url": "#"
            })
        return results

    # 2. Google News RSS via feedparser (keyless)
    try:
        query = urllib.parse.quote(f"{company_name} stock")
        rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(rss_url)
        if feed and feed.entries:
            results = []
            for entry in feed.entries[:limit]:
                pub_time = datetime.now()
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_time = datetime(*entry.published_parsed[:6])
                results.append({
                    "headline": entry.title,
                    "published_at": pub_time.strftime("%Y-%m-%d %H:%M"),
                    "source": entry.get("source", {}).get("title", "Google News RSS"),
                    "url": entry.get("link", "")
                })
            if len(results) > 0:
                return results
    except Exception as e:
        logger.warning(f"Google News RSS fetch error for {ticker}: {e}")

    # 3. Fallback to bundled sample headlines
    fallback_items = SAMPLE_HEADLINES.get(ticker, SAMPLE_HEADLINES.get(clean_ticker, []))
    if not fallback_items:
        fallback_items = [
            (f"{company_name} updates financial performance metrics and quarterly guidance", 0.35, "POSITIVE"),
            (f"Market analysts review competitive landscape and sector momentum for {company_name}", 0.10, "NEUTRAL"),
            (f"Macro headwinds and currency fluctuations factored into {company_name} risk model", -0.22, "NEGATIVE"),
            (f"Operational execution remains steady as {company_name} plans expansion", 0.45, "POSITIVE")
        ]
        
    results = []
    base_time = datetime.now()
    for idx, item in enumerate(fallback_items):
        headline = item[0]
        pub_time = base_time - timedelta(days=idx * 2, hours=idx * 3)
        results.append({
            "headline": headline,
            "published_at": pub_time.strftime("%Y-%m-%d %H:%M"),
            "source": "Sample Broadsheet Wire",
            "url": "#"
        })
    return results
