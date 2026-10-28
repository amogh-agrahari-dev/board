import pytest
import numpy as np
import pandas as pd
from app.features.technical import compute_technical_indicators

def test_zero_future_leakage_in_features():
    """
    Integrity Rule: Altering prices in future steps (t > 50) MUST NEVER
    change technical indicator features computed at or before t = 50.
    """
    np.random.seed(123)
    n = 100
    dates = pd.date_range("2024-01-01", periods=n)
    prices = 100.0 * np.exp(np.cumsum(np.random.normal(0.0005, 0.015, size=n)))
    
    base_df = pd.DataFrame({
        "Date": dates,
        "Open": prices,
        "High": prices * 1.01,
        "Low": prices * 0.99,
        "Close": prices,
        "Adj Close": prices,
        "Volume": 100000
    })
    
    # Compute features on original dataset
    feat_original = compute_technical_indicators(base_df)
    
    # Create corrupted future dataset: shock all prices after index 50
    corrupted_df = base_df.copy()
    corrupted_df.loc[51:, "Close"] = corrupted_df.loc[51:, "Close"] * 5.0
    corrupted_df.loc[51:, "High"] = corrupted_df.loc[51:, "High"] * 5.0
    corrupted_df.loc[51:, "Low"] = corrupted_df.loc[51:, "Low"] * 5.0
    
    feat_corrupted = compute_technical_indicators(corrupted_df)
    
    # Check all rows from 0 to 50: they MUST BE EXACTLY IDENTICAL
    check_cols = [
        "return_1d", "pct_price_change", "sma_10", "sma_ratio_10",
        "rsi_14", "macd_line", "bollinger_pct_b", "atr_14", "rolling_vol_21d"
    ]
    
    for col in check_cols:
        orig_slice = feat_original.loc[:50, col].dropna().values
        corr_slice = feat_corrupted.loc[:50, col].dropna().values
        assert np.allclose(orig_slice, corr_slice, atol=1e-8), f"Future leakage detected in feature: {col}!"
