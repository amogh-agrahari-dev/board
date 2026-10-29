import React, { useState } from "react";
import { ScreenAsset, UserProfile, Market } from "../types";
import { ScoreBadge } from "../components/ScoreBadge";
import { checkTicker } from "../api/client";
import { formatRange } from "../utils/format";

interface BoardViewProps {
  assets: ScreenAsset[];
  loading: boolean;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSelectAsset: (ticker: string) => void;
  asOf: string;
  isSample: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({
  assets,
  loading,
  profile,
  onUpdateProfile,
  onSelectAsset,
  asOf,
  isSample
}) => {
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<keyof ScreenAsset>("opportunity_score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Custom asset search & add state
  const [searchTicker, setSearchTicker] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  const handleAddCustomTicker = async (tickerToAdd?: string) => {
    const raw = (tickerToAdd || searchTicker).trim().toUpperCase();
    if (!raw) return;

    const existingCustom = profile.custom_tickers || [];
    if (existingCustom.includes(raw)) {
      setSearchError(`Ticker ${raw} is already added to your Board.`);
      return;
    }

    if (assets.some((a) => a.ticker === raw)) {
      setSearchError(`Ticker ${raw} is already active on your Board.`);
      return;
    }

    setIsVerifying(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      const info = await checkTicker(raw);
      const updated = [...existingCustom, raw];
      onUpdateProfile({ custom_tickers: updated });
      setSearchTicker("");
      setSearchSuccess(`Added ${raw} (${info.name}) to your Board! Computing full tail-risk ledger...`);
      setTimeout(() => setSearchSuccess(null), 6000);
    } catch (err: any) {
      setSearchError(err.message || `Could not find ticker "${raw}". Please verify the symbol.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveCustomTicker = (tickerToRemove: string) => {
    const existingCustom = profile.custom_tickers || [];
    const updated = existingCustom.filter((t) => t !== tickerToRemove);
    onUpdateProfile({ custom_tickers: updated });
  };

  const handleClearAllCustom = () => {
    onUpdateProfile({ custom_tickers: [] });
  };

  // Top 3 picks for the hero strip
  const topPicks = assets.slice(0, 3);

  // Filtered & sorted ledger assets
  const filteredAssets = assets.filter((a) => {
    if (tierFilter !== "ALL" && a.tier !== tierFilter) return false;
    if (actionFilter !== "ALL" && a.action_label !== actionFilter) return false;
    return true;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof ScreenAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div style={{ padding: "28px" }}>
      {/* View Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <span className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
            STAGE 5 & 6 OUTPUT LEDGER
          </span>
          <h2 style={{ fontSize: "48px", margin: "4px 0 0 0" }}>THE BOARD</h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Market selector toggles */}
          <div style={{ display: "flex", border: "2px solid var(--ink)" }}>
            {(["US", "IN", "BOTH"] as Market[]).map((m) => (
              <button
                key={m}
                onClick={() =>
                  onUpdateProfile({
                    market: m,
                    currency: m === "IN" ? "INR" : (m === "US" ? "USD" : profile.currency)
                  })
                }
                className={profile.market === m ? "btn-inverted" : ""}
                style={{
                  border: "none",
                  borderRight: m !== "BOTH" ? "1px solid var(--ink)" : "none",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 800
                }}
              >
                {m === "IN" ? "INDIA (NSE)" : m === "US" ? "US (S&P)" : "BOTH MARKETS"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Add Custom Asset Broadsheet Bar */}
      <div
        style={{
          border: "2px solid var(--ink)",
          backgroundColor: "var(--paper)",
          padding: "20px 24px",
          marginBottom: "28px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
          <div>
            <div className="mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--signal)" }}>
              LIVE ASSET RESEARCH & TICKER DISCOVERY
            </div>
            <h3 style={{ fontSize: "22px", margin: "2px 0 0 0" }}>
              RESEARCH ANY ASSET OR EXPAND THE BOARD
            </h3>
          </div>
          <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            SUPPORTS US (NYSE/NASDAQ) & INDIAN (NSE) EQUITIES
          </span>
        </div>

        {/* Input & Action Buttons Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddCustomTicker();
          }}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" }}
        >
          <div style={{ flex: "1 1 320px", display: "flex" }}>
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => {
                setSearchTicker(e.target.value.toUpperCase());
                setSearchError(null);
              }}
              placeholder={profile.market === "IN" ? "ENTER NSE SYMBOL (E.G. TATAMOTORS.NS, WIPRO.NS, MARUTI.NS)..." : "ENTER TICKER SYMBOL (E.G. META, AMD, NFLX, COIN, TATAMOTORS.NS)..."}
              className="mono"
              disabled={isVerifying}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontWeight: 700,
                border: "2px solid var(--ink)",
                borderRadius: 0,
                backgroundColor: "#F4F0E8",
                color: "var(--ink)",
                letterSpacing: "0.05em"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || !searchTicker.trim()}
            className="btn-inverted"
            style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 800 }}
          >
            {isVerifying ? "VERIFYING TICKER..." : "+ ADD TO BOARD"}
          </button>

          <button
            type="button"
            disabled={!searchTicker.trim()}
            onClick={() => onSelectAsset(searchTicker.trim().toUpperCase())}
            style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 800 }}
          >
            VIEW DOSSIER →
          </button>
        </form>

        {/* Status / Error / Success Messages */}
        {searchError && (
          <div
            className="tag tag-signal"
            style={{
              display: "block",
              marginTop: "12px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            ⚠️ {searchError}
          </div>
        )}

        {searchSuccess && (
          <div
            className="tag tag-gain"
            style={{
              display: "block",
              marginTop: "12px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            ✓ {searchSuccess}
          </div>
        )}

        {/* Suggestion Chips */}
        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: "10px", color: "var(--mute)", fontWeight: 700 }}>
            QUICK ADD:
          </span>
          {(profile.market === "IN"
            ? ["TATAMOTORS.NS", "WIPRO.NS", "MARUTI.NS", "BAJFINANCE.NS", "AXISBANK.NS"]
            : profile.market === "US"
            ? ["META", "AMD", "NFLX", "COIN", "BA", "DIS"]
            : ["META", "AMD", "NFLX", "TATAMOTORS.NS", "WIPRO.NS", "COIN"]
          ).map((preset) => {
            const alreadyPresent = assets.some((a) => a.ticker === preset) || (profile.custom_tickers || []).includes(preset);
            return (
              <button
                key={preset}
                type="button"
                disabled={alreadyPresent || isVerifying}
                onClick={() => handleAddCustomTicker(preset)}
                style={{
                  border: "1px solid var(--ink)",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: alreadyPresent ? "var(--mute)" : "var(--paper)",
                  color: alreadyPresent ? "var(--paper)" : "var(--ink)",
                  cursor: alreadyPresent ? "default" : "pointer",
                  boxShadow: "none",
                  transform: "none"
                }}
              >
                {alreadyPresent ? `✓ ${preset}` : `+ ${preset}`}
              </button>
            );
          })}
        </div>

        {/* Active Custom Tickers Strip */}
        {(profile.custom_tickers && profile.custom_tickers.length > 0) && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: "11px", fontWeight: 800 }}>
                CUSTOM ASSETS ON BOARD ({profile.custom_tickers.length}):
              </span>
              {profile.custom_tickers.map((ct) => (
                <span
                  key={ct}
                  className="tag tag-inverted"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    fontSize: "11px"
                  }}
                >
                  <strong style={{ cursor: "pointer" }} onClick={() => onSelectAsset(ct)}>
                    {ct}
                  </strong>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomTicker(ct);
                    }}
                    title={`Remove ${ct} from Board`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--signal)",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 900,
                      fontSize: "12px",
                      boxShadow: "none",
                      transform: "none"
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClearAllCustom}
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                border: "1px solid var(--signal)",
                color: "var(--signal)",
                background: "transparent",
                boxShadow: "none",
                transform: "none"
              }}
            >
              CLEAR ALL CUSTOM
            </button>
          </div>
        )}
      </div>

      {/* Hero Strip: Top 3 Picks (Inverted Block) */}
      <div style={{ marginBottom: "28px" }}>
        <div className="mono" style={{ fontSize: "11px", fontWeight: 800, marginBottom: "6px" }}>
          TOP OPPORTUNITY CANDIDATES — SHRUNK EXPECTED RETURN LESS CVAR PENALTY
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {topPicks.map((pick) => (
            <div
              key={pick.ticker}
              onClick={() => onSelectAsset(pick.ticker)}
              className="inverted"
              style={{
                border: "2px solid var(--ink)",
                padding: "20px 22px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                <div>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--signal)", fontWeight: 800 }}>
                    #{pick.rank}
                  </span>
                  <h3 style={{ fontSize: "28px", margin: "2px 0 0 0", color: "var(--paper)" }}>
                    {pick.ticker}
                  </h3>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--paper)", opacity: 0.8 }}>
                    {pick.name}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="headline" style={{ fontSize: "54px", color: "var(--signal)", lineHeight: 0.9 }}>
                    {pick.opportunity_score.toFixed(0)}
                  </span>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--paper)" }}>SCORE / 100</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(233, 228, 216, 0.3)", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--paper)", opacity: 0.7 }}>ACTION:</div>
                  <span className="tag tag-signal" style={{ fontSize: "10px" }}>{pick.action_label}</span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--paper)", opacity: 0.7 }}>P(UP) {profile.horizon_months}M:</div>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--gain)", fontWeight: 800 }}>
                    {(pick.prob_gain * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--paper)", opacity: 0.7 }}>DAILY CVAR:</div>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--signal)", fontWeight: 800 }}>
                    {(pick.cvar_95_daily * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--paper)", opacity: 0.7 }}>TIER:</div>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--paper)" }}>{pick.tier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div style={{ border: "2px solid var(--ink)", padding: "14px 18px", backgroundColor: "var(--paper)", marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>TIER:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ width: "130px", padding: "6px 8px", fontSize: "12px" }}
          >
            <option value="ALL">ALL TIERS</option>
            <option value="EXCELLENT">EXCELLENT</option>
            <option value="GOOD">GOOD</option>
            <option value="FAIR">FAIR</option>
            <option value="WEAK">WEAK</option>
            <option value="BAD">BAD</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>ACTION:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ width: "190px", padding: "6px 8px", fontSize: "12px" }}
          >
            <option value="ALL">ALL LABELS</option>
            <option value="CANDIDATE">CANDIDATE</option>
            <option value="WATCH">WATCH</option>
            <option value="AVOID">AVOID</option>
            <option value="NO RELIABLE EDGE">NO RELIABLE EDGE</option>
            <option value="OUTSIDE YOUR RISK BUDGET">OUTSIDE BUDGET</option>
          </select>
        </div>

        <div className="mono" style={{ fontSize: "11px", color: "var(--mute)", marginLeft: "auto" }}>
          SHOWING {sortedAssets.length} OF {assets.length} ASSETS
        </div>
      </div>

      {/* Dense Ruled Table Ledger */}
      {loading ? (
        <div className="inverted" style={{ padding: "40px", textAlign: "center", border: "2px solid var(--ink)" }}>
          <div className="headline" style={{ fontSize: "28px", color: "var(--signal)" }}>
            TRAINING LSTM & COMPUTING RISK SCORES...
          </div>
          <p className="mono" style={{ marginTop: "10px", fontSize: "12px" }}>
            RUNNING EXPANDING WALK-FORWARD EVALUATION ACROSS UNIVERSE
          </p>
        </div>
      ) : (
        <div style={{ border: "2px solid var(--ink)", overflowX: "auto" }}>
          <table className="ledger">
            <thead>
              <tr>
                <th onClick={() => handleSort("rank")} style={{ cursor: "pointer", width: "40px" }}>
                  # {sortField === "rank" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("ticker")} style={{ cursor: "pointer" }}>
                  TICKER / NAME {sortField === "ticker" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("tier")} style={{ cursor: "pointer" }}>
                  TIER {sortField === "tier" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("opportunity_score")} className="text-right" style={{ cursor: "pointer" }}>
                  OPP SCORE {sortField === "opportunity_score" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("prob_gain")} className="text-right" style={{ cursor: "pointer" }}>
                  P(UP) {sortField === "prob_gain" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th className="text-right">90% RANGE</th>
                <th onClick={() => handleSort("fuzzy_risk_score")} className="text-right" style={{ cursor: "pointer" }}>
                  RISK (0-100) {sortField === "fuzzy_risk_score" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("cvar_95_daily")} className="text-right" style={{ cursor: "pointer" }}>
                  CVAR 95% {sortField === "cvar_95_daily" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("confidence")} className="text-right" style={{ cursor: "pointer" }}>
                  CONF {sortField === "confidence" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th>SOURCE FLAGS</th>
                <th>ACTION LABEL</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset) => (
                <tr key={asset.ticker} onClick={() => onSelectAsset(asset.ticker)}>
                  <td className="mono" style={{ fontWeight: 800 }}>
                    {asset.rank}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span className="mono" style={{ fontSize: "14px", fontWeight: 800 }}>
                        {asset.ticker}
                      </span>
                      <span className="mono" style={{ fontSize: "10px", color: "var(--mute)" }}>
                        {asset.market}
                      </span>
                      {profile.custom_tickers?.includes(asset.ticker) && (
                        <span className="tag tag-inverted" style={{ fontSize: "9px", padding: "1px 5px" }}>
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, fontFamily: "var(--font-body)" }}>
                      {asset.name}
                    </div>
                  </td>
                  <td>
                    <span className="tag" style={{ fontSize: "10px" }}>{asset.tier}</span>
                  </td>
                  <td className="text-right">
                    <span
                      className="headline"
                      style={{
                        fontSize: "24px",
                        color: asset.opportunity_score >= 60 ? "var(--gain)" : "var(--signal)"
                      }}
                    >
                      {asset.opportunity_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-right mono" style={{ fontWeight: 700, color: "var(--gain)" }}>
                    {(asset.prob_gain * 100).toFixed(1)}%
                  </td>
                  <td className="text-right mono" style={{ fontSize: "11px" }}>
                    {formatRange(asset.expected_range, { ticker: asset.ticker, market: asset.market, currency: profile.currency })}
                  </td>
                  <td className="text-right mono" style={{ fontWeight: 700, color: asset.fuzzy_risk_score > 60 ? "var(--signal)" : "inherit" }}>
                    {asset.fuzzy_risk_score.toFixed(1)}
                  </td>
                  <td className="text-right mono" style={{ fontWeight: 700, color: "var(--signal)" }}>
                    {(asset.cvar_95_daily * 100).toFixed(1)}%
                  </td>
                  <td className="text-right mono">
                    {(asset.confidence * 100).toFixed(0)}%
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {asset.has_conflict && <span className="tag tag-signal" style={{ fontSize: "9px" }}>CONFLICT</span>}
                      {asset.sentiment_excluded && <span className="tag tag-mute" style={{ fontSize: "9px" }}>SENT EXCLUDED</span>}
                      {asset.is_sample && <span className="tag tag-signal" style={{ fontSize: "9px" }}>SAMPLE</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        className={`tag ${
                          asset.action_label === "CANDIDATE"
                            ? "tag-gain"
                            : asset.action_label === "WATCH"
                            ? "tag-inverted"
                            : asset.action_label === "NO RELIABLE EDGE"
                            ? "tag-mute"
                            : "tag-signal"
                        }`}
                        style={{ fontSize: "10px", fontWeight: 700 }}
                      >
                        {asset.action_label}
                      </span>
                      {profile.custom_tickers?.includes(asset.ticker) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomTicker(asset.ticker);
                          }}
                          title={`Remove custom ticker ${asset.ticker} from Board`}
                          style={{
                            border: "1px solid var(--ink)",
                            background: "transparent",
                            padding: "2px 5px",
                            fontSize: "11px",
                            fontWeight: 900,
                            color: "var(--signal)",
                            cursor: "pointer",
                            boxShadow: "none",
                            transform: "none"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
