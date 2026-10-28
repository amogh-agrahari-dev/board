import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes all Stage 1 technical indicators with strict zero-lookahead.
    Only past and present information (<= time t) is used.
    
    Features computed:
    - returns (1-day log return and simple return)
    - percentage price change (paper [2] top single contributor)
    - SMA ratios (Close / SMA 10, 20, 50, 200)
    - EMA ratios (Close / EMA 10, 20, 50, 200)
    - RSI(14) via Wilder's smoothed moving average
    - MACD line, signal line (9-day EMA), MACD histogram
    - Bollinger %B and Bollinger Band Width (20-day, 2 std)
    - ATR(14): Average True Range normalized by Close
    - Rolling volatility annualized (10d, 21d, 63d)
    - Volume z-score (21d rolling mean & std)
    - Momentum (21d, 63d, 126d percentage return)
    - Drawdown from 52-week (252-day) high
    """
    data = df.copy().sort_values("Date").reset_index(drop=True)
    
    close = data["Close"]
    high = data["High"]
    low = data["Low"]
    volume = data["Volume"].astype(float)
    
    # 1. Returns and Percentage Price Change (Paper [2])
    data["return_1d"] = close.pct_change(1)
    data["log_return_1d"] = np.log(close / close.shift(1))
    data["pct_price_change"] = ((close - close.shift(1)) / close.shift(1)) * 100.0
    
    # 2. SMA and EMA Ratios
    for window in [10, 20, 50, 200]:
        sma = close.rolling(window=window, min_periods=window).mean()
        ema = close.ewm(span=window, adjust=False).mean()
        data[f"sma_{window}"] = sma
        data[f"sma_ratio_{window}"] = close / sma
        data[f"ema_{window}"] = ema
        data[f"ema_ratio_{window}"] = close / ema

    # 3. RSI(14)
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
    rs = avg_gain / (avg_loss + 1e-10)
    data["rsi_14"] = 100.0 - (100.0 / (1.0 + rs))
    
    # 4. MACD (12, 26, 9)
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    data["macd_line"] = ema_12 - ema_26
    data["macd_signal"] = data["macd_line"].ewm(span=9, adjust=False).mean()
    data["macd_hist"] = data["macd_line"] - data["macd_signal"]
    
    # 5. Bollinger Bands (20-day, 2 std)
    bb_mid = close.rolling(window=20, min_periods=20).mean()
    bb_std = close.rolling(window=20, min_periods=20).std()
    bb_upper = bb_mid + 2.0 * bb_std
    bb_lower = bb_mid - 2.0 * bb_std
    data["bollinger_mid"] = bb_mid
    data["bollinger_upper"] = bb_upper
    data["bollinger_lower"] = bb_lower
    # %B = (Price - Lower) / (Upper - Lower)
    data["bollinger_pct_b"] = (close - bb_lower) / ((bb_upper - bb_lower) + 1e-10)
    # Band Width = (Upper - Lower) / Mid
    data["bollinger_width"] = (bb_upper - bb_lower) / (bb_mid + 1e-10)
    
    # 6. Average True Range (ATR 14)
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=14, min_periods=14).mean()
    data["atr_14"] = atr
    data["atr_pct"] = atr / (close + 1e-10)
    
    # 7. Rolling Annualized Volatility (10d, 21d, 63d)
    for w in [10, 21, 63]:
        data[f"rolling_vol_{w}d"] = data["log_return_1d"].rolling(window=w, min_periods=w).std() * np.sqrt(252)

    # 8. Volume Z-Score (21-day)
    vol_mean = volume.rolling(window=21, min_periods=10).mean()
    vol_std = volume.rolling(window=21, min_periods=10).std()
    data["volume_zscore_21d"] = (volume - vol_mean) / (vol_std + 1e-6)
    
    # 9. Momentum (21d, 63d, 126d)
    for m in [21, 63, 126]:
        data[f"momentum_{m}d"] = (close - close.shift(m)) / (close.shift(m) + 1e-10)
        
    # 10. Drawdown from 52-week (252-day) High
    roll_max_252 = close.rolling(window=252, min_periods=20).max()
    data["high_52w"] = roll_max_252
    data["drawdown_52w"] = (close - roll_max_252) / (roll_max_252 + 1e-10)
    
    return data
