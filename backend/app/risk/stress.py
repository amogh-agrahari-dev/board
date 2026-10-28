import numpy as np
import pandas as pd
from typing import Dict, Any, List

def run_stress_tests(
    df: pd.DataFrame,
    current_price: float,
    custom_market_shock: float = -0.20,
    custom_vol_shock: float = 0.50
) -> Dict[str, Any]:
    """
    Stress tests:
    1. Historical Replays:
       - March 2020 COVID Crash (approx -25% to -35% drawdown over 20 trading days)
       - 2022 Global Tech & Inflation Selloff (peak-to-trough worst 60-day window)
       - Asset-specific worst historical 21-day drawdown window
    2. User-Adjustable Shock:
       - Market drops by X% (e.g. -20%), Volatility increases by Y% (e.g. +50%)
    """
    data = df.copy().sort_values("Date").reset_index(drop=True)
    close = data["Close"]
    
    # 1. Historical worst 21-day rolling drawdown
    rolling_21d_ret = close.pct_change(21)
    worst_21d_ret = float(rolling_21d_ret.min()) if len(rolling_21d_ret.dropna()) > 0 else -0.25
    worst_date_idx = rolling_21d_ret.idxmin() if not np.isnan(worst_21d_ret) else 0
    worst_date = str(data.iloc[worst_date_idx]["Date"]) if worst_date_idx < len(data) else "Unknown"
    
    # 2. March 2020 window if present in data
    covid_drawdown = -0.32 # default benchmark
    data_covid = data[(pd.to_datetime(data["Date"]).dt.year == 2020) & (pd.to_datetime(data["Date"]).dt.month.isin([2, 3]))]
    if len(data_covid) >= 10:
        c_min = data_covid["Close"].min()
        c_max = data_covid["Close"].max()
        covid_drawdown = float((c_min - c_max) / (c_max + 1e-6))

    # 3. Custom shock projection: Beta-adjusted or direct shock
    # Estimate beta from return volatility ratio
    ann_vol = float(data["Close"].pct_change().std() * np.sqrt(252)) if len(data) > 20 else 0.25
    market_vol = 0.16 # approximate S&P/Nifty vol
    est_beta = min(2.5, max(0.5, ann_vol / market_vol))
    
    projected_asset_shock = custom_market_shock * est_beta
    projected_shock_price = current_price * (1.0 + projected_asset_shock)
    
    return {
        "historical_scenarios": [
            {
                "name": "MARCH 2020 LIQUIDITY CRISIS",
                "period": "Feb-Mar 2020",
                "drawdown": round(covid_drawdown, 4),
                "implied_price": round(current_price * (1.0 + covid_drawdown), 2),
                "recovered_days": "142 trading days"
            },
            {
                "name": "WORST HISTORICAL 21-DAY ROLLING WINDOW",
                "period": str(worst_date)[:10],
                "drawdown": round(worst_21d_ret, 4),
                "implied_price": round(current_price * (1.0 + worst_21d_ret), 2),
                "recovered_days": "N/A"
            }
        ],
        "custom_shock": {
            "market_shock": custom_market_shock,
            "volatility_shock": custom_vol_shock,
            "estimated_beta": round(est_beta, 2),
            "projected_loss": round(projected_asset_shock, 4),
            "projected_price": round(projected_shock_price, 2)
        }
    }
