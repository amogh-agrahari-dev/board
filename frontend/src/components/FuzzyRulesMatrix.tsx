import React, { useState } from "react";
import { FuzzyRuleFired } from "../types";

interface FuzzyRulesMatrixProps {
  score: number;
  firedRules?: FuzzyRuleFired[];
  showAllRulesModal?: boolean;
}

export const FuzzyRulesMatrix: React.FC<FuzzyRulesMatrixProps> = ({
  score,
  firedRules = []
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
        <div>
          <h3 style={{ fontSize: "20px", margin: 0 }}>FUZZY LOGIC EXPERT RISK ENGINE</h3>
          <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            PAPER [4] EXPERT SYSTEMS: 27 RULES (3x3x3 TRIANGULAR DEFUZZIFICATION)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span className="headline" style={{ fontSize: "36px", color: "var(--signal)" }}>
            {score.toFixed(1)}
          </span>
          <span className="mono" style={{ fontSize: "13px" }}>/100</span>
        </div>
      </div>

      <div style={{ marginBottom: "14px", fontSize: "14px" }}>
        Active Expert Rules Fired for Current Asset State:
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        {firedRules.map((r) => (
          <div
            key={r.rule_id}
            style={{
              border: "1px solid var(--ink)",
              padding: "8px 12px",
              backgroundColor: "#E2DDD0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="tag tag-inverted" style={{ fontSize: "10px" }}>
                RULE #{r.rule_id}
              </span>
              <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>
                IF Vol={r.vol} AND Weakness={r.weakness} AND Stress={r.stress}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="mono" style={{ fontSize: "11px", color: "var(--signal)", fontWeight: 800 }}>
                → {r.consequent} ({r.rule_score})
              </span>
              <span className="tag tag-gain" style={{ fontSize: "10px" }}>
                WEIGHT: {r.weight.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", padding: "8px", fontSize: "11px" }}
      >
        {expanded ? "HIDE FORMULA SPECS ▲" : "SHOW FUZZY MEMBERSHIP & DEFUZZIFICATION SPECS ▼"}
      </button>

      {expanded && (
        <div style={{ marginTop: "14px", borderTop: "1px solid var(--ink)", paddingTop: "12px", fontSize: "13px" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Triangular Membership Functions:</strong> LOW: (0.0, 0.0, 0.5), MEDIUM: (0.2, 0.5, 0.8), HIGH: (0.5, 1.0, 1.0).
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", backgroundColor: "#D8D2C2", padding: "8px", border: "1px solid var(--ink)" }}>
            Composite Risk Score = [ Σ (weight_i * centroid_score_i) ] / [ Σ weight_i ]
          </p>
        </div>
      )}
    </div>
  );
};
