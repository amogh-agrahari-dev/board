import React, { useEffect, useState } from "react";
import { fetchMethod } from "../api/client";

export const MethodView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchMethod()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="inverted" style={{ padding: "30px", border: "2px solid var(--ink)", display: "inline-block" }}>
          <div className="headline" style={{ fontSize: "20px", color: "var(--signal)" }}>
            RETRIEVING METHOD & LITERATURE SURVEY SPECIFICATIONS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px", maxWidth: "1280px" }}>
      {/* Header */}
      <div style={{ borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "28px" }}>
        <span className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
          LITERATURE SURVEY TRANSLATION SPECIFICATION
        </span>
        <h2 style={{ fontSize: "48px", margin: "4px 0 8px 0" }}>
          METHOD & RESEARCH ARCHITECTURE
        </h2>
        <p style={{ fontSize: "18px", color: "var(--ink)", maxWidth: "860px" }}>
          Full algorithmic translation of Section 10 (Proposed Research Direction) from:
          <em> "Machine Learning for Investment Opportunity Identification: A Literature Survey on Historical Trends, Current Information, and Risk-Aware Prediction"</em>.
        </p>
      </div>

      {/* 6-Stage Pipeline Ruled Box */}
      <div style={{ border: "2px solid var(--ink)", padding: "24px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <div style={{ borderBottom: "2px solid var(--ink)", paddingBottom: "10px", marginBottom: "18px" }}>
          <h3 style={{ fontSize: "24px", margin: 0 }}>THE 6-STAGE PIPELINE</h3>
          <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            PIPELINE SPINE AS DEFINED IN SURVEY SECTION 10
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {data.pipeline_stages.map((st: any) => (
            <div
              key={st.stage}
              style={{
                border: "1px solid var(--ink)",
                padding: "16px",
                backgroundColor: "#E2DDD0"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span className="tag tag-inverted" style={{ fontSize: "11px" }}>
                  STAGE 0{st.stage}
                </span>
              </div>
              <h4 style={{ fontSize: "17px", fontFamily: "var(--font-headline)", marginBottom: "6px" }}>
                {st.name}
              </h4>
              <p style={{ fontSize: "14px", lineHeight: "1.45", margin: 0, color: "var(--ink)" }}>
                {st.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div style={{ border: "2px solid var(--ink)", padding: "24px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <h3 style={{ fontSize: "24px", borderBottom: "2px solid var(--ink)", paddingBottom: "10px", marginBottom: "18px" }}>
          GOVERNING MATHEMATICAL EQUATIONS
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ border: "1px solid var(--ink)", padding: "14px 18px", backgroundColor: "#E5E0D4" }}>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--signal)", marginBottom: "4px" }}>
              1. RISK-ADJUSTED OPPORTUNITY SCORE FORMULA
            </div>
            <pre className="mono" style={{ fontSize: "13px", margin: "6px 0", whiteSpace: "pre-wrap" }}>
              {data.formulas.opportunity_score}
            </pre>
            <p style={{ fontSize: "14px", margin: "4px 0 0 0" }}>
              Expected return μ is shrunk toward 0 by validated confidence factor. Raw score subtracts downside CVaR loss multiplied by user risk tolerance lambda λ (conservative = 3.5, aggressive = 0.7). Percentile ranked within universe to 0-100.
            </p>
          </div>

          <div style={{ border: "1px solid var(--ink)", padding: "14px 18px", backgroundColor: "#E5E0D4" }}>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--signal)", marginBottom: "4px" }}>
              2. FUZZY DEFUZZIFICATION RISK ENGINE (PAPER [4])
            </div>
            <pre className="mono" style={{ fontSize: "13px", margin: "6px 0", whiteSpace: "pre-wrap" }}>
              {data.formulas.fuzzy_defuzzification}
            </pre>
            <p style={{ fontSize: "14px", margin: "4px 0 0 0" }}>
              27 expert rules evaluated via Mamdani min-operator across 3 inputs (volatility percentile, trend/drawdown weakness, macro-or-news stress) with triangular memberships. Defuzzified into 0-100 continuous vulnerability index.
            </p>
          </div>

          <div style={{ border: "1px solid var(--ink)", padding: "14px 18px", backgroundColor: "#E5E0D4" }}>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--signal)", marginBottom: "4px" }}>
              3. MARGINAL PORTFOLIO VALUE AT RISK (MPT DIVERSIFICATION)
            </div>
            <pre className="mono" style={{ fontSize: "13px", margin: "6px 0", whiteSpace: "pre-wrap" }}>
              {data.formulas.marginal_var}
            </pre>
          </div>
        </div>
      </div>

      {/* Survey Literature Mapping [1]-[10] */}
      <div style={{ border: "2px solid var(--ink)", padding: "24px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <h3 style={{ fontSize: "24px", borderBottom: "2px solid var(--ink)", paddingBottom: "10px", marginBottom: "18px" }}>
          LITERATURE SURVEY FOUNDATIONS [1] – [10]
        </h3>

        <table className="ledger">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>CITATION & TOPIC</th>
              <th>EXACT ROLE & IMPLEMENTATION IN BOARD</th>
            </tr>
          </thead>
          <tbody>
            {data.literature_survey_mapping.map((m: any) => (
              <tr key={m.id}>
                <td className="mono" style={{ fontWeight: 800, color: "var(--signal)" }}>{m.id}</td>
                <td>
                  <strong>{m.authors}</strong>
                  <div style={{ fontSize: "13px", fontStyle: "italic", opacity: 0.85 }}>{m.topic}</div>
                </td>
                <td style={{ fontSize: "14px" }}>{m.role_in_board}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Research Gaps: Addressed vs Open */}
      <div style={{ border: "2px solid var(--ink)", padding: "24px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <h3 style={{ fontSize: "24px", borderBottom: "2px solid var(--ink)", paddingBottom: "10px", marginBottom: "18px" }}>
          LITERATURE SURVEY RESEARCH GAPS IN BOARD
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {data.research_gaps.map((g: any, idx: number) => {
            const isAddressed = g.status_in_board.startsWith("ADDRESSED");
            return (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--ink)",
                  padding: "14px",
                  backgroundColor: isAddressed ? "#E4E0D5" : "#FAECEB"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <h4 style={{ fontSize: "16px", margin: 0, fontFamily: "var(--font-headline)" }}>
                    {g.gap}
                  </h4>
                  <span className={`tag ${isAddressed ? "tag-gain" : "tag-signal"}`} style={{ fontSize: "10px" }}>
                    {isAddressed ? "ADDRESSED" : "FUTURE"}
                  </span>
                </div>
                <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                  {g.status_in_board}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Future Scope Disclosures: Real Estate, Microgrids, Bonds */}
      <div style={{ border: "2px solid var(--ink)", padding: "20px", backgroundColor: "var(--paper)" }}>
        <div className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mute)", marginBottom: "4px" }}>
          SCOPE DISCLOSURE: FUTURE WORK
        </div>
        <p style={{ fontSize: "15px", margin: 0 }}>
          The literature survey reviewed asset classes beyond listed equities and ETFs, including commercial real estate, distributed microgrids, and corporate bonds. These sectors are out of scope for Version 1.0 of BOARD and are cataloged as future research directions due to private liquidity constraints and specialized valuation mechanics.
        </p>
      </div>
    </div>
  );
};
