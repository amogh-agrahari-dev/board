import numpy as np
import pandas as pd
from typing import Dict, List, Any
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

TIER_LABELS = ["EXCELLENT", "GOOD", "FAIR", "WEAK", "BAD"]

def compute_universe_tiers(universe_fundamentals: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    K-Means (k=5) over:
    - Valuation: P/E, P/B, P/S (lower valuation is better for value/margin of safety)
    - Profitability: ROA, ROE (higher is better)
    - Risk/Return: Annualized Volatility (lower is better) and Sharpe Ratio (higher is better)
    
    Ranks the 5 clusters into:
    EXCELLENT / GOOD / FAIR / WEAK / BAD by a composite quality score.
    Returns ticker mappings, cluster centroids, and tier criteria.
    """
    if len(universe_fundamentals) < 5:
        # Fallback if universe is too small
        result = {}
        for idx, u in enumerate(universe_fundamentals):
            result[u["ticker"]] = TIER_LABELS[min(idx, 4)]
        return {
            "ticker_tiers": result,
            "centroids": [],
            "tier_definitions": {t: f"Tier {t}" for t in TIER_LABELS}
        }
        
    df = pd.DataFrame(universe_fundamentals)
    
    # Feature columns
    feat_cols = ["pe", "pb", "ps", "roa", "roe", "volatility", "sharpe"]
    for c in feat_cols:
        if c not in df.columns:
            df[c] = 0.0
        df[c] = df[c].fillna(df[c].median() if len(df[c].dropna()) > 0 else 0.0)
        
    X = df[feat_cols].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    df["cluster"] = clusters
    
    # Composite score for each cluster to rank them into tiers:
    # + ROE + ROA + Sharpe - 0.5*PE - 0.5*PB - Volatility
    cluster_composites = []
    for c_id in range(5):
        c_subset = df[df["cluster"] == c_id]
        if len(c_subset) > 0:
            c_score = (
                c_subset["roe"].mean() * 2.0 +
                c_subset["roa"].mean() * 3.0 +
                c_subset["sharpe"].mean() * 1.5 -
                (c_subset["pe"].mean() / 50.0) -
                (c_subset["pb"].mean() / 20.0) -
                c_subset["volatility"].mean()
            )
        else:
            c_score = 0.0
        cluster_composites.append((c_id, float(c_score)))
        
    # Sort cluster IDs descending by composite score
    cluster_composites.sort(key=lambda x: x[1], reverse=True)
    cluster_to_tier = {c_tuple[0]: TIER_LABELS[rank] for rank, c_tuple in enumerate(cluster_composites)}
    
    df["tier"] = df["cluster"].map(cluster_to_tier)
    
    # Build readable centroids
    centroids_info = []
    unscaled_centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    for c_id, score in cluster_composites:
        tier_name = cluster_to_tier[c_id]
        c_row = unscaled_centroids[c_id]
        centroids_info.append({
            "tier": tier_name,
            "cluster_id": c_id,
            "pe": round(float(c_row[0]), 1),
            "pb": round(float(c_row[1]), 1),
            "ps": round(float(c_row[2]), 1),
            "roa": round(float(c_row[3]), 3),
            "roe": round(float(c_row[4]), 3),
            "volatility": round(float(c_row[5]), 3),
            "sharpe": round(float(c_row[6]), 2),
            "composite_score": round(score, 3)
        })
        
    tier_definitions = {
        "EXCELLENT": "Top profitability (ROE/ROA) combined with superior risk-adjusted Sharpe and reasonable valuation.",
        "GOOD": "Strong fundamentals and consistent profitability with moderate volatility.",
        "FAIR": "Average market multiples with balanced risk-return characteristics.",
        "WEAK": "Stretched valuations relative to earnings quality or elevated volatility.",
        "BAD": "Depressed profitability metrics combined with high drawdown exposure or severe valuation discount."
    }
    
    ticker_tiers = dict(zip(df["ticker"], df["tier"]))
    
    return {
        "ticker_tiers": ticker_tiers,
        "centroids": centroids_info,
        "tier_definitions": tier_definitions
    }
