import React from "react";

interface ScoreBadgeProps {
  score: number;
  actionLabel: string;
  size?: "large" | "medium" | "compact";
  tier?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  actionLabel,
  size = "medium",
  tier
}) => {
  const getActionClass = () => {
    switch (actionLabel) {
      case "CANDIDATE":
        return "tag-gain";
      case "WATCH":
        return "tag-inverted";
      case "NO RELIABLE EDGE":
        return "tag-mute";
      case "OUTSIDE YOUR RISK BUDGET":
      case "AVOID":
        return "tag-signal";
      default:
        return "tag-mute";
    }
  };

  const isLarge = size === "large";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span
          className="headline"
          style={{
            fontSize: isLarge ? "96px" : size === "medium" ? "48px" : "28px",
            lineHeight: 0.85,
            color: "var(--signal)",
            letterSpacing: "-0.05em"
          }}
        >
          {score.toFixed(1)}
        </span>
        <span className="mono" style={{ fontSize: isLarge ? "20px" : "13px", color: "var(--mute)", fontWeight: 700 }}>
          /100
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <span className={`tag ${getActionClass()}`} style={{ fontSize: isLarge ? "13px" : "10px", padding: isLarge ? "4px 8px" : "2px 6px" }}>
          {actionLabel}
        </span>
        {tier && (
          <span className="tag" style={{ fontSize: isLarge ? "13px" : "10px" }}>
            TIER: {tier}
          </span>
        )}
      </div>
    </div>
  );
};
