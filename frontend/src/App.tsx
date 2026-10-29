import React, { useState, useEffect } from "react";
import { UserProfile, ScreenAsset, Market } from "./types";
import { screenUniverse, triggerRefreshJob, checkJobStatus } from "./api/client";
import { Navigation } from "./components/Navigation";
import { GateModal } from "./components/GateModal";
import { BoardView } from "./views/BoardView";
import { ProfileView } from "./views/ProfileView";
import { AssetDossierView } from "./views/AssetDossierView";
import { PortfolioFitView } from "./views/PortfolioFitView";
import { ValidationLabView } from "./views/ValidationLabView";
import { MethodView } from "./views/MethodView";

const DEFAULT_PROFILE: UserProfile = {
  risk_tolerance: 3,
  horizon_months: 1,
  market: "US",
  currency: "USD",
  max_position_size: 0.20,
  holdings: [
    { ticker: "SPY", weight: 0.60 },
    { ticker: "AAPL", weight: 0.40 }
  ],
  custom_tickers: []
};

export const App: React.FC = () => {
  const [gateAck, setGateAck] = useState<boolean>(() => {
    return localStorage.getItem("board_gate_ack") === "true";
  });

  const [currentView, setCurrentView] = useState<string>("board");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("board_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          custom_tickers: parsed.custom_tickers || []
        };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });
  const [assets, setAssets] = useState<ScreenAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [asOf, setAsOf] = useState<string>("");
  const [isSample, setIsSample] = useState<boolean>(false);

  // Background refresh job
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshProgress, setRefreshProgress] = useState<string>("");

  const loadScreenData = () => {
    setLoading(true);
    screenUniverse(profile)
      .then((res) => {
        setAssets(res.results);
        setAsOf(res.as_of);
        setIsSample(res.is_sample);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Screening failed:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadScreenData();
  }, [profile.market, profile.horizon_months, profile.risk_tolerance, JSON.stringify(profile.custom_tickers)]);

  const handleAcknowledgeGate = () => {
    localStorage.setItem("board_gate_ack", "true");
    setGateAck(true);
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      let currency = updated.currency || prev.currency;
      if (updated.market === "IN" && !updated.currency) {
        currency = "INR";
      } else if (updated.market === "US" && !updated.currency) {
        currency = "USD";
      }
      const next = { ...prev, ...updated, currency };
      try {
        localStorage.setItem("board_profile", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleTriggerRefresh = async () => {
    try {
      setRefreshing(true);
      setRefreshProgress("STARTING PIPELINE WORKERS...");
      const { job_id } = await triggerRefreshJob();
      
      const pollInterval = setInterval(async () => {
        try {
          const job = await checkJobStatus(job_id);
          if (job.status === "RUNNING") {
            setRefreshProgress(job.message || "TRAINING LSTM ... FOLD 2/4");
          } else if (job.status === "SUCCESS") {
            clearInterval(pollInterval);
            setRefreshing(false);
            setRefreshProgress("");
            loadScreenData();
          } else {
            clearInterval(pollInterval);
            setRefreshing(false);
          }
        } catch {
          clearInterval(pollInterval);
          setRefreshing(false);
        }
      }, 1000);
    } catch (e) {
      setRefreshing(false);
    }
  };

  return (
    <div className="app-container">
      {/* First-Run Mandatory Acknowledgement Gate */}
      <GateModal isOpen={!gateAck} onAcknowledge={handleAcknowledgeGate} />

      {/* Sticky Left Rail / Mobile Top Navigation */}
      <Navigation
        currentView={selectedTicker ? "asset" : currentView}
        onSelectView={(view) => {
          setSelectedTicker(null);
          setCurrentView(view);
        }}
        isSampleData={isSample}
        asOf={asOf}
        refreshing={refreshing}
        refreshProgress={refreshProgress}
        onTriggerRefresh={handleTriggerRefresh}
        onSelectAsset={(t) => setSelectedTicker(t)}
      />

      {/* Primary Content View Pane */}
      <main className="content-pane">
        {selectedTicker ? (
          <AssetDossierView
            ticker={selectedTicker}
            profile={profile}
            onBack={() => setSelectedTicker(null)}
          />
        ) : currentView === "board" ? (
          <BoardView
            assets={assets}
            loading={loading}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onSelectAsset={(t) => setSelectedTicker(t)}
            asOf={asOf}
            isSample={isSample}
          />
        ) : currentView === "profile" ? (
          <ProfileView
            profile={profile}
            onSaveProfile={(newProf) => {
              setProfile(newProf);
              loadScreenData();
            }}
          />
        ) : currentView === "portfolio" ? (
          <PortfolioFitView
            profile={profile}
            assets={assets}
            onSelectAsset={(t) => setSelectedTicker(t)}
            onNavigateProfile={() => setCurrentView("profile")}
          />
        ) : currentView === "validation" ? (
          <ValidationLabView initialMarket={profile.market} />
        ) : currentView === "method" ? (
          <MethodView />
        ) : null}

        {/* Persistent Broadsheet Footer */}
        <footer className="broadsheet-footer">
          <div>
            <strong>BOARD DECISION SUPPORT ENGINE</strong> — MODELS CAN BE WRONG. NOT FINANCIAL ADVICE.
          </div>
          <div className="mono" style={{ color: "var(--mute)" }}>
            SECTION 10 PROPOSED RESEARCH DIRECTION PIPELINE
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
