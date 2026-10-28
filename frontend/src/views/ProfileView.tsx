import React, { useState } from "react";
import { UserProfile, Holding, Market } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "1. PRIMARY CAPITAL OBJECTIVE",
    options: [
      { text: "Preserve capital at all costs; minimal downside tolerance", points: 1 },
      { text: "Stable capital growth with steady income and low fluctuation", points: 2 },
      { text: "Balanced growth seeking moderate returns with measured risk", points: 3 },
      { text: "Aggressive appreciation; willing to absorb sharp drawdowns", points: 4 },
      { text: "Maximum speculative returns; volatility is secondary", points: 5 }
    ]
  },
  {
    id: 2,
    question: "2. REACTION TO A -20% UNEXPECTED MARKET DRAWDOWN",
    options: [
      { text: "Liquidate remaining positions immediately to prevent further loss", points: 1 },
      { text: "Feel severe discomfort; pause further investments and de-risk", points: 2 },
      { text: "Hold existing positions calmly and wait for mean-reversion", points: 3 },
      { text: "View the drop as an opportunity and begin buying high-conviction assets", points: 4 },
      { text: "Aggressively deploy reserve cash into beaten-down high-beta opportunities", points: 5 }
    ]
  },
  {
    id: 3,
    question: "3. ANNUALIZED REALIZED VOLATILITY CEILING",
    options: [
      { text: "Under 15% (Comparable to broad index or short-duration debt)", points: 1 },
      { text: "15% to 22% (Typical defensive and large-cap equity range)", points: 2 },
      { text: "22% to 32% (Broad equity universe with sector cyclicality)", points: 3 },
      { text: "32% to 45% (High-beta growth and turnaround equities)", points: 4 },
      { text: "Above 45% (Emerging tech, leveraged ETFs, and extreme swings)", points: 5 }
    ]
  },
  {
    id: 4,
    question: "4. TIME HORIZON & LIQUIDITY CONSTRAINT",
    options: [
      { text: "May need capital within 30 to 60 days; immediate liquidity critical", points: 1 },
      { text: "Fixed 3 to 6 months horizon; limited tolerance for delayed recovery", points: 2 },
      { text: "6 to 12 months; flexible enough to weather intermediate cycles", points: 3 },
      { text: "1 to 3 years; long runway to allow thesis validation", points: 4 },
      { text: "Multi-year patient capital; completely unconstrained by short cycles", points: 5 }
    ]
  },
  {
    id: 5,
    question: "5. HISTORICAL DRAWDOWN EXPERIENCE & PSYCHOLOGY",
    options: [
      { text: "No prior experience with severe bear markets or tail events", points: 1 },
      { text: "Experienced minor corrections; found them stressful", points: 2 },
      { text: "Navigated standard market corrections with pre-defined discipline", points: 3 },
      { text: "Experienced sharp crashes (e.g. 2020/2022) without panic selling", points: 4 },
      { text: "Seasoned in crisis environments; comfortable with tail-risk mathematics", points: 5 }
    ]
  }
];

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSaveProfile }) => {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({
    1: profile.risk_tolerance,
    2: profile.risk_tolerance,
    3: profile.risk_tolerance,
    4: profile.risk_tolerance,
    5: profile.risk_tolerance
  });

  const [tolerance, setTolerance] = useState<number>(profile.risk_tolerance);
  const [horizonMonths, setHorizonMonths] = useState<number>(profile.horizon_months);
  const [market, setMarket] = useState<Market>(profile.market);
  const [currency, setCurrency] = useState<string>(profile.currency);
  const [holdings, setHoldings] = useState<Holding[]>(profile.holdings);
  const [newTicker, setNewTicker] = useState<string>("");
  const [newWeight, setNewWeight] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [showCsvBox, setShowCsvBox] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSelectQuiz = (qId: number, points: number) => {
    const updated = { ...quizAnswers, [qId]: points };
    setQuizAnswers(updated);
    // Recalculate average tolerance score
    const avg = Object.values(updated).reduce((a, b) => a + b, 0) / 5;
    const rounded = Math.min(5, Math.max(1, Math.round(avg)));
    setTolerance(rounded);
  };

  const handleAddHolding = () => {
    if (!newTicker.trim()) return;
    const w = parseFloat(newWeight) || 0.1;
    setHoldings([...holdings, { ticker: newTicker.trim().toUpperCase(), weight: w }]);
    setNewTicker("");
    setNewWeight("");
  };

  const handleRemoveHolding = (index: number) => {
    setHoldings(holdings.filter((_, idx) => idx !== index));
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split("\n");
    const parsed: Holding[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 1 && parts[0]) {
        const t = parts[0].toUpperCase();
        const w = parts.length > 1 ? parseFloat(parts[1]) || 0.1 : 0.1;
        parsed.push({ ticker: t, weight: w });
      }
    }
    if (parsed.length > 0) {
      setHoldings(parsed);
      setShowCsvBox(false);
      setCsvText("");
    }
  };

  const handleSave = () => {
    onSaveProfile({
      risk_tolerance: tolerance,
      horizon_months: horizonMonths,
      market,
      currency,
      max_position_size: profile.max_position_size,
      holdings
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getBudgetText = () => {
    switch (tolerance) {
      case 1:
        return "CONSERVATIVE CAPITAL PRESERVATION: High lambda penalty (3.5x CVaR). Strict volatility ceiling at 18.0% and daily CVaR ceiling at 8.0%. Assets exceeding this budget will be filtered as OUTSIDE YOUR RISK BUDGET.";
      case 2:
        return "MODERATE CONSERVATIVE: Lambda penalty (2.5x CVaR). Annual volatility ceiling at 24.0% and daily CVaR at 12.0%. Prioritizes low-drawdown quality assets.";
      case 3:
        return "BALANCED GROWTH: Balanced lambda penalty (1.8x CVaR). Annual volatility ceiling at 32.0% and daily CVaR at 18.0%. Balances upside momentum with tail risk mitigation.";
      case 4:
        return "AGGRESSIVE GROWTH: Reduced lambda penalty (1.2x CVaR). Volatility ceiling relaxed to 42.0% and daily CVaR to 25.0%. Focuses on high-beta growth opportunities.";
      case 5:
        return "MAXIMUM SPECULATIVE: Minimal lambda penalty (0.7x CVaR). Volatility ceiling up to 65.0% and daily CVaR to 40.0%. Accepts extreme tail volatility.";
      default:
        return "";
    }
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <span className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
            STAGE 6 PARAMETER SPECIFICATION
          </span>
          <h2 style={{ fontSize: "48px", margin: "4px 0 0 0" }}>USER PROFILE & RISK BUDGET</h2>
        </div>

        {saveSuccess && (
          <div className="tag tag-gain" style={{ fontSize: "12px", padding: "6px 12px" }}>
            PROFILE SAVED AND ACTIVE
          </div>
        )}
      </div>

      {/* Plain Language Live Summary Box */}
      <div className="inverted" style={{ border: "2px solid var(--ink)", padding: "20px 24px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span className="mono" style={{ fontSize: "12px", color: "var(--signal)", fontWeight: 800 }}>
            CURRENT RISK BUDGET SPECIFICATION
          </span>
          <span className="headline" style={{ fontSize: "32px", color: "var(--paper)" }}>
            LEVEL {tolerance} / 5
          </span>
        </div>
        <p style={{ fontSize: "16px", lineHeight: "1.5", color: "var(--paper)", margin: 0 }}>
          {getBudgetText()}
        </p>
      </div>

      {/* Grid: Quiz vs Portfolio Holdings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        {/* Left Column: 5-Question Quiz & Horizon */}
        <div>
          <h3 style={{ fontSize: "22px", borderBottom: "2px solid var(--ink)", paddingBottom: "8px", marginBottom: "18px" }}>
            5-QUESTION RISK PROFILE QUIZ
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {QUIZ_QUESTIONS.map((q) => (
              <div key={q.id} style={{ border: "1px solid var(--ink)", padding: "14px 16px", backgroundColor: "var(--paper)" }}>
                <div className="mono" style={{ fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
                  {q.question}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {q.options.map((opt) => {
                    const isSelected = quizAnswers[q.id] === opt.points;
                    return (
                      <button
                        key={opt.points}
                        type="button"
                        onClick={() => handleSelectQuiz(q.id, opt.points)}
                        className={isSelected ? "btn-inverted" : ""}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          fontSize: "12px",
                          justifyContent: "flex-start",
                          fontWeight: isSelected ? 800 : 500,
                          lineHeight: 1.3
                        }}
                      >
                        <span style={{ color: isSelected ? "var(--signal)" : "inherit", marginRight: "6px" }}>
                          [{opt.points}]
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Tolerance Slider Override */}
          <div style={{ marginTop: "20px", border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <span className="mono" style={{ fontSize: "12px", fontWeight: 800 }}>
                RISK TOLERANCE SLIDER OVERRIDE:
              </span>
              <span className="headline" style={{ fontSize: "28px", color: "var(--signal)" }}>
                {tolerance}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "var(--ink)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }} className="mono">
              <span style={{ fontSize: "10px" }}>1: MIN LOSS</span>
              <span style={{ fontSize: "10px" }}>3: BALANCED</span>
              <span style={{ fontSize: "10px" }}>5: MAX RISK</span>
            </div>
          </div>

          {/* Horizon Slider */}
          <div style={{ marginTop: "16px", border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <span className="mono" style={{ fontSize: "12px", fontWeight: 800 }}>
                INVESTMENT HORIZON:
              </span>
              <span className="headline" style={{ fontSize: "28px", color: "var(--ink)" }}>
                {horizonMonths} {horizonMonths === 1 ? "MONTH" : "MONTHS"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizonMonths(m)}
                  className={horizonMonths === m ? "btn-inverted" : ""}
                  style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                >
                  {m}M ({m * 21}D)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Holdings Editor */}
        <div>
          <h3 style={{ fontSize: "22px", borderBottom: "2px solid var(--ink)", paddingBottom: "8px", marginBottom: "18px" }}>
            PORTFOLIO HOLDINGS EDITOR
          </h3>

          <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="TICKER (e.g. AAPL or TCS.NS)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                type="number"
                placeholder="WEIGHT (e.g. 0.25)"
                step="0.05"
                min="0.01"
                max="1.0"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={handleAddHolding} className="btn-inverted" style={{ padding: "0 14px" }}>
                ADD
              </button>
            </div>

            <button
              onClick={() => setShowCsvBox(!showCsvBox)}
              style={{ width: "100%", padding: "6px", fontSize: "11px" }}
            >
              {showCsvBox ? "CLOSE CSV IMPORTER ▲" : "PASTE CSV (TICKER, WEIGHT) ▼"}
            </button>

            {showCsvBox && (
              <div style={{ marginTop: "10px" }}>
                <textarea
                  rows={4}
                  placeholder="AAPL, 0.40&#10;MSFT, 0.35&#10;NVDA, 0.25"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  style={{ marginBottom: "8px" }}
                />
                <button onClick={handleParseCsv} className="btn-inverted" style={{ width: "100%", padding: "8px" }}>
                  IMPORT CSV HOLDINGS
                </button>
              </div>
            )}
          </div>

          {/* Holdings Ledger Table */}
          <div style={{ border: "2px solid var(--ink)", overflowX: "auto", marginBottom: "20px" }}>
            <table className="ledger">
              <thead>
                <tr>
                  <th>TICKER</th>
                  <th className="text-right">WEIGHT</th>
                  <th className="text-right">PCT</th>
                  <th className="text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="mono" style={{ textAlign: "center", padding: "20px", color: "var(--mute)" }}>
                      NO HOLDINGS ENTERED (STANDALONE ASSET MODE)
                    </td>
                  </tr>
                ) : (
                  holdings.map((h, idx) => (
                    <tr key={idx}>
                      <td className="mono" style={{ fontWeight: 800 }}>
                        {h.ticker}
                      </td>
                      <td className="text-right mono">{h.weight.toFixed(2)}</td>
                      <td className="text-right mono">{(h.weight * 100).toFixed(0)}%</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleRemoveHolding(idx)}
                          style={{
                            padding: "2px 6px",
                            fontSize: "10px",
                            border: "1px solid var(--signal)",
                            color: "var(--signal)",
                            backgroundColor: "transparent"
                          }}
                        >
                          REMOVE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Market & Currency Toggles */}
          <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)", marginBottom: "24px" }}>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
              ACTIVE MARKET SELECTION:
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {(["US", "IN", "BOTH"] as Market[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={market === m ? "btn-inverted" : ""}
                  style={{ flex: 1, padding: "8px", fontSize: "11px" }}
                >
                  {m === "IN" ? "INDIA (NSE)" : m === "US" ? "US (S&P)" : "BOTH MARKETS"}
                </button>
              ))}
            </div>

            <div className="mono" style={{ fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
              BASE CURRENCY:
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["USD", "INR"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={currency === c ? "btn-inverted" : ""}
                  style={{ flex: 1, padding: "8px", fontSize: "11px" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Save Profile Button */}
          <button
            onClick={handleSave}
            className="btn-inverted"
            style={{ width: "100%", padding: "16px", fontSize: "15px", fontWeight: 800 }}
          >
            CONFIRM & RE-CALCULATE OPPORTUNITY SCORES →
          </button>
        </div>
      </div>
    </div>
  );
};
