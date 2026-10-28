import numpy as np
from typing import Dict, Any, List

def compute_source_signals(
    tech_row: Dict[str, Any],
    lag_adjusted_sent: float,
    macro_regime_stress: float,
    model_expected_return: float,
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Reduces each of the four sources into a signed signal in [-1.0, +1.0]:
    1. Technical: combination of SMA 50/200 trend, RSI, and 63d momentum
    2. Sentiment: lag-adjusted news sentiment
    3. Macro: inverse of VIX percentile and yield stress (high stress -> negative)
    4. Model: direction and magnitude of ML sequence/tabular forecast
    
    If sources with material reliability weight (> 0.20) disagree in sign,
    triggers CONFLICT flag and lowers the composite confidence factor.
    """
    if weights is None:
        weights = {
            "technical": 0.40,
            "sentiment": 0.20,
            "macro": 0.15,
            "model": 0.25
        }
        
    # 1. Technical signal [-1, 1]
    sma_50_ratio = tech_row.get("sma_ratio_50", 1.0) - 1.0
    rsi = tech_row.get("rsi_14", 50.0)
    mom_63 = tech_row.get("momentum_63d", 0.0)
    
    tech_sig = 0.4 * np.tanh(sma_50_ratio * 10) + 0.3 * ((rsi - 50.0) / 25.0) + 0.3 * np.tanh(mom_63 * 3)
    tech_sig = float(np.clip(tech_sig, -1.0, 1.0))
    
    # 2. Sentiment signal [-1, 1]
    sent_sig = float(np.clip(lag_adjusted_sent, -1.0, 1.0))
    
    # 3. Macro signal [-1, 1] (stress pushes negative)
    macro_sig = float(np.clip(-1.0 * (macro_regime_stress - 0.5) * 2.0, -1.0, 1.0))
    
    # 4. Model signal [-1, 1]
    model_sig = float(np.clip(np.tanh(model_expected_return * 15.0), -1.0, 1.0))
    
    signals = {
        "technical": round(tech_sig, 3),
        "sentiment": round(sent_sig, 3),
        "macro": round(macro_sig, 3),
        "model": round(model_sig, 3)
    }
    
    # Conflict check among material sources (weight >= 0.15)
    material_signs = []
    for k, sig in signals.items():
        if weights.get(k, 0) >= 0.15 and abs(sig) >= 0.12:
            material_signs.append((k, 1 if sig > 0 else -1, weights[k]))
            
    has_positive = any(s[1] > 0 for s in material_signs)
    has_negative = any(s[1] < 0 for s in material_signs)
    has_conflict = has_positive and has_negative
    
    # Composite signed signal
    composite_sig = sum(signals[k] * weights.get(k, 0.25) for k in signals.keys())
    
    # Base confidence based on agreement and source weights
    agreement_score = 1.0 - (0.4 if has_conflict else 0.0)
    composite_confidence = float(np.clip(0.5 + 0.5 * abs(composite_sig) * agreement_score, 0.1, 0.95))
    
    conflict_details = ""
    if has_conflict:
        pos_sources = [s[0].upper() for s in material_signs if s[1] > 0]
        neg_sources = [s[0].upper() for s in material_signs if s[1] < 0]
        conflict_details = f"Sources disagree: {', '.join(pos_sources)} bullish vs {', '.join(neg_sources)} bearish"
        
    return {
        "signals": signals,
        "weights": weights,
        "composite_signal": round(float(composite_sig), 3),
        "confidence": round(composite_confidence, 3),
        "has_conflict": has_conflict,
        "conflict_details": conflict_details
    }
