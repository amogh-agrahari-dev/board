import React from "react";

interface SvgLagChartProps {
  lagProfile: {
    status: string;
    chosen_lag: number;
    best_correlation: number;
    profile: Array<{ lag: number; strength: number; p_value: number }>;
    usable_for_model: boolean;
  };
}

export const SvgLagChart: React.FC<SvgLagChartProps> = ({ lagProfile }) => {
  const width = 360;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const profile = lagProfile.profile || [
    { lag: 0, strength: 0, p_value: 1 },
    { lag: 1, strength: 0, p_value: 1 },
    { lag: 2, strength: 0, p_value: 1 },
    { lag: 3, strength: 0, p_value: 1 }
  ];

  const maxVal = Math.max(0.15, ...profile.map((p) => Math.abs(p.strength)));

  return (
    <div style={{ border: "2px solid var(--ink)", padding: "16px", backgroundColor: "var(--paper)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "8px", marginBottom: "10px" }}>
        <span className="mono" style={{ fontSize: "12px", fontWeight: 800 }}>
          LEARNED NEWS PUBLICATION LAG
        </span>
        <span
          className={`tag ${lagProfile.usable_for_model ? "tag-inverted" : "tag-signal"}`}
          style={{ fontSize: "10px" }}
        >
          {lagProfile.status}
        </span>
      </div>

      <p style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "12px", color: "var(--ink)" }}>
        Measures cross-correlation between lagged FinBERT headline sentiment and next-day asset return across lags 0 to 3 trading days (Paper Section 10).
      </p>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Zero Axis */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight / 2}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight / 2}
          stroke="var(--ink)"
          strokeWidth="1.5"
        />

        {/* Bars for lags 0, 1, 2, 3 */}
        {profile.map((p, idx) => {
          const barWidth = 42;
          const slotWidth = plotWidth / profile.length;
          const x = padding.left + idx * slotWidth + (slotWidth - barWidth) / 2;
          
          const barHeight = (Math.abs(p.strength) / maxVal) * (plotHeight / 2);
          const isChosen = p.lag === lagProfile.chosen_lag && lagProfile.usable_for_model;
          const isPositive = p.strength >= 0;
          const y = isPositive ? padding.top + plotHeight / 2 - barHeight : padding.top + plotHeight / 2;

          return (
            <g key={p.lag}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                fill={isChosen ? "var(--ink)" : "#C5BFB0"}
                stroke="var(--ink)"
                strokeWidth={isChosen ? "2" : "1"}
              />

              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={isPositive ? y - 4 : y + barHeight + 12}
                fontFamily="var(--font-mono)"
                fontSize="10"
                fontWeight={isChosen ? "800" : "500"}
                fill="var(--ink)"
                textAnchor="middle"
              >
                {p.strength > 0 ? `+${p.strength.toFixed(3)}` : p.strength.toFixed(3)}
              </text>

              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + plotHeight + 18}
                fontFamily="var(--font-mono)"
                fontSize="11"
                fontWeight={isChosen ? "800" : "600"}
                fill={isChosen ? "var(--signal)" : "var(--ink)"}
                textAnchor="middle"
              >
                LAG {p.lag}D
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
