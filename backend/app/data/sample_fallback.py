import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from app.config import settings

UNIVERSE_INFO = {
    # INDIA (NSE)
    "RELIANCE.NS": {
        "name": "Reliance Industries Ltd",
        "market": "IN",
        "sector": "Energy",
        "pe": 26.4,
        "pb": 2.1,
        "ps": 1.4,
        "roa": 0.052,
        "roe": 0.098,
        "market_cap": 20400000000000,
        "base_price": 2850.0,
        "annual_vol": 0.22,
        "drift": 0.12
    },
    "TCS.NS": {
        "name": "Tata Consultancy Services Ltd",
        "market": "IN",
        "sector": "Technology",
        "pe": 31.2,
        "pb": 13.8,
        "ps": 5.4,
        "roa": 0.32,
        "roe": 0.48,
        "market_cap": 14200000000000,
        "base_price": 3950.0,
        "annual_vol": 0.19,
        "drift": 0.14
    },
    "INFY.NS": {
        "name": "Infosys Ltd",
        "market": "IN",
        "sector": "Technology",
        "pe": 27.8,
        "pb": 8.1,
        "ps": 4.6,
        "roa": 0.21,
        "roe": 0.31,
        "market_cap": 7800000000000,
        "base_price": 1820.0,
        "annual_vol": 0.23,
        "drift": 0.13
    },
    "HDFCBANK.NS": {
        "name": "HDFC Bank Ltd",
        "market": "IN",
        "sector": "Financial Services",
        "pe": 19.5,
        "pb": 2.8,
        "ps": 3.8,
        "roa": 0.019,
        "roe": 0.165,
        "market_cap": 13100000000000,
        "base_price": 1680.0,
        "annual_vol": 0.18,
        "drift": 0.11
    },
    "ICICIBANK.NS": {
        "name": "ICICI Bank Ltd",
        "market": "IN",
        "sector": "Financial Services",
        "pe": 18.2,
        "pb": 3.1,
        "ps": 4.1,
        "roa": 0.023,
        "roe": 0.182,
        "market_cap": 8900000000000,
        "base_price": 1260.0,
        "annual_vol": 0.21,
        "drift": 0.16
    },
    "BHARTIARTL.NS": {
        "name": "Bharti Airtel Ltd",
        "market": "IN",
        "sector": "Communication Services",
        "pe": 54.0,
        "pb": 8.6,
        "ps": 5.2,
        "roa": 0.045,
        "roe": 0.174,
        "market_cap": 9600000000000,
        "base_price": 1650.0,
        "annual_vol": 0.20,
        "drift": 0.22
    },
    "ITC.NS": {
        "name": "ITC Ltd",
        "market": "IN",
        "sector": "Consumer Defensive",
        "pe": 28.5,
        "pb": 7.4,
        "ps": 8.2,
        "roa": 0.25,
        "roe": 0.29,
        "market_cap": 6100000000000,
        "base_price": 485.0,
        "annual_vol": 0.16,
        "drift": 0.10
    },
    "LT.NS": {
        "name": "Larsen & Toubro Ltd",
        "market": "IN",
        "sector": "Industrials",
        "pe": 36.8,
        "pb": 5.2,
        "ps": 2.2,
        "roa": 0.048,
        "roe": 0.148,
        "market_cap": 5050000000000,
        "base_price": 3650.0,
        "annual_vol": 0.24,
        "drift": 0.15
    },
    "NIFTYBEES.NS": {
        "name": "Nippon India ETF Nifty 50 BeES",
        "market": "IN",
        "sector": "ETF / Broad Market",
        "pe": 22.5,
        "pb": 3.4,
        "ps": 2.8,
        "roa": 0.08,
        "roe": 0.15,
        "market_cap": 250000000000,
        "base_price": 272.0,
        "annual_vol": 0.14,
        "drift": 0.12
    },
    "TATAMOTORS.NS": {
        "name": "Tata Motors Ltd",
        "market": "IN",
        "sector": "Consumer Cyclical",
        "pe": 11.4,
        "pb": 3.2,
        "ps": 0.8,
        "roa": 0.085,
        "roe": 0.32,
        "market_cap": 3600000000000,
        "base_price": 890.0,
        "annual_vol": 0.34,
        "drift": 0.18
    },
    "SBIN.NS": {
        "name": "State Bank of India",
        "market": "IN",
        "sector": "Financial Services",
        "pe": 10.5,
        "pb": 1.4,
        "ps": 1.9,
        "roa": 0.011,
        "roe": 0.18,
        "market_cap": 7500000000000,
        "base_price": 820.0,
        "annual_vol": 0.24,
        "drift": 0.16
    },

    # US (S&P 100 Subset)
    "AAPL": {
        "name": "Apple Inc",
        "market": "US",
        "sector": "Technology",
        "pe": 34.2,
        "pb": 48.5,
        "ps": 8.9,
        "roa": 0.28,
        "roe": 1.45,
        "market_cap": 3500000000000,
        "base_price": 230.0,
        "annual_vol": 0.22,
        "drift": 0.16
    },
    "MSFT": {
        "name": "Microsoft Corp",
        "market": "US",
        "sector": "Technology",
        "pe": 35.8,
        "pb": 12.1,
        "ps": 12.4,
        "roa": 0.19,
        "roe": 0.38,
        "market_cap": 3200000000000,
        "base_price": 425.0,
        "annual_vol": 0.23,
        "drift": 0.17
    },
    "NVDA": {
        "name": "NVIDIA Corp",
        "market": "US",
        "sector": "Technology",
        "pe": 58.5,
        "pb": 52.0,
        "ps": 29.8,
        "roa": 0.45,
        "roe": 1.15,
        "market_cap": 3400000000000,
        "base_price": 140.0,
        "annual_vol": 0.46,
        "drift": 0.42
    },
    "AMZN": {
        "name": "Amazon.com Inc",
        "market": "US",
        "sector": "Consumer Discretionary",
        "pe": 43.1,
        "pb": 8.4,
        "ps": 3.4,
        "roa": 0.082,
        "roe": 0.21,
        "market_cap": 1950000000000,
        "base_price": 188.0,
        "annual_vol": 0.28,
        "drift": 0.20
    },
    "GOOGL": {
        "name": "Alphabet Inc",
        "market": "US",
        "sector": "Communication Services",
        "pe": 23.9,
        "pb": 6.8,
        "ps": 6.7,
        "roa": 0.20,
        "roe": 0.31,
        "market_cap": 2100000000000,
        "base_price": 168.0,
        "annual_vol": 0.25,
        "drift": 0.15
    },
    "TSLA": {
        "name": "Tesla Inc",
        "market": "US",
        "sector": "Consumer Cyclical",
        "pe": 68.2,
        "pb": 11.5,
        "ps": 8.1,
        "roa": 0.088,
        "roe": 0.19,
        "market_cap": 780000000000,
        "base_price": 255.0,
        "annual_vol": 0.52,
        "drift": 0.18
    },
    "JPM": {
        "name": "JPMorgan Chase & Co",
        "market": "US",
        "sector": "Financial Services",
        "pe": 12.3,
        "pb": 1.8,
        "ps": 3.7,
        "roa": 0.014,
        "roe": 0.17,
        "market_cap": 640000000000,
        "base_price": 222.0,
        "annual_vol": 0.20,
        "drift": 0.14
    },
    "SPY": {
        "name": "SPDR S&P 500 ETF Trust",
        "market": "US",
        "sector": "ETF / Broad Market",
        "pe": 26.2,
        "pb": 4.8,
        "ps": 2.9,
        "roa": 0.11,
        "roe": 0.19,
        "market_cap": 580000000000,
        "base_price": 580.0,
        "annual_vol": 0.15,
        "drift": 0.12
    },
    "BRK-B": {
        "name": "Berkshire Hathaway Inc",
        "market": "US",
        "sector": "Financial Services",
        "pe": 21.0,
        "pb": 1.6,
        "ps": 2.5,
        "roa": 0.09,
        "roe": 0.14,
        "market_cap": 990000000000,
        "base_price": 455.0,
        "annual_vol": 0.16,
        "drift": 0.11
    },
    "XOM": {
        "name": "Exxon Mobil Corp",
        "market": "US",
        "sector": "Energy",
        "pe": 14.8,
        "pb": 2.1,
        "ps": 1.4,
        "roa": 0.095,
        "roe": 0.17,
        "market_cap": 510000000000,
        "base_price": 118.0,
        "annual_vol": 0.24,
        "drift": 0.10
    }
}

