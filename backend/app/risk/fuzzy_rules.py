import numpy as np
from typing import Dict, List, Any, Tuple

# Triangular membership function: (a, b, c) where a=left, b=peak, c=right
def triangular_membership(x: float, a: float, b: float, c: float) -> float:
    if x <= a or x >= c:
        return 0.0
    if a < x <= b:
        return (x - a) / (b - a + 1e-12)
    if b < x < c:
        return (c - x) / (c - b + 1e-12)
    return 0.0

MEMBERSHIP_DEFS = {
    "LOW": (0.0, 0.0, 0.5),
    "MEDIUM": (0.2, 0.5, 0.8),
    "HIGH": (0.5, 1.0, 1.0)
}

# The 27 Expert Rules from Survey Paper [4]
# (Vol Level, Trend/DD Weakness, Macro/News Stress) -> (Consequent Name, Consequent Centroid)
EXPERT_RULES = [
    # Low Volatility (9 rules)
    {"id": 1,  "vol": "LOW",    "weakness": "LOW",    "stress": "LOW",    "consequent": "MINIMAL RISK", "score": 10.0},
    {"id": 2,  "vol": "LOW",    "weakness": "LOW",    "stress": "MEDIUM", "consequent": "LOW RISK",     "score": 22.0},
    {"id": 3,  "vol": "LOW",    "weakness": "LOW",    "stress": "HIGH",   "consequent": "MODERATE RISK","score": 40.0},
    {"id": 4,  "vol": "LOW",    "weakness": "MEDIUM", "stress": "LOW",    "consequent": "LOW RISK",     "score": 25.0},
    {"id": 5,  "vol": "LOW",    "weakness": "MEDIUM", "stress": "MEDIUM", "consequent": "MODERATE RISK","score": 38.0},
    {"id": 6,  "vol": "LOW",    "weakness": "MEDIUM", "stress": "HIGH",   "consequent": "ELEVATED RISK","score": 52.0},
    {"id": 7,  "vol": "LOW",    "weakness": "HIGH",   "stress": "LOW",    "consequent": "MODERATE RISK","score": 42.0},
    {"id": 8,  "vol": "LOW",    "weakness": "HIGH",   "stress": "MEDIUM", "consequent": "ELEVATED RISK","score": 58.0},
    {"id": 9,  "vol": "LOW",    "weakness": "HIGH",   "stress": "HIGH",   "consequent": "HIGH RISK",    "score": 70.0},

    # Medium Volatility (9 rules)
    {"id": 10, "vol": "MEDIUM", "weakness": "LOW",    "stress": "LOW",    "consequent": "LOW RISK",     "score": 28.0},
    {"id": 11, "vol": "MEDIUM", "weakness": "LOW",    "stress": "MEDIUM", "consequent": "MODERATE RISK","score": 42.0},
    {"id": 12, "vol": "MEDIUM", "weakness": "LOW",    "stress": "HIGH",   "consequent": "ELEVATED RISK","score": 58.0},
    {"id": 13, "vol": "MEDIUM", "weakness": "MEDIUM", "stress": "LOW",    "consequent": "MODERATE RISK","score": 45.0},
    {"id": 14, "vol": "MEDIUM", "weakness": "MEDIUM", "stress": "MEDIUM", "consequent": "BALANCED RISK","score": 50.0},
    {"id": 15, "vol": "MEDIUM", "weakness": "MEDIUM", "stress": "HIGH",   "consequent": "HIGH RISK",    "score": 68.0},
    {"id": 16, "vol": "MEDIUM", "weakness": "HIGH",   "stress": "LOW",    "consequent": "ELEVATED RISK","score": 60.0},
    {"id": 17, "vol": "MEDIUM", "weakness": "HIGH",   "stress": "MEDIUM", "consequent": "HIGH RISK",    "score": 72.0},
    {"id": 18, "vol": "MEDIUM", "weakness": "HIGH",   "stress": "HIGH",   "consequent": "SEVERE RISK",  "score": 82.0},

    # High Volatility (9 rules)
    {"id": 19, "vol": "HIGH",   "weakness": "LOW",    "stress": "LOW",    "consequent": "MODERATE RISK","score": 48.0},
    {"id": 20, "vol": "HIGH",   "weakness": "LOW",    "stress": "MEDIUM", "consequent": "ELEVATED RISK","score": 62.0},
    {"id": 21, "vol": "HIGH",   "weakness": "LOW",    "stress": "HIGH",   "consequent": "HIGH RISK",    "score": 76.0},
    {"id": 22, "vol": "HIGH",   "weakness": "MEDIUM", "stress": "LOW",    "consequent": "ELEVATED RISK","score": 65.0},
    {"id": 23, "vol": "HIGH",   "weakness": "MEDIUM", "stress": "MEDIUM", "consequent": "HIGH RISK",    "score": 75.0},
    {"id": 24, "vol": "HIGH",   "weakness": "MEDIUM", "stress": "HIGH",   "consequent": "SEVERE RISK",  "score": 86.0},
    {"id": 25, "vol": "HIGH",   "weakness": "HIGH",   "stress": "LOW",    "consequent": "HIGH RISK",    "score": 78.0},
    {"id": 26, "vol": "HIGH",   "weakness": "HIGH",   "stress": "MEDIUM", "consequent": "SEVERE RISK",  "score": 88.0},
    {"id": 27, "vol": "HIGH",   "weakness": "HIGH",   "stress": "HIGH",   "consequent": "CRITICAL RISK","score": 96.0},
]

