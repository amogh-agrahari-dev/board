import React from "react";

interface SvgHeatGridProps {
  tickers: string[];
  matrix: number[][];
}

export const SvgHeatGrid: React.FC<SvgHeatGridProps> = ({ tickers, matrix }) => {
  if (!tickers || tickers.length === 0 || !matrix || matrix.length === 0) {
    return <div className="mono" style={{ padding: "20px" }}>NO HOLDINGS FOR CORRELATION MATRIX</div>;
  }

  const cellSize = Math.min(54, Math.floor(480 / tickers.length));
  const n = tickers.length;

  const getSteppedColor = (val: number): { bg: string; text: string } => {
    if (val >= 0.75) return { bg: "var(--signal)", text: "var(--paper)" };
    if (val >= 0.50) return { bg: "#EE8073", text: "var(--ink)" };
    if (val >= 0.25) return { bg: "#D5CEBC", text: "var(--ink)" };
    return { bg: "var(--paper)", text: "var(--ink)" };
  };

  return (
    <div style={{ border: "2px solid var(--ink)", padding: "18px 20px", backgroundColor: "var(--paper)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "20px", margin: 0 }}>PAIRWISE CORRELATION HEAT-GRID</h3>
        <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
          STEPPED TINT BANDS (NO GRADIENTS)
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
          <thead>
            <tr>
              <th style={{ width: cellSize, height: 28 }}></th>
              {tickers.map((t) => (
                <th
                  key={t}
                  className="mono"
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    width: cellSize,
                    textAlign: "center",
                    padding: "4px"
                  }}
                >
                  {t.replace(".NS", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx}>
                <td
                  className="mono"
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textAlign: "right",
                    paddingRight: "8px",
                    height: cellSize
                  }}
                >
                  {tickers[rIdx]?.replace(".NS", "")}
                </td>
                {row.map((val, cIdx) => {
                  const style = getSteppedColor(val);
                  return (
                    <td
                      key={cIdx}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: style.bg,
                        color: style.text,
                        border: "1px solid var(--ink)",
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700
                      }}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stepped Band Legend */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "16px", height: "16px", backgroundColor: "var(--paper)", border: "1px solid var(--ink)" }} />
          <span className="mono" style={{ fontSize: "10px" }}>0.00 – 0.24 (LOW)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "16px", height: "16px", backgroundColor: "#D5CEBC", border: "1px solid var(--ink)" }} />
          <span className="mono" style={{ fontSize: "10px" }}>0.25 – 0.49 (MODERATE)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "16px", height: "16px", backgroundColor: "#EE8073", border: "1px solid var(--ink)" }} />
          <span className="mono" style={{ fontSize: "10px" }}>0.50 – 0.74 (ELEVATED)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "16px", height: "16px", backgroundColor: "var(--signal)", border: "1px solid var(--ink)" }} />
          <span className="mono" style={{ fontSize: "10px" }}>0.75 – 1.00 (HIGH REDUNDANCY)</span>
        </div>
      </div>
    </div>
  );
};