SAMPLE_HEADLINES = {
    "AAPL": [
        ("Apple expands AI chip integration across next-gen Mac and iPad lineup", 0.72, "POSITIVE"),
        ("Regulatory scrutiny increases on App Store fee structure in EU and US", -0.48, "NEGATIVE"),
        ("Services revenue beats analyst estimates on strong iCloud and AppleCare growth", 0.65, "POSITIVE"),
        ("Foxconn reports record quarterly shipments for flagship iPhone series", 0.54, "POSITIVE"),
        ("Supply chain analysts caution on near-term smartphone replacement cycles", -0.25, "NEGATIVE"),
    ],
    "MSFT": [
        ("Azure AI cloud revenue accelerates 29% year-over-year in enterprise shift", 0.81, "POSITIVE"),
        ("Microsoft signs multi-billion dollar clean energy power purchase agreement", 0.42, "POSITIVE"),
        ("Cybersecurity outage post-mortem prompts enhanced kernel architecture reviews", -0.38, "NEGATIVE"),
        ("Copilot business seat adoption grows across Fortune 500 organizations", 0.68, "POSITIVE"),
    ],
    "NVDA": [
        ("Next-generation Blackwell AI architecture enters full scale production ramp", 0.88, "POSITIVE"),
        ("Export restriction adjustments pose potential headwind for non-US datacenter sales", -0.55, "NEGATIVE"),
        ("Major cloud hyperscalers confirm increased capex commitments for GPU infrastructure", 0.79, "POSITIVE"),
        ("Semiconductor index experiences heightened short-term options volatility", -0.22, "NEGATIVE"),
    ],
    "RELIANCE.NS": [
        ("Jio introduces 5G network slicing for enterprise private networks nationwide", 0.68, "POSITIVE"),
        ("Reliance Retail expands omnichannel logistics with new automated fulfillment hubs", 0.55, "POSITIVE"),
        ("Global refining margins soften following OPEC+ production quota discussions", -0.40, "NEGATIVE"),
        ("Green Energy Giga Complex milestone achieved ahead of projected schedule", 0.74, "POSITIVE"),
    ],
    "TCS.NS": [
        ("TCS secures multi-year digital transformation deal with European tier-1 bank", 0.76, "POSITIVE"),
        ("BFSI technology discretionary spending shows stabilization across North America", 0.48, "POSITIVE"),
        ("IT sector attrition stabilizes at 12.5% supporting operating margin improvement", 0.39, "POSITIVE"),
        ("Wage hike implementation creates modest margin pressure in current quarter", -0.28, "NEGATIVE"),
    ],
    "HDFCBANK.NS": [
        ("HDFC Bank net interest margin holds steady following merger portfolio consolidation", 0.45, "POSITIVE"),
        ("Deposit growth accelerates 16% YoY outpacing broader systemic bank credit", 0.62, "POSITIVE"),
        ("RBI monetary policy maintains cautious liquidity stance impacting funding costs", -0.31, "NEGATIVE"),
        ("Retail loan disbursements reach festive-season record with low delinquency", 0.58, "POSITIVE"),
    ]
}

