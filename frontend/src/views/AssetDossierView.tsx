import React, { useEffect, useState } from "react";
import { AssetDossier, UserProfile } from "../types";
import { fetchAssetDossier, fetchAssetPersonalFit } from "../api/client";
import { ScoreBadge } from "../components/ScoreBadge";
import { SignalsGauge } from "../components/SignalsGauge";
import { SvgPriceFanChart } from "../components/SvgPriceFanChart";
import { SvgLagChart } from "../components/SvgLagChart";
import { SvgShapBars } from "../components/SvgShapBars";
import { FuzzyRulesMatrix } from "../components/FuzzyRulesMatrix";
import { DeterministicReport } from "../components/DeterministicReport";

interface AssetDossierViewProps {
  ticker: string;
  profile: UserProfile;
  onBack: () => void;
}

export const AssetDossierView: React.FC<AssetDossierViewProps> = ({
  ticker,
  profile,
  onBack
}) => {
  const [dossier, setDossier] = useState<AssetDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [personalFit, setPersonalFit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const horizonDays = profile.horizon_months <= 1 ? 21 : (profile.horizon_months <= 3 ? 63 : 126);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchAssetDossier(ticker, horizonDays),
      fetchAssetPersonalFit(ticker, profile.holdings, 0.10)
    ])
      .then(([dossierData, fitData]) => {
        if (isMounted) {
          setDossier(dossierData);
          setPersonalFit(fitData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticker, horizonDays, profile.holdings]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="inverted" style={{ padding: "40px", border: "2px solid var(--ink)", display: "inline-block" }}>
          <div className="headline" style={{ fontSize: "28px", color: "var(--signal)" }}>
            RETRIEVING ASSET DOSSIER FOR {ticker}...
          </div>
          <p className="mono" style={{ marginTop: "10px", fontSize: "12px", color: "var(--paper)" }}>
            RUNNING MONTE CARLO (5,000 PATHS) & CALCULATING SHAP FEATURE IMPORTANCE
          </p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div style={{ padding: "30px" }}>
        <button onClick={onBack} style={{ marginBottom: "16px" }}>← BACK TO BOARD</button>
        <div className="tag tag-signal" style={{ padding: "14px", fontSize: "14px" }}>
          ERROR LOADING DOSSIER: {error || "Not found"}
        </div>
      </div>
    );
  }

  const risk = dossier.risk_panel;
  const wf = dossier.validation.walk_forward;

  return (
    <div style={{ padding: "28px", maxWidth: "1280px" }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={onBack} style={{ fontSize: "12px" }}>
          ← RETURN TO THE BOARD LEDGER
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {dossier.is_sample && <span className="tag tag-signal">SAMPLE DATA</span>}
          <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            AS-OF: {dossier.as_of?.slice(0, 16).replace("T", " ")}
          </span>
        </div>
      </div>

      {/* Hero Asset Header Block */}
      <div style={{ border: "2px solid var(--ink)", padding: "24px 28px", backgroundColor: "var(--paper)", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <h1 style={{ fontSize: "64px", margin: 0, letterSpacing: "-0.04em" }}>
                {dossier.ticker}
              </h1>
              <span className="mono" style={{ fontSize: "14px", color: "var(--mute)", fontWeight: 700 }}>
                {dossier.market === "IN" ? "NSE EQUITIES (INDIA)" : "S&P 100 EQUITIES (US)"}
              </span>
            </div>
            <h3 style={{ fontSize: "24px", color: "var(--ink)", fontWeight: 400, marginTop: "2px" }}>
              {dossier.name} — {dossier.sector}
            </h3>
            <div className="mono" style={{ fontSize: "14px", marginTop: "8px" }}>
              CURRENT QUOTE: <strong>${dossier.current_price.toFixed(2)}</strong>
            </div>
          </div>

          {/* Giant Opportunity Score */}
          <ScoreBadge
            score={dossier.opportunity_score}
            actionLabel={dossier.action_label}
            size="large"
            tier={dossier.tier}
          />
        </div>

        {/* Verdict Block (Inverted) */}
        <div className="inverted" style={{ border: "2px solid var(--ink)", padding: "14px 18px", marginTop: "20px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--signal)", fontWeight: 800, marginBottom: "4px" }}>
            BOARD DECISION-SUPPORT ONE-LINER VERDICT
          </div>
          <div style={{ fontSize: "18px", color: "var(--paper)", fontWeight: 500 }}>
            {dossier.verdict_one_liner}
          </div>
        </div>
      </div>

      {/* Main Grid: Price Fan Chart & Signals */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "28px" }}>
        {/* Price Action and Monte Carlo Forecast Fan */}
        <SvgPriceFanChart
          priceHistory={dossier.price_history}
          monteCarlo={dossier.monte_carlo}
          ticker={dossier.ticker}
        />

        {/* Two-Column: Signals Panel & News Lag Profile */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
          <SignalsGauge
            signals={dossier.signals_panel.signals}
            weights={dossier.signals_panel.weights}
            hasConflict={dossier.signals_panel.has_conflict}
            conflictDetails={dossier.signals_panel.conflict_details}
            confidence={dossier.signals_panel.confidence}
            excludedSources={dossier.validation.ablation.group_status}
          />

          <SvgLagChart lagProfile={dossier.news_sentiment.lag_profile} />
        </div>
      </div>

      {/* Risk Panel (Inverted Header Block per Spec) */}
      <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <div className="inverted" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "22px", margin: 0, color: "var(--paper)" }}>
            DOWNSIDE RISK PROFILE & STRESS MATRIX
          </h3>
          <span className="mono" style={{ fontSize: "11px", color: "var(--signal)", fontWeight: 800 }}>
            PRIMARY OUTPUT
          </span>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Risk Metrics Ledger Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" }}>
            <div style={{ border: "1px solid var(--ink)", padding: "12px", backgroundColor: "#E4DFD2" }}>
              <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>ANNUALIZED VOLATILITY</div>
              <div className="headline" style={{ fontSize: "28px", marginTop: "4px" }}>
                {(risk.var_metrics.annualized_vol * 100).toFixed(1)}%
              </div>
            </div>

            <div style={{ border: "1px solid var(--ink)", padding: "12px", backgroundColor: "#E4DFD2" }}>
              <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>MAX DRAWDOWN (HIST)</div>
              <div className="headline" style={{ fontSize: "28px", color: "var(--signal)", marginTop: "4px" }}>
                {(risk.var_metrics.max_drawdown * 100).toFixed(1)}%
              </div>
            </div>

            <div style={{ border: "1px solid var(--ink)", padding: "12px", backgroundColor: "#E4DFD2" }}>
              <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>DAILY VAR (95%)</div>
              <div className="headline" style={{ fontSize: "28px", color: "var(--signal)", marginTop: "4px" }}>
                {(risk.var_metrics.var_95_daily * 100).toFixed(2)}%
              </div>
            </div>

            <div style={{ border: "1px solid var(--ink)", padding: "12px", backgroundColor: "#E4DFD2" }}>
              <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>DAILY CVAR (95%)</div>
              <div className="headline" style={{ fontSize: "28px", color: "var(--signal)", marginTop: "4px" }}>
                {(risk.var_metrics.cvar_95_daily * 100).toFixed(2)}%
              </div>
            </div>

            <div style={{ border: "1px solid var(--ink)", padding: "12px", backgroundColor: "#E4DFD2" }}>
              <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>P(DRAWDOWN &gt; 6%)</div>
              <div className="headline" style={{ fontSize: "28px", marginTop: "4px" }}>
                {(risk.drawdown_prob * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Stress Scenarios Table & Fuzzy Risk Matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Historical Crisis Replay & User Shock */}
            <div>
              <div className="mono" style={{ fontSize: "12px", fontWeight: 800, marginBottom: "8px" }}>
                HISTORICAL CRISIS REPLAY & ADJUSTABLE STRESS SHOCK:
              </div>
              <div style={{ border: "1px solid var(--ink)" }}>
                <table className="ledger" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th>SCENARIO</th>
                      <th className="text-right">DRAWDOWN</th>
                      <th className="text-right">IMPLIED PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risk.stress_tests.historical_scenarios.map((s, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{s.name}</strong>
                          <div style={{ fontSize: "10px", color: "var(--mute)" }}>{s.period}</div>
                        </td>
                        <td className="text-right mono" style={{ color: "var(--signal)", fontWeight: 700 }}>
                          {(s.drawdown * 100).toFixed(1)}%
                        </td>
                        <td className="text-right mono">${s.implied_price.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <strong>CUSTOM STRESS TEST</strong>
                        <div style={{ fontSize: "10px", color: "var(--mute)" }}>Market -20%, Vol +50%</div>
                      </td>
                      <td className="text-right mono" style={{ color: "var(--signal)", fontWeight: 700 }}>
                        {(risk.stress_tests.custom_shock.projected_loss * 100).toFixed(1)}%
                      </td>
                      <td className="text-right mono">${risk.stress_tests.custom_shock.projected_price.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fuzzy Risk Rules Matrix */}
            <FuzzyRulesMatrix
              score={risk.fuzzy_risk.risk_score}
              firedRules={risk.fuzzy_risk.fired_rules}
            />
          </div>
        </div>
      </div>

      {/* Why & Personal Fit Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* SHAP Drivers */}
        <SvgShapBars drivers={dossier.shap_drivers} />

        {/* Personal Fit with User Holdings */}
        <div style={{ border: "2px solid var(--ink)", padding: "18px 20px", backgroundColor: "var(--paper)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "20px", margin: 0 }}>PORTFOLIO FIT IMPACT</h3>
            <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
              ILLUSTRATIVE 10% WEIGHT
            </span>
          </div>

          {personalFit ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="tag tag-inverted" style={{ fontSize: "11px", padding: "6px 10px" }}>
                {personalFit.diversification_verdict}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#DDD7C8" }}>
                  <div className="mono" style={{ fontSize: "10px" }}>PORTFOLIO VOL IMPACT:</div>
                  <div className="mono" style={{ fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>
                    {(personalFit.baseline_vol * 100).toFixed(1)}% → {(personalFit.new_vol * 100).toFixed(1)}%
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: personalFit.vol_change < 0 ? "var(--gain)" : "var(--signal)" }}>
                    {personalFit.vol_change < 0 ? `REDUCES VOL ${Math.abs(personalFit.vol_change*100).toFixed(2)}%` : `ADDS VOL +${(personalFit.vol_change*100).toFixed(2)}%`}
                  </div>
                </div>

                <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#DDD7C8" }}>
                  <div className="mono" style={{ fontSize: "10px" }}>MARGINAL DAILY VAR (95%):</div>
                  <div className="mono" style={{ fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>
                    {(personalFit.marginal_var_delta * 100).toFixed(3)}%
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
                    AVG CORRELATION: {personalFit.avg_correlation_to_holdings}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
              Configure your holdings on the PROFILE screen to view marginal VaR impact.
            </div>
          )}
        </div>
      </div>

      {/* Validation Strip: Out-of-Sample Walk-Forward vs Baselines */}
      <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", padding: "18px 20px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "20px", margin: 0 }}>EXPANDING WALK-FORWARD VALIDATION STRIP</h3>
          <span className={`tag ${wf.beats_baseline ? "tag-gain" : "tag-signal"}`} style={{ fontSize: "11px" }}>
            {wf.beats_baseline ? "BEATS NAIVE BASELINE" : "NO RELIABLE EDGE"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#E2DDD0" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>DIRECTIONAL ACCURACY</div>
            <div className="headline" style={{ fontSize: "26px", marginTop: "2px" }}>
              {(wf.directional_accuracy * 100).toFixed(1)}%
            </div>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
              95% CI: [{(wf.dir_acc_ci[0]*100).toFixed(1)}%, {(wf.dir_acc_ci[1]*100).toFixed(1)}%]
            </div>
          </div>

          <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#E2DDD0" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>MEAN ABS ERROR (MAE)</div>
            <div className="headline" style={{ fontSize: "26px", marginTop: "2px" }}>
              {wf.mae.toFixed(4)}
            </div>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
              95% CI: [{wf.mae_ci[0].toFixed(4)}, {wf.mae_ci[1].toFixed(4)}]
            </div>
          </div>

          <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#E2DDD0" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>PAIRED TEST P-VALUE</div>
            <div className="headline" style={{ fontSize: "26px", marginTop: "2px", color: wf.paired_p_value < 0.05 ? "var(--gain)" : "var(--signal)" }}>
              {wf.paired_p_value.toFixed(3)}
            </div>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
              {wf.paired_p_value < 0.05 ? "STATISTICALLY SIGNIFICANT" : "FAIL TO REJECT NAIVE"}
            </div>
          </div>

          <div style={{ border: "1px solid var(--ink)", padding: "10px", backgroundColor: "#E2DDD0" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>NAIVE BENCHMARK ACC</div>
            <div className="headline" style={{ fontSize: "26px", marginTop: "2px" }}>
              {((wf.baselines?.naive_persistence?.dir_acc || 0.50) * 100).toFixed(1)}%
            </div>
            <div className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
              RANDOM WALK PERSISTENCE
            </div>
          </div>
        </div>
      </div>

      {/* Plain Language Deterministic Report */}
      <DeterministicReport report={dossier.report} />
    </div>
  );
};
