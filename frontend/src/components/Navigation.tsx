import React from "react";

interface NavigationProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isSampleData: boolean;
  asOf: string;
  refreshing: boolean;
  refreshProgress: string;
  onTriggerRefresh: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  isSampleData,
  asOf,
  refreshing,
  refreshProgress,
  onTriggerRefresh
}) => {
  const navItems = [
    { id: "board", label: "THE BOARD" },
    { id: "profile", label: "PROFILE" },
    { id: "portfolio", label: "PORTFOLIO FIT" },
    { id: "validation", label: "VALIDATION LAB" },
    { id: "method", label: "METHOD" }
  ];

  return (
    <aside className="sticky-rail" aria-label="Main Navigation">
      <div>
        {/* Brand Masthead */}
        <div style={{ padding: "20px 18px", borderBottom: "2px solid var(--ink)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: "38px", margin: 0, letterSpacing: "-0.05em" }}>BOARD</h1>
            <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>V1.0.0</span>
          </div>
          <p className="mono" style={{ fontSize: "10px", color: "var(--mute)", marginTop: "4px" }}>
            INVESTMENT-OPPORTUNITY ENGINE
          </p>
        </div>

        {/* Data Status Strip */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--ink)", backgroundColor: isSampleData ? "#FAECEB" : "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>DATA STATUS:</span>
            {isSampleData ? (
              <span className="tag tag-signal">SAMPLE DATA</span>
            ) : (
              <span className="tag tag-gain">LIVE MARKET</span>
            )}
          </div>
          <div className="mono" style={{ fontSize: "10px", color: "var(--mute)", marginTop: "6px" }}>
            AS-OF: {asOf ? asOf.slice(0, 16).replace("T", " ") : "2026-10-27"}
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={isActive ? "btn-inverted" : ""}
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--ink)",
                  padding: "16px 18px",
                  textAlign: "left",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: 800,
                  boxShadow: "none !important",
                  transform: "none !important"
                }}
              >
                <span>{item.label}</span>
                {isActive && <span style={{ color: "var(--signal)", fontSize: "18px" }}>■</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pipeline Refresh Action */}
      <div style={{ padding: "18px", borderTop: "2px solid var(--ink)" }}>
        {refreshing ? (
          <div className="inverted" style={{ padding: "12px", border: "2px solid var(--ink)" }}>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--signal)" }}>
              EXECUTING PIPELINE
            </div>
            <div className="mono" style={{ fontSize: "10px", marginTop: "6px", color: "var(--paper)" }}>
              {refreshProgress || "TRAINING LSTM ... FOLD 2/4"}
            </div>
          </div>
        ) : (
          <button
            onClick={onTriggerRefresh}
            style={{ width: "100%", padding: "12px 14px", fontSize: "12px" }}
          >
            <span>REFRESH PIPELINE</span>
            <span style={{ color: "var(--signal)" }}>→</span>
          </button>
        )}
      </div>
    </aside>
  );
};