def generate_synthetic_history(ticker: str, days: int = 1400) -> pd.DataFrame:
    """Generates realistic 5+ year daily OHLCV series calibrated to realistic parameters."""
    info = UNIVERSE_INFO.get(ticker, {
        "base_price": 100.0,
        "annual_vol": 0.25,
        "drift": 0.10
    })
    
    np.random.seed(abs(hash(ticker)) % 100000)
    end_date = datetime.now().date()
    # Generate business day sequence
    dates = pd.bdate_range(end=end_date, periods=days)
    
    dt = 1.0 / 252.0
    mu = info.get("drift", 0.12)
    sigma = info.get("annual_vol", 0.25)
    
    # Geometric Brownian Motion with realistic jump/shock (e.g. Mar 2020 COVID shock)
    shocks = np.random.normal((mu - 0.5 * sigma**2) * dt, sigma * np.sqrt(dt), size=days)
    
    # Inject historical macro stress: COVID crash around index ~300-350 if date fits
    for idx, d in enumerate(dates):
        if d.year == 2020 and d.month == 3:
            shocks[idx] -= 0.025 # negative stress drift in Mar 2020
            
    log_returns = shocks
    cum_ret = np.cumsum(log_returns)
    
    # Calculate price series ending near base_price
    price_path = info.get("base_price", 100.0) * np.exp(cum_ret - cum_ret[-1])
    
    records = []
    for d, close in zip(dates, price_path):
        daily_range = close * np.random.uniform(0.012, 0.035)
        high = close + daily_range * np.random.uniform(0.3, 0.8)
        low = max(0.5, close - daily_range * np.random.uniform(0.3, 0.8))
        open_p = low + (high - low) * np.random.uniform(0.2, 0.8)
        volume = int(np.random.lognormal(mean=14.0, sigma=0.5))
        
        records.append({
            "Date": d.strftime("%Y-%m-%d"),
            "Open": round(float(open_p), 2),
            "High": round(float(high), 2),
            "Low": round(float(low), 2),
            "Close": round(float(close), 2),
            "Adj Close": round(float(close), 2),
            "Volume": volume
        })
        
    df = pd.DataFrame(records)
    return df

