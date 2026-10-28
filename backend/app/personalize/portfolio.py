import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from app.data.fetcher import fetch_ohlcv, fetch_fundamentals

def compute_portfolio_metrics(holdings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Given a list of holdings: [{"ticker": "AAPL", "weight": 0.5}, ...],
    Computes:
    - current portfolio volatility (annualized)
    - concentration: Herfindahl-Hirschman Index (HHI, 0 to 10000)
    - sector weights breakdown
    - correlation matrix across holdings
    - portfolio historical VaR(95%)
    """
    if not holdings:
        return {
            "annualized_vol": 0.0,
            "hhi": 0.0,
            "is_concentrated": False,
            "sector_weights": {},
            "correlation_matrix": {"tickers": [], "matrix": []},
            "portfolio_var_95": 0.0,
            "holdings_count": 0
        }
        
    # Normalize weights
    total_w = sum(h.get("weight", 0) for h in holdings)
    if total_w <= 0:
        total_w = 1.0
    norm_holdings = []
    for h in holdings:
        norm_holdings.append({
            "ticker": h["ticker"],
            "weight": h.get("weight", 0) / total_w
        })
        
    tickers = [h["ticker"] for h in norm_holdings]
    weights = np.array([h["weight"] for h in norm_holdings])
    
    # 1. HHI Concentration Index: sum of (weight * 100)^2
    hhi = float(sum((w * 100.0)**2 for w in weights))
    is_concentrated = hhi > 2500 # standard antitrust / financial concentration threshold
    
    # 2. Sector weights
    sector_weights = {}
    price_series_dict = {}
    
    for h in norm_holdings:
        t = h["ticker"]
        w = h["weight"]
        fund = fetch_fundamentals(t)
        sec = fund.get("sector", "Other")
        sector_weights[sec] = sector_weights.get(sec, 0.0) + w
        
        # Fetch price history for covariance/correlation
        df, _, _ = fetch_ohlcv(t, years=2)
        if len(df) > 50:
            df["ret"] = df["Close"].pct_change()
            price_series_dict[t] = df.set_index("Date")["ret"]
            
    # Round sector weights
    sector_weights = {k: round(float(v), 3) for k, v in sector_weights.items()}
    
    # 3. Correlation matrix & portfolio volatility
    if len(price_series_dict) >= 2:
        ret_df = pd.DataFrame(price_series_dict).dropna()
        if len(ret_df) > 20:
            corr_mat = ret_df.corr().values
            cov_mat = ret_df.cov().values * 252.0
            
            # Align weights with columns
            aligned_weights = np.array([norm_holdings[i]["weight"] for i, t in enumerate(ret_df.columns)])
            aligned_weights = aligned_weights / aligned_weights.sum()
            
            port_var = float(aligned_weights.T @ cov_mat @ aligned_weights)
            port_vol = float(np.sqrt(max(0.0001, port_var)))
            
            # Daily portfolio returns series
            port_daily_ret = (ret_df * aligned_weights).sum(axis=1)
            port_var_95 = float(abs(np.percentile(port_daily_ret, 5)))
            
            matrix_list = [[round(float(val), 2) for val in row] for row in corr_mat]
            corr_result = {
                "tickers": list(ret_df.columns),
                "matrix": matrix_list
            }
        else:
            port_vol = 0.20
            port_var_95 = 0.02
            corr_result = {"tickers": tickers, "matrix": [[1.0 if i==j else 0.5 for j in range(len(tickers))] for i in range(len(tickers))]}
    else:
        port_vol = 0.22
        port_var_95 = 0.025
        corr_result = {"tickers": tickers, "matrix": [[1.0]] if len(tickers) == 1 else []}

    return {
        "annualized_vol": round(port_vol, 4),
        "hhi": round(hhi, 1),
        "is_concentrated": is_concentrated,
        "sector_weights": sector_weights,
        "correlation_matrix": corr_result,
        "portfolio_var_95": round(port_var_95, 4),
        "holdings_count": len(holdings)
    }

def evaluate_candidate_fit(
    candidate_ticker: str,
    current_holdings: List[Dict[str, Any]],
    illustrative_weight: float = 0.10
) -> Dict[str, Any]:
    """
    Computes before/after impact of adding candidate to user's portfolio:
    - Baseline portfolio Vol & VaR
    - New portfolio Vol & VaR after adding candidate at illustrative weight (e.g. 10%)
    - Marginal VaR delta: (New VaR - Base VaR)
    - Average correlation to existing holdings
    - Diversification benefit tag
    """
    base_metrics = compute_portfolio_metrics(current_holdings)
    
    if not current_holdings:
        return {
            "baseline_vol": 0.0,
            "new_vol": 0.0,
            "vol_change": 0.0,
            "baseline_var_95": 0.0,
            "new_var_95": 0.0,
            "marginal_var_delta": 0.0,
            "avg_correlation_to_holdings": 0.0,
            "diversification_verdict": "First asset in portfolio",
            "illustrative_weight": illustrative_weight
        }
        
    # Hypothetical combined holdings
    scale_factor = 1.0 - illustrative_weight
    new_holdings = [
        {"ticker": h["ticker"], "weight": h.get("weight", 0) * scale_factor}
        for h in current_holdings
    ]
    new_holdings.append({"ticker": candidate_ticker, "weight": illustrative_weight})
    
    new_metrics = compute_portfolio_metrics(new_holdings)
    
    vol_change = new_metrics["annualized_vol"] - base_metrics["annualized_vol"]
    var_change = new_metrics["portfolio_var_95"] - base_metrics["portfolio_var_95"]
    
    # Calculate pairwise correlation to holdings
    corrs = []
    cand_df, _, _ = fetch_ohlcv(candidate_ticker, years=2)
    if len(cand_df) > 30:
        cand_df["cand_ret"] = cand_df["Close"].pct_change()
        for h in current_holdings:
            t = h["ticker"]
            if t == candidate_ticker:
                continue
            h_df, _, _ = fetch_ohlcv(t, years=2)
            if len(h_df) > 30:
                h_df["h_ret"] = h_df["Close"].pct_change()
                merged = pd.merge(cand_df[["Date", "cand_ret"]], h_df[["Date", "h_ret"]], on="Date").dropna()
                if len(merged) > 20:
                    c = np.corrcoef(merged["cand_ret"], merged["h_ret"])[0, 1]
                    if not np.isnan(c):
                        corrs.append(float(c))
                        
    avg_corr = float(np.mean(corrs)) if corrs else 0.45
    
    if vol_change < -0.005:
        div_verdict = "HIGH DIVERSIFIER: Lowers overall portfolio volatility."
    elif avg_corr < 0.30:
        div_verdict = "GOOD DIVERSIFIER: Low correlation with your current holdings."
    elif avg_corr > 0.70:
        div_verdict = "HIGH CORRELATION: Redundant risk with existing positions."
    else:
        div_verdict = "MODERATE FIT: Neutral impact on portfolio diversification."
        
    return {
        "baseline_vol": base_metrics["annualized_vol"],
        "new_vol": new_metrics["annualized_vol"],
        "vol_change": round(vol_change, 4),
        "baseline_var_95": base_metrics["portfolio_var_95"],
        "new_var_95": new_metrics["portfolio_var_95"],
        "marginal_var_delta": round(var_change, 4),
        "avg_correlation_to_holdings": round(avg_corr, 2),
        "diversification_verdict": div_verdict,
        "illustrative_weight": illustrative_weight
    }
