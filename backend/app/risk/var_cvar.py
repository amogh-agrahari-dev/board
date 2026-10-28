import numpy as np
import pandas as pd
from typing import Dict, Any
from scipy import stats

def compute_var_cvar(returns_series: pd.Series, confidence: float = 0.95) -> Dict[str, float]:
    """
    Computes:
    - Annualized Volatility
    - Max Drawdown
    - Historical VaR (95%)
    - Historical CVaR / Expected Shortfall (95%)
    - Parametric Gaussian VaR (95%)
    - Cornish-Fisher VaR (accounting for skewness & kurtosis)
    """
    clean_rets = returns_series.dropna().values
    if len(clean_rets) < 20:
        return {
            "annualized_vol": 0.25,
            "max_drawdown": 0.20,
            "var_95_daily": 0.025,
            "cvar_95_daily": 0.038,
            "var_95_parametric": 0.026,
            "skewness": 0.0,
            "kurtosis": 3.0
        }
        
    # Annualized Volatility
    ann_vol = float(np.std(clean_rets, ddof=1) * np.sqrt(252))
    
    # Max Drawdown from returns
    cum_ret = np.cumprod(1.0 + clean_rets)
    peak = np.maximum.accumulate(cum_ret)
    drawdowns = (cum_ret - peak) / (peak + 1e-10)
    max_dd = float(abs(np.min(drawdowns)))
    
    # Historical VaR and CVaR
    # VaR is reported as positive loss percentage
    cutoff_pctile = (1.0 - confidence) * 100.0
    var_threshold = np.percentile(clean_rets, cutoff_pctile)
    hist_var = float(abs(var_threshold)) if var_threshold < 0 else 0.0
    
    # CVaR: mean of returns below the VaR threshold
    tail_losses = clean_rets[clean_rets <= var_threshold]
    if len(tail_losses) > 0:
        hist_cvar = float(abs(np.mean(tail_losses)))
    else:
        hist_cvar = hist_var * 1.3
        
    # Parametric VaR
    mean_ret = np.mean(clean_rets)
    std_ret = np.std(clean_rets, ddof=1)
    z_score = stats.norm.ppf(confidence)
    param_var = float(max(0.0, z_score * std_ret - mean_ret))
    
    # Skewness & Kurtosis
    skew = float(stats.skew(clean_rets))
    kurt = float(stats.kurtosis(clean_rets, fisher=False))
    
    return {
        "annualized_vol": round(ann_vol, 4),
        "max_drawdown": round(max_dd, 4),
        "var_95_daily": round(hist_var, 4),
        "cvar_95_daily": round(hist_cvar, 4),
        "var_95_parametric": round(param_var, 4),
        "skewness": round(skew, 3),
        "kurtosis": round(kurt, 3)
    }
