import React from "react";

interface GateModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export const GateModal: React.FC<GateModalProps> = ({ isOpen, onAcknowledge }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(17, 17, 16, 0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          backgroundColor: "var(--paper)",
          border: "4px solid var(--ink)",
          maxWidth: "680px",
          width: "100%",
          padding: "36px 32px"
        }}
      >
        <div style={{ borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "20px" }}>
          <div className="tag tag-signal" style={{ marginBottom: "12px", fontSize: "12px" }}>
            MANDATORY FIRST-RUN ACKNOWLEDGEMENT
          </div>
          <h2 style={{ fontSize: "52px", lineHeight: "0.9", margin: "8px 0" }}>
            MODELS CAN BE WRONG.
          </h2>
        </div>

        <div style={{ fontSize: "18px", lineHeight: "1.6", marginBottom: "24px", color: "var(--ink)" }}>
          <p style={{ marginBottom: "14px" }}>
            <strong>BOARD</strong> is a probabilistic decision-support tool built strictly on empirical research
            (<em>"Machine Learning for Investment Opportunity Identification"</em>).
          </p>
          <p style={{ marginBottom: "14px" }}>
            No statistical or machine learning forecasting model removes financial market uncertainty.
            The goal of this system is <strong>better-supported decisions</strong> rather than guaranteed returns.
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "18px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            <li style={{ marginBottom: "8px" }}>All forecasts are ranges with stated confidence, never price targets.</li>
            <li style={{ marginBottom: "8px" }}>If an asset shows no out-of-sample edge over random walk, BOARD reports <strong>NO RELIABLE EDGE</strong>.</li>
            <li>This software does not provide financial advice or automated execution.</li>
          </ul>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onAcknowledge}
            className="btn-inverted"
            style={{ fontSize: "15px", padding: "14px 28px", fontWeight: 800 }}
          >
            I UNDERSTAND AND ACKNOWLEDGE → PROCEED TO BOARD
          </button>
        </div>
      </div>
    </div>
  );
};
