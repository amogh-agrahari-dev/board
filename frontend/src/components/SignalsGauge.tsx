import React from "react";

interface SignalsGaugeProps {
  signals: {
    technical: number;
    sentiment: number;
    macro: number;
    model: number;
  };
  weights: {
    technical: number;
    sentiment: number;
    macro: number;
    model: number;
  };
  hasConflict: boolean;
  conflictDetails?: string;
  confidence: number;
  excludedSources?: Record<string, { kept: boolean; reason: string }>;
}

export const SignalsGauge: React.FC<SignalsGaugeProps> = ({
  signals,
  weights,
  hasConflict,
  conflictDetails,
  confidence,
  excludedSources = {}
}) => {
  const sources = [
    { id: "technical", label: "PRICE TECHNICALS", val: signals.technical, weight: weights.technical },
    { id: "sentiment", label: "NEWS SENTIMENT (LAG-ADJUSTED)", val: signals.sentiment, weight: weights.sentiment },
    { id: "macro", label: "MACRO REGIME PROXIES", val: signals.macro, weight: weights.macro },
    { id: "model", label: "ML PREDICTION MODEL", val: signals.model, weight: weights.model }
  ];

  return (
    <div style={{ border: "2px solid var(--ink)", padding: "18px 20px", backgroundColor: "var(--paper)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "20px", margin: 0 }}>4-SOURCE SIGNAL INTEGRATION</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasConflict && (
            <span className="tag tag-signal" style={{ fontWeight: 800 }}>
              CONFLICT DETECTED
            </span>
          )}
          <span className="mono" style={{ fontSize: "11px" }}>
            COMPOSITE CONFIDENCE: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {hasConflict && conflictDetails && (
        <div style={{ backgroundColor: "#FAECEB", border: "1px solid var(--signal)", padding: "10px 12px", marginBottom: "14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--signal)" }}>
          <strong>SIGNAL CONFLICT:</strong> {conflictDetails}. The model automatically discounted overall opportunity confidence by 40%.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {sources.map((src) => {
          const isExcluded = excludedSources[src.id.toUpperCase()]?.kept === false;
          const exclusionReason = excludedSources[src.id.toUpperCase()]?.reason;
          
          // Normalized gauge [-1, +1] -> 0% to 100% with center at 50%
          const pct = ((src.val + 1.0) / 2.0) * 100;
          const isPositive = src.val > 0;

          return (
            <div key={src.id} style={{ opacity: isExcluded ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span className="mono" style={{ fontSize: "12px", fontWeight: 700, textDecoration: isExcluded ? "line-through" : "none" }}>
                  {src.label}
                </span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
                    WEIGHT: {(src.weight * 100).toFixed(0)}%
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: isExcluded ? "var(--mute)" : isPositive ? "var(--gain)" : "var(--signal)"
                    }}
                  >
                    {src.val > 0 ? `+${src.val.toFixed(2)}` : src.val.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Signed Horizontal Bar Track */}
              <div
                style={{
                  height: "12px",
                  border: "1px solid var(--ink)",
                  position: "relative",
                  backgroundColor: "#DDD7C8"
                }}
              >
                {/* Center Zero Tick */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    backgroundColor: "var(--ink)",
                    zIndex: 2
                  }}
                />

                {/* Signed fill */}
                {isPositive ? (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      width: `${(src.val / 1.0) * 50}%`,
                      top: 0,
                      bottom: 0,
                      backgroundColor: isExcluded ? "var(--mute)" : "var(--gain)"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      right: "50%",
                      width: `${(Math.abs(src.val) / 1.0) * 50}%`,
                      top: 0,
                      bottom: 0,
                      backgroundColor: isExcluded ? "var(--mute)" : "var(--signal)"
                    }}
                  />
                )}
              </div>

              {isExcluded && exclusionReason && (
                <div className="mono" style={{ fontSize: "10px", color: "var(--signal)", marginTop: "3px" }}>
                  {exclusionReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
