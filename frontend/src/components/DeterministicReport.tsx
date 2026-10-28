import React, { useState } from "react";

interface DeterministicReportProps {
  report: {
    verdict_headline: string;
    sections: Array<{ title: string; body: string }>;
    raw_numbers: Record<string, any>;
  };
}

export const DeterministicReport: React.FC<DeterministicReportProps> = ({ report }) => {
  const [showRawNumbers, setShowRawNumbers] = useState(false);

  if (!report) return null;

  return (
    <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--ink)", paddingBottom: "12px", marginBottom: "18px" }}>
        <div>
          <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>EXPLAINABLE AUDIT TRAIL</span>
          <h3 style={{ fontSize: "26px", margin: "4px 0 0 0" }}>DECISION-SUPPORT VERDICT & EVIDENCE</h3>
        </div>
        <span className="tag tag-inverted" style={{ fontSize: "12px" }}>
          DETERMINISTIC ENGINE
        </span>
      </div>

      {/* Report Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "22px" }}>
        {report.sections.map((sec, idx) => (
          <div key={idx}>
            <h4 style={{ fontSize: "15px", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)", marginBottom: "4px" }}>
              {sec.title}
            </h4>
            <p style={{ fontSize: "17px", lineHeight: "1.6", color: "var(--ink)" }}>
              {sec.body}
            </p>
          </div>
        ))}
      </div>

      {/* Expandable 'Numbers this text was built from' */}
      <div style={{ borderTop: "1px solid var(--ink)", paddingTop: "14px" }}>
        <button
          onClick={() => setShowRawNumbers(!showRawNumbers)}
          style={{ width: "100%", padding: "10px", fontSize: "12px", justifyContent: "space-between" }}
        >
          <span>{showRawNumbers ? "HIDE AUDITABLE COMPONENT METRICS ▲" : "EXPAND: NUMBERS THIS TEXT WAS BUILT FROM ▼"}</span>
          <span className="mono" style={{ color: "var(--signal)" }}>AUDIT READY</span>
        </button>

        {showRawNumbers && (
          <div
            style={{
              marginTop: "12px",
              backgroundColor: "var(--ink)",
              color: "var(--paper)",
              padding: "16px",
              border: "1px solid var(--ink)",
              overflowX: "auto"
            }}
          >
            <pre className="mono" style={{ fontSize: "12px", lineHeight: "1.5", margin: 0 }}>
              {JSON.stringify(report.raw_numbers, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
