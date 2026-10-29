import { UserProfile, ScreenAsset, AssetDossier, PortfolioMetrics, Market } from "../types";

const API_HOST = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const BASE_URL = API_HOST.endsWith("/api") ? API_HOST : `${API_HOST}/api`;

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend offline");
  return res.json();
}

export async function screenUniverse(profile: UserProfile): Promise<{ results: ScreenAsset[]; as_of: string; is_sample: boolean }> {
  const res = await fetch(`${BASE_URL}/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error("Failed to screen universe");
  return res.json();
}

export async function fetchAssetDossier(ticker: string, horizonDays: number = 21): Promise<AssetDossier> {
  const res = await fetch(`${BASE_URL}/asset/${encodeURIComponent(ticker)}?horizon_days=${horizonDays}`);
  if (!res.ok) throw new Error(`Failed to fetch dossier for ${ticker}`);
  return res.json();
}

export async function fetchAssetPersonalFit(ticker: string, holdings: any[], illustrativeWeight: number = 0.10) {
  const res = await fetch(`${BASE_URL}/asset/${encodeURIComponent(ticker)}/personal-fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings, illustrative_weight: illustrativeWeight })
  });
  if (!res.ok) throw new Error("Failed to evaluate candidate personal fit");
  return res.json();
}

export async function analyzePortfolio(holdings: any[]): Promise<PortfolioMetrics> {
  const res = await fetch(`${BASE_URL}/portfolio/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings })
  });
  if (!res.ok) throw new Error("Failed to analyze portfolio");
  return res.json();
}

export async function fetchValidation(market: Market = "US") {
  const res = await fetch(`${BASE_URL}/validation?market=${market}`);
  if (!res.ok) throw new Error("Failed to fetch validation lab");
  return res.json();
}

export async function fetchMethod() {
  const res = await fetch(`${BASE_URL}/method`);
  if (!res.ok) throw new Error("Failed to fetch method specifications");
  return res.json();
}

export async function triggerRefreshJob(): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE_URL}/jobs/refresh`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start refresh job");
  return res.json();
}

export async function checkJobStatus(jobId: string) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to check job status");
  return res.json();
}

export async function checkTicker(ticker: string): Promise<{
  ticker: string;
  name: string;
  sector: string;
  market: string;
  current_price: number;
  is_sample: boolean;
  valid: boolean;
}> {
  const res = await fetch(`${BASE_URL}/asset/${encodeURIComponent(ticker)}/check`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ticker not found" }));
    throw new Error(err.detail || "Ticker not found");
  }
  return res.json();
}