def evaluate_fuzzy_risk(
    vol_pctile: float,
    trend_weakness: float,
    macro_news_stress: float
) -> Dict[str, Any]:
    """
    Evaluates the 27 expert fuzzy risk rules.
    Inputs are normalized in [0.0, 1.0].
    Returns defuzzified risk score in [0, 100] and list of fired rules with activation weights.
    """
    # Clamp inputs
    v = float(np.clip(vol_pctile, 0.0, 1.0))
    w = float(np.clip(trend_weakness, 0.0, 1.0))
    s = float(np.clip(macro_news_stress, 0.0, 1.0))
    
    # Calculate memberships for each input
    mu_v = {k: triangular_membership(v, *params) for k, params in MEMBERSHIP_DEFS.items()}
    mu_w = {k: triangular_membership(w, *params) for k, params in MEMBERSHIP_DEFS.items()}
    mu_s = {k: triangular_membership(s, *params) for k, params in MEMBERSHIP_DEFS.items()}
    
    total_weight = 0.0
    weighted_sum = 0.0
    fired_rules = []
    
    for rule in EXPERT_RULES:
        w_v = mu_v[rule["vol"]]
        w_w = mu_w[rule["weakness"]]
        w_s = mu_s[rule["stress"]]
        
        # Rule firing strength (Mamdani min operator)
        fire_weight = min(w_v, w_w, w_s)
        
        if fire_weight > 0.01:
            total_weight += fire_weight
            weighted_sum += fire_weight * rule["score"]
            fired_rules.append({
                "rule_id": rule["id"],
                "vol": rule["vol"],
                "weakness": rule["weakness"],
                "stress": rule["stress"],
                "consequent": rule["consequent"],
                "rule_score": rule["score"],
                "weight": round(float(fire_weight), 3)
            })
            
    # Defuzzification
    if total_weight > 0:
        defuzz_score = weighted_sum / total_weight
    else:
        defuzz_score = 50.0  # default balanced
        
    fired_rules.sort(key=lambda r: r["weight"], reverse=True)
    
    return {
        "risk_score": round(float(defuzz_score), 1),
        "inputs": {
            "vol_percentile": round(v, 3),
            "trend_weakness": round(w, 3),
            "macro_news_stress": round(s, 3)
        },
        "memberships": {
            "volatility": {k: round(v_val, 3) for k, v_val in mu_v.items()},
            "trend_weakness": {k: round(w_val, 3) for k, w_val in mu_w.items()},
            "macro_stress": {k: round(s_val, 3) for k, s_val in mu_s.items()}
        },
        "fired_rules": fired_rules[:5], # top 5 contributing rules
        "all_rules_count": len(EXPERT_RULES)
    }
