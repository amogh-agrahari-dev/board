import React from "react";
import { ShapDriver } from "../types";

interface SvgShapBarsProps {
  drivers: ShapDriver[];
}

export const SvgShapBars: React.FC<SvgShapBarsProps> = ({ drivers }) => {
  if (!drivers || drivers.length === 0) {
    return <div className="mono" style={{ padding: "16px" }}>NO SHAP ATTRIBUTION DATA AVAILABLE</div>;
  }

  const maxVal = Math.max(0.01, ...drivers.map((d) => Math.abs(d.shap_value)));

  return (
    <div style={{ border: "2px solid var(--ink)", padding: "18px 20px", backgroundColor: "var(--paper)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "20px", margin: 0 }}>WHY: KEY STATISTICAL DRIVERS (SHAP)</h3>
        <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
          RED = ELEVATES RISK | GREEN = CUSHIONS RISK
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {drivers.slice(0, 5).map((d, idx) => {
          const isRiskUp = d.direction === "RISK_UP";
          const barPct = Math.min(100, (Math.abs(d.shap_value) / maxVal) * 100);

          return (
            <div key={idx}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                <span className="mono" style={{ fontSize: "12px", fontWeight: 700 }}>
                  {d.label}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: isRiskUp ? "var(--signal)" : "var(--gain)"
                  }}
                >
                  {isRiskUp ? `+${d.shap_value.toFixed(4)}` : `${d.shap_value.toFixed(4)}`}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: "10px", border: "1px solid var(--ink)", backgroundColor: "#DDD7C8", position: "relative" }}>
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    backgroundColor: isRiskUp ? "var(--signal)" : "var(--gain)"
                  }}
                />
              </div>

              <div style={{ fontSize: "13px", color: "var(--ink)", marginTop: "3px" }}>
                {d.plain_text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
