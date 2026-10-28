import React, { useEffect, useState } from "react";
import { UserProfile, PortfolioMetrics, ScreenAsset } from "../types";
import { analyzePortfolio } from "../api/client";
import { SvgHeatGrid } from "../components/SvgHeatGrid";

interface PortfolioFitViewProps {
  profile: UserProfile;
  assets: ScreenAsset[];
  onSelectAsset: (ticker: string) => void;
  onNavigateProfile: () => void;
}

export const PortfolioFitView: React.FC<PortfolioFitViewProps> = ({
  profile,
  assets,
  onSelectAsset,
  onNavigateProfile
}) => {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    analyzePortfolio(profile.holdings)
      .then((data) => {
        if (isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [profile.holdings]);

  // Find diversifiers from the Board: candidates with low volatility or negative correlation
  const diversifierCandidates = assets
    .filter((a) => a.action_label === "CANDIDATE" && !profile.holdings.some((h) => h.ticker === a.ticker))
    .slice(0, 4);

  return (
    <div style={{ padding: "28px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <span className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
            STAGE 6 PORTFOLIO-AWARE DIVERSIFICATION
          </span>
          <h2 style={{ fontSize: "48px", margin: "4px 0 0 0" }}>PORTFOLIO FIT ANALYSIS</h2>
        </div>
        <button onClick={onNavigateProfile} style={{ fontSize: "12px" }}>
          EDIT HOLDINGS ON PROFILE →
        </button>
      </div>

      {profile.holdings.length === 0 ? (
        <div style={{ border: "2px solid var(--ink)", padding: "36px", textAlign: "center", backgroundColor: "var(--paper)" }}>
          <h3 style={{ fontSize: "24px", marginBottom: "8px" }}>NO ACTIVE HOLDINGS SPECIFIED</h3>
          <p style={{ fontSize: "16px", marginBottom: "18px" }}>
            Add your current stocks and ETFs in the Profile tab to view portfolio volatility, HHI concentration, and pairwise correlation heat-grid.
          </p>
          <button onClick={onNavigateProfile} className="btn-inverted">
            CONFIGURE HOLDINGS NOW
          </button>
        </div>
      ) : loading || !metrics ? (
        <div className="inverted" style={{ padding: "30px", textAlign: "center" }}>
          <div className="headline" style={{ fontSize: "22px", color: "var(--signal)" }}>
            ANALYZING HOLDINGS COVARIANCE & CONCENTRATION...
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Key Metrics Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>PORTFOLIO VOLATILITY</div>
              <div className="headline" style={{ fontSize: "36px", marginTop: "4px" }}>
                {(metrics.annualized_vol * 100).toFixed(1)}%
              </div>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>ANNUALIZED REALIZED</div>
            </div>

            <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>HHI CONCENTRATION INDEX</div>
              <div className="headline" style={{ fontSize: "36px", color: metrics.is_concentrated ? "var(--signal)" : "inherit", marginTop: "4px" }}>
                {metrics.hhi.toFixed(0)}
              </div>
              <div className="mono" style={{ fontSize: "11px", color: metrics.is_concentrated ? "var(--signal)" : "var(--gain)" }}>
                {metrics.is_concentrated ? "HIGHLY CONCENTRATED (>2500)" : "BALANCED DIVERSIFICATION"}
              </div>
            </div>

            <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>PORTFOLIO 95% DAILY VAR</div>
              <div className="headline" style={{ fontSize: "36px", color: "var(--signal)", marginTop: "4px" }}>
                {(metrics.portfolio_var_95 * 100).toFixed(2)}%
              </div>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>HISTORICAL TAIL VALUE AT RISK</div>
            </div>

            <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>POSITIONS TRACKED</div>
              <div className="headline" style={{ fontSize: "36px", marginTop: "4px" }}>
                {metrics.holdings_count}
              </div>
              <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>ACTIVE ASSET WEIGHTS</div>
            </div>
          </div>

          {/* Sector Breakdown & Heat Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px" }}>
            {/* Sector Weights Table */}
            <div style={{ border: "2px solid var(--ink)", padding: "18px 20px", backgroundColor: "var(--paper)" }}>
              <h3 style={{ fontSize: "20px", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
                SECTOR WEIGHT ALLOCATIONS
              </h3>
              <table className="ledger">
                <thead>
                  <tr>
                    <th>SECTOR</th>
                    <th className="text-right">WEIGHT</th>
                    <th className="text-right">PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.sector_weights).map(([sec, w]) => (
                    <tr key={sec}>
                      <td className="mono" style={{ fontWeight: 700 }}>{sec}</td>
                      <td className="text-right mono">{w.toFixed(2)}</td>
                      <td className="text-right mono">{(w * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ruled Pairwise Correlation Heat Grid */}
            <SvgHeatGrid
              tickers={metrics.correlation_matrix.tickers}
              matrix={metrics.correlation_matrix.matrix}
            />
          </div>

          {/* Suggested Diversifiers Strip */}
          <div style={{ border: "2px solid var(--ink)", padding: "20px 24px", backgroundColor: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "22px", margin: 0 }}>
                SUGGESTED BOARD DIVERSIFIERS FOR YOUR HOLDINGS
              </h3>
              <span className="mono" style={{ fontSize: "11px", color: "var(--gain)", fontWeight: 700 }}>
                CANDIDATES WITH MARGINAL VAR REDUCTION
              </span>
            </div>

            {diversifierCandidates.length === 0 ? (
              <div className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
                No active candidates meet diversification criteria.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                {diversifierCandidates.map((cand) => (
                  <div
                    key={cand.ticker}
                    onClick={() => onSelectAsset(cand.ticker)}
                    style={{
                      border: "1px solid var(--ink)",
                      padding: "14px 16px",
                      cursor: "pointer",
                      backgroundColor: "#E2DDD0"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span className="headline" style={{ fontSize: "24px" }}>{cand.ticker}</span>
                      <span className="headline" style={{ fontSize: "24px", color: "var(--gain)" }}>
                        {cand.opportunity_score.toFixed(0)}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--mute)", margin: "4px 0" }}>
                      {cand.name}
                    </div>
                    <div className="mono" style={{ fontSize: "11px", marginTop: "8px" }}>
                      P(UP): <strong>{(cand.prob_gain * 100).toFixed(1)}%</strong> | CVaR: <strong>{(cand.cvar_95_daily * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