def ensure_sample_csvs_exist():
    """Generates and writes CSVs into /data/sample if not already present."""
    sample_dir = settings.sample_dir
    sample_dir.mkdir(parents=True, exist_ok=True)
    
    for ticker in UNIVERSE_INFO.keys():
        csv_path = sample_dir / f"{ticker.replace('^', '').replace('=', '_')}.csv"
        if not csv_path.exists():
            df = generate_synthetic_history(ticker, days=1400)
            df.to_csv(csv_path, index=False)
            
    # Macro proxies
    macro_proxies = {
        "^VIX": {"base_price": 16.5, "annual_vol": 0.55, "drift": 0.0},
        "^INDIAVIX": {"base_price": 14.2, "annual_vol": 0.50, "drift": 0.0},
        "^TNX": {"base_price": 4.25, "annual_vol": 0.25, "drift": 0.05},
        "USDINR_X": {"base_price": 84.1, "annual_vol": 0.06, "drift": 0.03},
        "^NSEI": {"base_price": 24400.0, "annual_vol": 0.15, "drift": 0.12},
        "^GSPC": {"base_price": 5850.0, "annual_vol": 0.16, "drift": 0.11}
    }
    for m_sym, m_cfg in macro_proxies.items():
        csv_path = sample_dir / f"{m_sym.replace('^', '').replace('=', '_')}.csv"
        if not csv_path.exists():
            df = generate_synthetic_history(m_sym, days=1400)
            df.to_csv(csv_path, index=False)

def get_sample_df(ticker: str) -> pd.DataFrame:
    """Reads sample CSV for ticker."""
    ensure_sample_csvs_exist()
    clean_sym = ticker.replace('^', '').replace('=', '_')
    csv_path = settings.sample_dir / f"{clean_sym}.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        df["Date"] = pd.to_datetime(df["Date"])
        return df.sort_values("Date").reset_index(drop=True)
    # Generate on the fly
    df = generate_synthetic_history(ticker, days=1400)
    df["Date"] = pd.to_datetime(df["Date"])
    return df.sort_values("Date").reset_index(drop=True)

def get_sample_info(ticker: str) -> dict:
    if ticker in UNIVERSE_INFO:
        return UNIVERSE_INFO[ticker]
    return {
        "name": ticker,
        "market": "IN" if ticker.endswith(".NS") else "US",
        "sector": "Custom Equities",
        "pe": 22.0,
        "pb": 3.0,
        "ps": 2.5,
        "roa": 0.08,
        "roe": 0.15,
        "market_cap": 50000000000,
        "base_price": 100.0
    }
