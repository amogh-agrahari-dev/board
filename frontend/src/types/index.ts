export type Market = "IN" | "US" | "BOTH";

export interface Holding {
  ticker: string;
  weight: number;
}

export interface UserProfile {
  risk_tolerance: number; // 1 to 5
  horizon_months: number; // 1, 3, 6, 12
  market: Market;
  currency: string;
  max_position_size: number;
  holdings: Holding[];
  custom_tickers?: string[];
}

export interface ScreenAsset {
  rank: number;
  ticker: string;
  name: string;
  market: "IN" | "US";
  sector: string;
  tier: "EXCELLENT" | "GOOD" | "FAIR" | "WEAK" | "BAD";
  opportunity_score: number;
  raw_opportunity: number;
  mu: number;
  prob_gain: number;
  prob_loss: number;
  expected_range: [number, number];
  annualized_vol: number;
  max_drawdown: number;
  var_95_daily: number;
  cvar_95_daily: number;
  fuzzy_risk_score: number;
  confidence: number;
  has_conflict: boolean;
  conflict_details: string;
  sentiment_excluded: boolean;
  beats_baseline: boolean;
  directional_accuracy: number;
  action_label: "CANDIDATE" | "WATCH" | "AVOID" | "NO RELIABLE EDGE" | "OUTSIDE YOUR RISK BUDGET";
  verdict_one_liner: string;
  current_price: number;
  as_of: string;
  is_sample: boolean;
}

export interface PricePoint {
  date: string;
  close: number;
  sma_20: number;
  sma_50: number;
  bollinger_upper: number;
  bollinger_lower: number;
  rsi: number;
  macd: number;
  macd_signal: number;
}

export interface FanTimelineStep {
  day: number;
  p05: number;
  p20: number;
  p50: number;
  p80: number;
  p95: number;
}

export interface MonteCarloData {
  paths_count: number;
  horizon_days: number;
  current_price: number;
  fan_timeline: FanTimelineStep[];
  prob_loss: number;
  prob_gain: number;
  median_price: number;
  range_90: [number, number];
  range_60: [number, number];
  horizon_var_95: number;
  horizon_cvar_95: number;
}

export interface ShapDriver {
  feature: string;
  label: string;
  shap_value: number;
  importance: number;
  direction: "RISK_UP" | "RISK_DOWN";
  plain_text: string;
}

export interface FuzzyRuleFired {
  rule_id: number;
  vol: string;
  weakness: string;
  stress: string;
  consequent: string;
  rule_score: number;
  weight: number;
}

export interface AssetDossier {
  ticker: string;
  name: string;
  market: "IN" | "US";
  sector: string;
  tier: string;
  opportunity_score: number;
  action_label: "CANDIDATE" | "WATCH" | "AVOID" | "NO RELIABLE EDGE" | "OUTSIDE YOUR RISK BUDGET";
  verdict_one_liner: string;
  current_price: number;
  price_history: PricePoint[];
  monte_carlo: MonteCarloData;
  signals_panel: {
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
    composite_signal: number;
    confidence: number;
    has_conflict: boolean;
    conflict_details: string;
  };
  news_sentiment: {
    headlines: Array<{
      headline: string;
      published_at: string;
      source: string;
      sentiment_score: number;
      sentiment_label: string;
    }>;
    lag_profile: {
      status: string;
      chosen_lag: number;
      best_correlation: number;
      profile: Array<{ lag: number; strength: number; p_value: number }>;
      usable_for_model: boolean;
    };
  };
  risk_panel: {
    var_metrics: {
      annualized_vol: number;
      max_drawdown: number;
      var_95_daily: number;
      cvar_95_daily: number;
      var_95_parametric: number;
    };
    fuzzy_risk: {
      risk_score: number;
      inputs: {
        vol_percentile: number;
        trend_weakness: number;
        macro_news_stress: number;
      };
      fired_rules: FuzzyRuleFired[];
    };
    stress_tests: {
      historical_scenarios: Array<{
        name: string;
        period: string;
        drawdown: number;
        implied_price: number;
        recovered_days: string;
      }>;
      custom_shock: {
        market_shock: number;
        volatility_shock: number;
        estimated_beta: number;
        projected_loss: number;
        projected_price: number;
      };
    };
    drawdown_prob: number;
  };
  shap_drivers: ShapDriver[];
  report: {
    verdict_headline: string;
    sections: Array<{ title: string; body: string }>;
    top_drivers: ShapDriver[];
    raw_numbers: Record<string, any>;
  };
  validation: {
    walk_forward: {
      beats_baseline: boolean;
      directional_accuracy: number;
      dir_acc_ci: [number, number];
      mae: number;
      mae_ci: [number, number];
      rmse: number;
      paired_p_value: number;
      baselines: Record<string, any>;
    };
    ablation: {
      group_status: Record<string, {
        kept: boolean;
        reason: string;
        dir_acc?: number;
        mae?: number;
        dir_delta?: number;
        mae_delta?: number;
      }>;
    };
  };
  as_of: string;
  data_source: string;
  is_sample: boolean;
  model_version: string;
}

export interface PortfolioMetrics {
  annualized_vol: number;
  hhi: number;
  is_concentrated: boolean;
  sector_weights: Record<string, number>;
  correlation_matrix: {
    tickers: string[];
    matrix: number[][];
  };
  portfolio_var_95: number;
  holdings_count: number;
}
