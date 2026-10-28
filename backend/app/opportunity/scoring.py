import numpy as np
from typing import Dict, List, Any

# Map user risk tolerance (1=very conservative, 5=very aggressive) to lambda penalty
# More conservative = higher penalty on CVaR loss
LAMBDA_PENALTY = {
    1: 3.5,  # Ultra-conservative
    2: 2.5,  # Conservative
    3: 1.8,  # Moderate / Balanced
    4: 1.2,  # Growth
    5: 0.7   # Aggressive
}

RISK_BUDGET_CAPS = {
    1: {"max_annual_vol": 0.18, "max_cvar": 0.08, "max_fuzzy": 45.0},
    2: {"max_annual_vol": 0.24, "max_cvar": 0.12, "max_fuzzy": 60.0},
    3: {"max_annual_vol": 0.32, "max_cvar": 0.18, "max_fuzzy": 75.0},
    4: {"max_annual_vol": 0.42, "max_cvar": 0.25, "max_fuzzy": 85.0},
    5: {"max_annual_vol": 0.65, "max_cvar": 0.40, "max_fuzzy": 95.0}
}

def compute_raw_opportunity(
    model_expected_return: float,
    confidence: float,
    cvar_loss: float,
    risk_tolerance: int = 3
) -> Dict[str, float]:
    """
    mu = confidence * model_expected_return (shrunk toward 0 by validated confidence)
    raw = mu - lambda * CVaR_loss
    """
    lmbda = LAMBDA_PENALTY.get(risk_tolerance, 1.8)
    # Shrunk expected return
    mu = confidence * model_expected_return
    # Raw risk-adjusted opportunity metric
    raw = mu - (lmbda * cvar_loss)
    
    return {
        "mu": round(float(mu), 4),
        "raw_opportunity": round(float(raw), 4),
        "lambda_used": lmbda
    }

def rank_universe_opportunities(
    assets_raw_scores: List[Dict[str, Any]],
    user_risk_tolerance: int = 3
) -> List[Dict[str, Any]]:
    """
    Takes list of candidate asset dictionaries with their raw scores, risk metrics, and validation flags.
    Computes percentile-rank opportunity score (0 to 100), applies gating rules, and assigns action labels:
    - CANDIDATE: Beat baseline, inside risk budget, positive opportunity, score >= 60
    - WATCH: Beat baseline, inside risk budget, score 40-59
    - AVOID: Poor opportunity or high downside
    - NO RELIABLE EDGE: Failed paired test vs naive baseline (accuracy/error <= baseline)
    - OUTSIDE YOUR RISK BUDGET: Exceeds volatility or CVaR budget for user tolerance
    """
    if not assets_raw_scores:
        return []
        
    budget = RISK_BUDGET_CAPS.get(user_risk_tolerance, RISK_BUDGET_CAPS[3])
    
    raw_vals = [a["raw_opportunity"] for a in assets_raw_scores]
    min_raw = min(raw_vals)
    max_raw = max(raw_vals)
    raw_range = max_raw - min_raw if max_raw > min_raw else 1.0
    
    results = []
    for item in assets_raw_scores:
        res = dict(item)
        raw = res["raw_opportunity"]
        # Percentile rank 0-100 within current universe
        pctile = ((raw - min_raw) / raw_range) * 100.0
        opp_score = round(float(pctile), 1)
        res["opportunity_score"] = opp_score
        
        # GATING CHECKS:
        # 1. Edge test check: Did the ML model beat the naive baseline in walk-forward testing?
        beats_baseline = res.get("beats_baseline", True)
        
        # 2. Risk budget check
        vol = res.get("annualized_vol", 0.25)
        cvar = res.get("cvar_95_daily", 0.04)
        fuzzy = res.get("fuzzy_risk_score", 50.0)
        
        exceeds_budget = (
            vol > budget["max_annual_vol"] or
            cvar > budget["max_cvar"] or
            fuzzy > budget["max_fuzzy"]
        )
        
        # Determine strict action label
        if not beats_baseline:
            action = "NO RELIABLE EDGE"
            verdict = "Model walk-forward metrics do not beat the naive persistence baseline. No proven statistical edge."
        elif exceeds_budget:
            action = "OUTSIDE YOUR RISK BUDGET"
            verdict = f"Risk metrics ({vol*100:.1f}% vol / {cvar*100:.1f}% CVaR) exceed user risk tolerance level {user_risk_tolerance} ceiling."
        elif opp_score >= 65 and res.get("prob_gain", 0.5) >= 0.54:
            action = "CANDIDATE"
            verdict = "Statistically validated forward upside exceeds downside penalty and satisfies portfolio risk budget."
        elif opp_score >= 42:
            action = "WATCH"
            verdict = "Moderate risk-adjusted opportunity; monitor for clearer directional signal or improved entry valuation."
        else:
            action = "AVOID"
            verdict = "Downside risk / CVaR outweighs shrunk expected return; unattractive risk-reward ratio."
            
        res["action_label"] = action
        res["verdict_one_liner"] = verdict
        results.append(res)
        
    # Sort descending by opportunity score
    results.sort(key=lambda x: x["opportunity_score"], reverse=True)
    for rank, item in enumerate(results, start=1):
        item["rank"] = rank
        
    return results
