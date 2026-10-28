import pytest
import numpy as np
import pandas as pd
from app.risk.var_cvar import compute_var_cvar
from app.risk.fuzzy_rules import evaluate_fuzzy_risk, EXPERT_RULES
from app.opportunity.scoring import compute_raw_opportunity, rank_universe_opportunities

def test_var_cvar_invariants():
    # CVaR (Expected Shortfall) must be >= VaR
    np.random.seed(42)
    rets = pd.Series(np.random.normal(-0.001, 0.02, size=500))
    metrics = compute_var_cvar(rets, confidence=0.95)
    
    assert metrics["cvar_95_daily"] >= metrics["var_95_daily"]
    assert metrics["annualized_vol"] > 0
    assert metrics["max_drawdown"] >= 0

def test_fuzzy_risk_scoring():
    # Low vol, low weakness, low stress -> should yield minimal risk (< 20)
    low_res = evaluate_fuzzy_risk(0.1, 0.1, 0.1)
    assert low_res["risk_score"] < 25.0
    
    # High vol, high weakness, high stress -> should yield critical risk (> 85)
    high_res = evaluate_fuzzy_risk(0.9, 0.9, 0.9)
    assert high_res["risk_score"] > 85.0
    
    # Rule count must be 27
    assert len(EXPERT_RULES) == 27

def test_opportunity_gating_baseline_failure():
    # If beats_baseline is False, action_label MUST be NO RELIABLE EDGE
    candidates = [{
        "ticker": "FAIL_TICKER",
        "raw_opportunity": 0.05,
        "beats_baseline": False,
        "annualized_vol": 0.20,
        "cvar_95_daily": 0.03,
        "fuzzy_risk_score": 40.0
    }]
    ranked = rank_universe_opportunities(candidates, user_risk_tolerance=3)
    assert ranked[0]["action_label"] == "NO RELIABLE EDGE"
