import pytest
import numpy as np
import pandas as pd
from app.features.technical import compute_technical_indicators

def test_technical_indicators_known_values():
    # 30-day sequence with constant price 100
    dates = pd.date_range("2024-01-01", periods=30)
    flat_df = pd.DataFrame({
        "Date": dates,
        "Open": 100.0,
        "High": 100.0,
        "Low": 100.0,
        "Close": 100.0,
        "Adj Close": 100.0,
        "Volume": 1000
    })
    res = compute_technical_indicators(flat_df)
    
    # Flat price returns must be 0
    assert np.allclose(res["return_1d"].dropna(), 0.0)
    assert np.allclose(res["pct_price_change"].dropna(), 0.0)
    # SMA ratio must be 1.0
    assert np.allclose(res["sma_ratio_10"].dropna(), 1.0)
    assert np.allclose(res["sma_ratio_20"].dropna(), 1.0)

def test_rsi_bounds():
    # Monotonically increasing price series
    dates = pd.date_range("2024-01-01", periods=50)
    up_df = pd.DataFrame({
        "Date": dates,
        "Open": np.linspace(100, 200, 50),
        "High": np.linspace(101, 201, 50),
        "Low": np.linspace(99, 199, 50),
        "Close": np.linspace(100, 200, 50),
        "Adj Close": np.linspace(100, 200, 50),
        "Volume": 1000
    })
    res = compute_technical_indicators(up_df)
    # RSI must be between 0 and 100, and for strong uptrend near 100
    valid_rsi = res["rsi_14"].dropna()
    assert (valid_rsi >= 0).all() and (valid_rsi <= 100).all()
    assert valid_rsi.iloc[-1] > 80.0
