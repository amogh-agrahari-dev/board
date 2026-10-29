# BOARD: Comprehensive System Documentation
## Features, Modules, and Libraries Guide

> **Project Reference:** Decision-support engine implementing the architecture proposed in the literature survey:  
> *"Machine Learning for Investment Opportunity Identification: A Literature Survey on Historical Trends, Current Information, and Risk-Aware Prediction"* (Section 10, Proposed Research Direction).

---

## 1. Architectural Overview & Design Philosophy

BOARD is an institutional-grade investment decision-support engine. Rather than functioning as an unexplainable "black-box" trading bot or price oracle, BOARD is built around strict decision-support principles:
- **Zero Future Data Leakage:** Features and rolling statistics are calculated strictly on time-ordered historical slices without look-ahead bias.
- **Mandatory Baseline Gating:** If a machine learning model fails to outperform naive persistent benchmarks in paired statistical tests (Diebold-Mariano / paired bootstrap), BOARD overrides speculative scores with **`NO RELIABLE EDGE`**.
- **Risk-Budget Enforcement:** Candidate opportunities that exceed an investor's personal volatility ceiling or drawdown tolerance are forced to **`OUTSIDE YOUR RISK BUDGET`**.
- **Physical Broadsheet Aesthetic:** Styled like a physical financial broadsheet printed on newsprint paper (`#E9E4D8`), using pure ink borders, zero border-radii (`border-radius: 0`), hard 6px offset block shadows, Archivo/Newsreader/IBM Plex Mono typography, and hand-crafted mathematical SVGs rather than generic fintech charts.
- **Cross-Market Universes:** Native support for both **Indian Equities (NSE)** (e.g., `RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFCBANK.NS`) and **US Equities (S&P 100)** (e.g., `AAPL`, `MSFT`, `NVDA`, `AMZN`, `SPY`), evaluated without flattering pooled biases.
- **Fully Keyless Operation:** Works 100% out of the box using `yfinance`, Google News RSS, and calibrated offline sample broadsheet fallbacks—no API keys required.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          THE 6-STAGE PIPELINE                          │
└────────────────────────────────────────────────────────────────────────┘
 [ Stage 1: Historical Data & Technical Indicators ]
       │  5+ yr OHLCV, Zero-leak technical suite, SMA/EMA, RSI, MACD, ATR
       ▼
 [ Stage 2: Current News & Sentiment with Learned Lag ]
       │  FinBERT signed scoring [-1, +1], Asset-specific lag cross-correlation
       ▼
 [ Stage 3: Feature Integration, Ablation & Conflict Detection ]
       │  Frequency alignment, days_since_update, 4-source signed gauge
       ▼
 [ Stage 4: Multi-Model Prediction & Baseline Gating ]
       │  PyTorch LSTM/GRU forward return, Tabular XGBoost drawdown prob + SHAP
       ▼
 [ Stage 5: Risk & Opportunity Scoring ]
       │  VaR(95%), CVaR(95%), 5000-path Monte Carlo fan, 27-rule Fuzzy engine
       ▼
 [ Stage 6: Personalized Recommendation & Portfolio Fit ]
          HHI concentration, Marginal VaR delta, Deterministic audit reports
```

---

## 2. Comprehensive Website Features

### 2.1 Regulatory & Academic Gate Modal (`GateModal.tsx`)
- **First-Run Protocol:** Blocks unverified access until the user acknowledges the system's role as an academic decision-support framework rather than an automated advisory or broker service.
- **Explicit Assumptions:** Informs the user of model limitations, transaction friction assumptions, and non-guaranteed market returns. Persists acknowledgment state locally.

### 2.2 The Board Ledger (`BoardView.tsx`)
- **Live Asset Research & Ticker Discovery Bar:**
  - Enables adding **any arbitrary stock or ETF ticker** (US NYSE/NASDAQ e.g. `META`, `AMD`, `NFLX`, `COIN` or Indian NSE e.g. `TATAMOTORS.NS`, `WIPRO.NS`, `MARUTI.NS`).
  - **Live Exchange Pre-Validation:** CallIs `/api/asset/{ticker}/check` to verify historical price availability on live feeds before adding.
  - **Dynamic Board Expansion:** Added custom stocks are seamlessly ranked into the multi-asset ledger alongside all quantitative scores (Monte Carlo, VaR/CVaR, TreeSHAP, Fuzzy Risk).
  - **Active Custom Tickers Manager:** Displays active custom assets with individual removal buttons (`✕`) and a bulk clear option, persisted across sessions in `localStorage`.
  - **Quick-Add Presets:** One-click addition chips for popular US growth/tech equities and Indian blue-chips.
- **Top Opportunity Hero Strip:** Prominently spotlights the top 3 ranked assets using high-contrast inverted cards showing the shrunk expected return less the Conditional Value-at-Risk (CVaR) penalty.
- **Multi-Asset Ledger Table:** A dense, scannable table listing:
  - Universal Ranking & Ticker Symbol (with distinct `CUSTOM` pill badges for user-added assets)
  - Company Name & Market Identifier (US / IN)
  - Universe Tier Badge (`EXCELLENT`, `GOOD`, `FAIR`, `WEAK`, `BAD`)
  - Archivo Opportunity Score (`[0, 100]` percentile rank)
  - Action Label Badge: `CANDIDATE`, `WATCH`, `AVOID`, `NO RELIABLE EDGE`, `OUTSIDE YOUR RISK BUDGET` (with in-row custom asset removal action)
  - Current Price & Return Range (90% Confidence Interval)
  - Downside Risk Metrics: Annualized Volatility, Max Drawdown, Daily VaR(95%), and Daily CVaR(95%)
  - 27-Rule Fuzzy Risk Score (`[0, 100]`)
  - Signal Conflict Flag: Alerts when technicals, news sentiment, macro regime, or sequence models diverge.
- **Dynamic Ledger Filtering & Sorting:** Real-time filtering by Market (`US`, `IN`, `BOTH`), Universe Tier, and Action Label, with sortable columns for opportunity score, risk metrics, and volatility.

### 2.3 Deep Asset Dossier (`AssetDossierView.tsx`)
- **Hero Dossier Header:** Displays the ticker, full asset title, sector, quote, universe tier, giant Archivo Opportunity Score numeral badge, and an inverted **Decision-Support One-Liner Verdict**.
- **Hand-Crafted Price Fan Chart (`SvgPriceFanChart.tsx`):**
  - Renders 120+ historical daily closing price bars alongside technical overlays (toggleable SMA 20, SMA 50, and Bollinger Bands).
  - Forecast Fan: 5,000-path Monte Carlo horizon forecast ($h \in \{21, 63, 126\}$ trading days) displaying 5th, 20th, 50th (median), 80th, and 95th percentile cones using stepped hatched SVG patterns.
  - Secondary Oscillators: Interactive sub-charts for RSI(14) with overbought/oversold reference bands and MACD (line, signal, histogram).
- **4-Source Signed Needle Gauge (`SignalsGauge.tsx`):**
  - Visualizes directional agreement between:
    1. Technical Momentum
    2. Lag-Adjusted FinBERT Sentiment
    3. Macroeconomic Regime Proxy
    4. PyTorch Sequence Return Model
  - Displays assigned reliability weights, composite signal score, overall confidence percentage, and active conflict diagnostics.
- **Learned News Lag Profile (`SvgLagChart.tsx`):**
  - Evaluates cross-correlation between financial news sentiment and subsequent asset returns across lags of 0, 1, 2, and 3 trading days.
  - Requires $\ge 60$ days of data to prevent spurious correlation; displays lag bars, p-values, and model inclusion status (`USABLE` vs `LAG: INSUFFICIENT DATA`).
- **Downside Risk Profile & Stress Matrix:**
  - Key Risk Tiles: Annualized Volatility, Historical Max Drawdown, Daily VaR(95%), Daily CVaR(95%), and Probability of Drawdown $>6\%$.
  - Historical Crisis Replay Table: Simulates asset performance under actual historical crashes (e.g., March 2020 COVID crash) alongside user-configurable macro and volatility shocks.
- **27-Rule Fuzzy Risk Matrix (`FuzzyRulesMatrix.tsx`):**
  - Implements the 3-input Mamdani fuzzy inference system (Volatility $\times$ Trend Weakness $\times$ Macro Stress).
  - Highlights currently fired rules with membership weights ($w_i = \min(\mu_{\text{vol}}, \mu_{\text{weak}}, \mu_{\text{stress}})$) and displays the defuzzified centroid risk score.
- **TreeSHAP Feature Driver Attribution (`SvgShapBars.tsx`):**
  - Visualizes the top 5 risk drivers computed via TreeSHAP on the tabular XGBoost drawdown model.
  - Color-coded bars explicitly indicate whether each feature is pushing drawdown risk upward or downward.
- **Deterministic Explainable Audit Report (`DeterministicReport.tsx`):**
  - Human-readable narrative detailing the mathematical reasoning behind the asset's rating.
  - Expandable **"Numbers Behind This Text"** payload showing exact underlying metric values for auditability.

### 2.4 User Profile & Risk Budgeting (`ProfileView.tsx`)
- **5-Question Psychometric Risk Questionnaire:** Calibrates the investor's risk profile from 1 (*Capital Preservation*) to 5 (*Maximum Speculation*) across:
  1. Primary Capital Objective
  2. Reaction to a -20% Unexpected Market Crash
  3. Annualized Realized Volatility Ceiling
  4. Time Horizon & Liquidity Constraint
  5. Historical Drawdown Experience & Psychology
- **Mathematical Risk Budget Tuning:** Automatically adjusts the $\lambda$ penalty coefficient in the opportunity scoring formula, shifting weight between expected return and tail risk.
- **Portfolio Holdings Manager:** Interactive ledger to input existing positions, specify portfolio weights, and set max position caps.

### 2.5 Portfolio Fit Analysis (`PortfolioFitView.tsx`)
- **Concentration Tracking (HHI):** Computes the Herfindahl-Hirschman Index across holdings to flag high portfolio concentration ($HHI > 0.25$).
- **Sector Allocation Breakdown:** Visualizes sector exposures and detects unhedged industry clustering.
- **Marginal VaR Delta ($\Delta\text{VaR}$):** Calculates the exact change in portfolio Value-at-Risk if a candidate asset is added at an illustrative weight (e.g., 10%).
- **Pairwise Correlation Heat-Grid (`SvgHeatGrid.tsx`):** A custom SVG matrix displaying Pearson correlation coefficients between portfolio holdings and prospective candidates.
- **Diversifier Candidate Recommendations:** Screens the universe for top-performing assets with low or negative correlation to the investor's current basket.

### 2.6 Validation Lab (`ValidationLabView.tsx`)
- **Out-of-Sample Backtest Equity Curve:** Renders an empirical performance comparison of BOARD's top-ranked picks versus an equal-weight market benchmark over time, deducting realistic transaction friction (10 bps).
- **Statistical Baseline Benchmarks:** Evaluates predictions against 5 classical baselines:
  1. *Naive Persistence* (Zero return / historical mean)
  2. *Buy & Hold* (Long-term market drift)
  3. *SMA Crossover* (50-day / 200-day trend following)
  4. *ARIMA(1, 0, 0)* (Autoregressive time-series)
  5. *Logistic Regression* (Directional classification)
- **Diebold-Mariano Tests:** Statistically validates whether BOARD's sequence and tabular models achieve statistically significant outperformance ($p < 0.05$).
- **Per-Source Feature Group Ablation Matrix:** Displays model performance when isolating or removing `PRICE_TECH`, `SENTIMENT`, or `MACRO` feature sets.
- **Cross-Market Comparison Ledger:** Side-by-side accuracy, MAE, and baseline rejection rates across US S&P 100 and Indian NSE equities.

### 2.7 Methodology & Literature Map (`MethodView.tsx`)
- **Interactive 6-Stage Pipeline Diagram:** Detailed breakdown of each stage's inputs, transformations, and outputs.
- **Mathematical Formulations:** Formal mathematical definitions of the Gated Opportunity Score, Mamdani Defuzzification, Historical CVaR, and Marginal VaR.
- **Literature Survey Mapping:** Direct academic traceability linking each module to foundational research papers ([1] through [10]).
- **Research Gaps Status Ledger:** Outlines surveyed research challenges (e.g., News Lag Adaptation, Conflicting Signal Resolution, Cross-Market Validation) and their implementation status in BOARD.

### 2.8 Global Navigation & Background Pipeline Refresh (`Navigation.tsx`)
- **Broadsheet Rail:** Fast navigation between The Board, Asset Dossier, Portfolio Fit, Validation Lab, Methodology, and Risk Profile.
- **Universe Switcher:** Instant toggling between Indian Equities (NSE), US Equities (S&P 100), or Combined Markets.
- **Asynchronous Pipeline Refresh:** Triggers backend retraining and feature re-indexing with simulated Server-Sent Event (SSE) progress tracking in an expandable terminal drawer.

---

## 3. Backend Modules Architecture

All backend logic resides in `backend/app/` with clean functional separation:

| Module Path | Purpose & Responsibilities | Key Functions / Classes |
| :--- | :--- | :--- |
| `app/config.py` | Environment variable discovery, default directory paths, and settings. | `Settings`, `BASE_DIR`, `CACHE_DIR`, `DB_PATH` |
| `app/data/fetcher.py` | Resilient financial market data extraction with SQLite caching. | `fetch_ohlcv()`, `fetch_fundamentals()`, `_clean_df()` |
| `app/data/macro.py` | Macroeconomic indicator retrieval (`^VIX`, `^INDIAVIX`, `USDINR=X`, Treasury yields). | `fetch_macro_proxies()`, `compute_macro_stress()` |
| `app/data/news.py` | News headline retrieval via Finnhub API, Google News RSS, and sample fallbacks. | `fetch_company_news()`, `fetch_rss_news()` |
| `app/data/cache.py` | Thread-safe SQLite persistence layer for OHLCV, news, and model artifacts. | `init_db()`, `get_cached_ohlcv()`, `save_cached_ohlcv()` |
| `app/data/sample_fallback.py` | 20 pre-calibrated offline datasets for 10 US and 10 Indian equities plus macro proxies. | `UNIVERSE_INFO`, `SAMPLE_PRICES`, `SAMPLE_NEWS` |
| `app/features/technical.py` | Zero look-ahead technical indicators (returns, SMA/EMA ratios, RSI, MACD, Bollinger Bands, ATR, rolling vol, volume z-score, 52-week drawdown). | `compute_technical_indicators()`, `calculate_rsi()` |
| `app/features/sentiment.py` | ProsusAI/FinBERT headline scoring, daily recency weighting, and learned news lag cross-correlation (lags 0–3 days). | `score_headline_finbert()`, `compute_learned_news_lag()` |
| `app/features/integrate.py` | Multi-source alignment across frequencies, forward-filling macro series with `days_since_update` counters. | `integrate_all_features()`, `FEATURE_GROUPS` |
| `app/models/lstm_gru.py` | PyTorch sequence models predicting forward $h$-day log returns and direction logits. | `LSTMReturnPredictor`, `GRUReturnPredictor`, `train_sequence_model()` |
| `app/models/drawdown_tabular.py` | Random Forest / XGBoost tabular models predicting drawdown probability worse than threshold; TreeSHAP feature explanations. | `train_drawdown_model()`, `compute_asset_drawdown_prob()` |
| `app/models/tiers.py` | K-Means clustering ($k=5$) on fundamentals (P/E, P/B, P/S, ROA, ROE, Volatility, Sharpe) into 5 tiers. | `compute_universe_tiers()` |
| `app/models/baselines.py` | Implementation of 5 standard baselines (Naive, Buy & Hold, SMA Crossover, ARIMA, Logistic Regression) with Diebold-Mariano tests. | `run_baselines()`, `diebold_mariano_test()` |
| `app/models/informer_stub.py` | Architectural research stub for future long-sequence Transformer attention forecasting. | `InformerStub` |
| `app/risk/var_cvar.py` | Historical and parametric Value-at-Risk (VaR 95%) and Expected Shortfall (CVaR 95%). | `compute_var_cvar()`, `historical_cvar()` |
| `app/risk/monte_carlo.py` | 5,000-path geometric Brownian motion and empirical bootstrap price fan simulations over horizons of 5 to 126 days. | `run_monte_carlo_fan()` |
| `app/risk/stress.py` | Historical crisis replay (e.g. March 2020 COVID crash) and parametric market/volatility shock tests. | `run_stress_tests()`, `custom_shock_replay()` |
| `app/risk/fuzzy_rules.py` | 27-rule Mamdani fuzzy inference system (3x3x3: Volatility $\times$ Trend Weakness $\times$ Stress) with triangular defuzzification. | `evaluate_fuzzy_risk()`, `EXPERT_RULES`, `triangular_membership()` |
| `app/opportunity/scoring.py` | Gated opportunity formula: $\mu = \text{confidence} \times \text{expected\_return}$, $\text{raw} = \mu - \lambda \times \text{CVaR}$, percentile ranking, and action labeling. | `compute_raw_opportunity()`, `rank_universe_opportunities()` |
| `app/validate/walk_forward.py` | Expanding-window walk-forward cross-validation with purge/embargo gap to prevent information leakage. | `expanding_walk_forward_cv()` |
| `app/validate/ablation.py` | Per-source feature group ablation testing (`PRICE_TECH`, `SENTIMENT`, `MACRO`). | `run_per_source_ablation()` |
| `app/validate/conflict.py` | 4-source signed needle gauge evaluating directional agreement and discounting confidence upon conflict. | `compute_source_signals()` |
| `app/validate/backtest.py` | Historical out-of-sample simulation of top-ranked picks vs equal-weight benchmark including transaction friction (10 bps). | `run_top_picks_backtest()` |
| `app/personalize/portfolio.py` | Portfolio analysis: Herfindahl-Hirschman Index (HHI), sector exposures, marginal VaR delta ($\Delta\text{VaR}$), and correlation matrix. | `compute_portfolio_metrics()`, `evaluate_candidate_fit()` |
| `app/explain/report.py` | Deterministic natural language audit narrative generator with "Numbers behind this text" breakdown. | `generate_deterministic_report()` |
| `app/jobs/manager.py` | Background asynchronous task runner and progress logger for universe refreshes. | `create_job()`, `update_job()`, `get_job()` |
| `app/main.py` | FastAPI application, CORS middleware, typed REST endpoints, and memory caching. | `app`, route handlers (`/api/screen`, `/api/asset/{ticker}`, etc.) |

---

## 4. Complete Libraries & Technologies Used

### 4.1 Backend Libraries (Python 3.11+)

| Library | Version / Requirement | Role & Technical Justification |
| :--- | :--- | :--- |
| **`fastapi`** | `>=0.115.0` | Ultra-high performance asynchronous web framework. Provides typed REST endpoints, dependency injection, automatic OpenAPI documentation, and background task management. |
| **`uvicorn[standard]`** | `>=0.30.0` | Lightning-fast ASGI web server implementation using `uvloop` and `httptools` to serve FastAPI endpoints. |
| **`pydantic`** | `>=2.8.0` | Data validation and settings management using Python type annotations. Ensures type safety for profile configurations, candidate fit requests, and API payloads. |
| **`torch`** | `>=2.2.0 (CPU)` | PyTorch deep learning framework. Implements sequence-based LSTM and GRU neural networks predicting forward multi-day log returns and directional probability. Runs efficiently on CPU without GPU requirements. |
| **`xgboost`** & **`scikit-learn`** | `>=1.5.0` | Machine learning toolkit used for Random Forest / XGBoost tabular drawdown classifiers, K-Means clustering ($k=5$) for universe fundamental tiers, and Logistic Regression baseline modeling. |
| **`shap`** | `>=0.45.0` | TreeSHAP (SHapley Additive exPlanations) engine. Delivers exact local feature attribution, explaining which indicators increased or decreased an asset's drawdown probability. |
| **`statsmodels`** | `>=0.14.0` | Econometric time-series analysis. Implements the `ARIMA(1, 0, 0)` baseline model on returns and statistical hypothesis tests. |
| **`scipy`** | `>=1.13.0` | Scientific computing library powering Student's t-distributions, normal distributions, parametric VaR/CVaR integrations, and Diebold-Mariano test statistics. |
| **`numpy`** | `>=1.26.0, <3.0.0` | High-performance numerical computing for matrix algebra, 5,000-path Monte Carlo price simulations, triangular fuzzy membership calculations, and rolling array operations. |
| **`pandas`** | `>=2.2.0` | Time-series data manipulation, rolling window statistics (SMA, EMA, ATR, Bollinger, rolling vol), forward-filling macro series, and alignment of multi-frequency financial feeds. |
| **`yfinance`** | `>=0.2.40` | Automated extraction of 5+ years of historical daily OHLCV, financial ratios, balance sheets, and sector classifications for US and Indian NSE equities. |
| **`transformers`** | `>=4.40.0` | Hugging Face library providing pre-trained NLP models. Powers `ProsusAI/FinBERT` for domain-adapted financial news sentiment polarity scoring in the signed range `[-1, +1]`. |
| **`feedparser`** | `>=6.0.10` | Robust parsing of Google News RSS feeds for real-time company news without requiring paid commercial API subscriptions. |
| **`httpx`** | `>=0.27.0` | Asynchronous HTTP client for fast, non-blocking outbound requests to external financial endpoints (Finnhub, FRED). |
| **`python-dotenv`** | `>=1.0.0` | Automatically discovers and loads environment variables from root and backend `.env` files. |
| **`sqlite3`** | *Standard Library* | Zero-configuration relational database caching historical quotes, processed news sentiment, and pre-computed models in `backend/cache/board_cache.db`. |

### 4.2 Frontend Libraries (Node 18+ / React 19)

| Library / Tool | Version | Role & Technical Justification |
| :--- | :--- | :--- |
| **`react`** & **`react-dom`** | `^19.3.1` | Core declarative UI library. React 19 powers state updates, concurrent rendering, and clean modular component composition across all 6 broadsheet views. |
| **`typescript`** | `~7.0.2` | Strong static typing across the entire frontend. Enforces data contracts matching backend Pydantic models to prevent runtime schema mismatches. |
| **`vite`** | `^8.3.5` | Next-generation frontend build tool providing instantaneous Hot Module Replacement (HMR) and optimized production bundling. |
| **`@tanstack/react-query`**| `^5.105.0` | Server-state management and data synchronization. Manages asynchronous data fetching, background polling, cache invalidation, and request deduplication. |
| **`d3-scale`** | `^4.0.2` | Mathematical mapping functions (`scaleLinear`, `scaleTime`) that map data domains to SVG coordinate ranges. |
| **`d3-shape`** | `^3.2.0` | Path generators (`line`, `area`, `curveLinear`) used to build pure, zero-overhead SVG charts (Price Fan, Correlation Heat-Grid, Lag Bars, SHAP Bars) without heavy chart library bloat. |
| **`oxlint`** | `^1.89.0` | Ultra-fast Rust-based linter that enforces high code quality and catches syntax issues instantly. |
| **Vanilla CSS** | *Native* | Clean, bespoke styling in `index.css` implementing the financial broadsheet newsprint design tokens without third-party CSS framework dependencies. |

---

## 5. Mathematical & Algorithmic Formulations

### 5.1 Gated Opportunity Scoring Equation
For each candidate asset $i$:
$$\mu_i = \text{confidence}_i \times \text{expected\_return}_i$$
$$\text{raw}_i = \mu_i - \lambda(\text{risk\_tolerance}) \times \text{CVaR}_{95, i}$$
$$\text{Opportunity Score}_i = \text{PercentileRank}(\text{raw}_i, \text{Universe}) \in [0, 100]$$
- $\lambda \in [0.5, 2.5]$ scales with the user's risk tolerance from the 5-question profile.
- **Integrity Gating:** If walk-forward statistical tests fail to beat naive persistence, action label is forced to **`NO RELIABLE EDGE`**. If volatility or drawdown breaches user limits, it is forced to **`OUTSIDE YOUR RISK BUDGET`**.

### 5.2 Mamdani Fuzzy Inference Engine (27 Rules)
- **Inputs:**
  1. *Annualized Volatility Percentile* ($\mu_{\text{vol}} \in \{\text{LOW}, \text{MEDIUM}, \text{HIGH}\}$)
  2. *Trend & Drawdown Weakness* ($\mu_{\text{weak}} \in \{\text{LOW}, \text{MEDIUM}, \text{HIGH}\}$)
  3. *Macro & News Stress* ($\mu_{\text{stress}} \in \{\text{LOW}, \text{MEDIUM}, \text{HIGH}\}$)
- **Rule Firing Strength:**
  $$w_r = \min\left(\mu_{\text{vol}, r}, \mu_{\text{weak}, r}, \mu_{\text{stress}, r}\right)$$
- **Centroid Defuzzification:**
  $$\text{Fuzzy Risk Score} = \frac{\sum_{r=1}^{27} w_r \times c_r}{\sum_{r=1}^{27} w_r} \in [0, 100]$$
  where $c_r$ is the predefined centroid of rule $r$'s consequent (e.g., *Minimal Risk* = 10, *Critical Risk* = 96).

### 5.3 Downside Risk Metrics
- **Value-at-Risk (VaR 95%):**
  $$\text{VaR}_{\alpha}(R) = -\inf\{r \mid P(R \le r) \ge 1 - \alpha\}$$
- **Conditional Value-at-Risk (CVaR 95% / Expected Shortfall):**
  $$\text{CVaR}_{\alpha}(R) = -E[R \mid R \le -\text{VaR}_{\alpha}(R)]$$
- **Marginal Portfolio VaR Delta:**
  $$\Delta \text{VaR}_i = \text{VaR}_{95}(w_{\text{port}} + w_{\text{candidate}, i}) - \text{VaR}_{95}(w_{\text{port}})$$

### 5.4 Portfolio Concentration (Herfindahl-Hirschman Index)
$$\text{HHI} = \sum_{j=1}^{M} w_j^2$$
- $HHI < 0.15$: Well-diversified portfolio.
- $HHI > 0.25$: High concentration warning triggered on the Portfolio Fit screen.

---

## 6. Project Directory Map

```
signalrisk/
├── backend/
│   ├── app/
│   │   ├── config.py              # Settings, directories, and API key discovery
│   │   ├── data/
│   │   │   ├── cache.py           # Thread-safe SQLite database manager
│   │   │   ├── fetcher.py         # YFinance data fetcher with throttled caching
│   │   │   ├── macro.py           # Macro indicators (^VIX, ^INDIAVIX, USDINR=X, etc.)
│   │   │   ├── news.py            # Finnhub, Google News RSS, and sample broadsheet wire
│   │   │   └── sample_fallback.py # 20 calibrated equities & macro sample data
│   │   ├── features/
│   │   │   ├── technical.py       # Technical indicator suite (zero future leak)
│   │   │   ├── sentiment.py       # FinBERT scoring & learned news lag (0-3 days)
│   │   │   └── integrate.py       # Frequency alignment & feature group assembly
│   │   ├── models/
│   │   │   ├── lstm_gru.py        # PyTorch sequence return & direction predictor
│   │   │   ├── drawdown_tabular.py# Tabular XGBoost drawdown risk model & TreeSHAP
│   │   │   ├── tiers.py           # K-Means (k=5) fundamental universe clustering
│   │   │   ├── baselines.py       # Naive, B&H, SMA, ARIMA, LogReg baselines
│   │   │   └── informer_stub.py   # Future long-sequence transformer research stub
│   │   ├── risk/
│   │   │   ├── var_cvar.py        # Historical/parametric VaR & CVaR
│   │   │   ├── monte_carlo.py     # 5,000-path simulation fan & loss probability
│   │   │   ├── stress.py          # March 2020 replay & custom user shocks
│   │   │   └── fuzzy_rules.py     # 27-rule Mamdani fuzzy risk engine
│   │   ├── validate/
│   │   │   ├── walk_forward.py    # Expanding-window validation with purge gap
│   │   │   ├── ablation.py        # Per-source feature group ablation
│   │   │   ├── conflict.py        # 4-source signed gauge & conflict detection
│   │   │   └── backtest.py        # Top-picks vs benchmark equity curve
│   │   ├── opportunity/
│   │   │   └── scoring.py         # Risk-adjusted score & integrity gating
│   │   ├── personalize/
│   │   │   └── portfolio.py       # HHI concentration & marginal VaR delta
│   │   ├── explain/
│   │   │   └── report.py          # Deterministic audit commentary generator
│   │   ├── jobs/
│   │   │   └── manager.py         # Background job coordinator & SSE logger
│   │   └── main.py                # FastAPI endpoints & route handlers
│   └── tests/
│       ├── test_leakage.py        # Future data leakage integrity test
│       ├── test_technical.py      # Technical indicators correctness
│       ├── test_risk.py           # VaR, CVaR, and fuzzy rules invariants
│       └── test_validation.py     # Walk-forward gating & naive baseline test
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed REST API client
│   │   ├── components/            # Broadsheet ledger UI components
│   │   │   ├── Navigation.tsx     # Broadsheet rail & refresh progress
│   │   │   ├── GateModal.tsx      # Mandatory first-run acknowledgement
│   │   │   ├── ScoreBadge.tsx     # Archivo numeral badge & action label
│   │   │   ├── SignalsGauge.tsx   # 4-source signed needle gauge
│   │   │   ├── SvgPriceFanChart.tsx # SVG price fan with hatched uncertainty
│   │   │   ├── SvgLagChart.tsx    # Learned news lag profile chart
│   │   │   ├── SvgShapBars.tsx    # TreeSHAP driver bars
│   │   │   ├── SvgHeatGrid.tsx    # Pairwise correlation heat-grid
│   │   │   ├── FuzzyRulesMatrix.tsx # 27-rule fuzzy matrix & defuzzification
│   │   │   └── DeterministicReport.tsx # Audit report with raw numbers expander
│   │   ├── views/                 # 6 Core Views
│   │   │   ├── BoardView.tsx      # Ranked opportunity ledger & top picks
│   │   │   ├── ProfileView.tsx    # 5-question risk quiz & holdings editor
│   │   │   ├── AssetDossierView.tsx # Deep asset ledger & risk diagnostics
│   │   │   ├── PortfolioFitView.tsx # Concentration HHI & diversifier ranking
│   │   │   ├── ValidationLabView.tsx# Out-of-sample backtest vs benchmark
│   │   │   └── MethodView.tsx     # 6-stage math, literature map & gaps
│   │   ├── types/index.ts         # Complete TypeScript domain contracts
│   │   ├── index.css              # Strict broadsheet CSS tokens
│   │   └── App.tsx                # Master state controller & routing
│   ├── package.json               # Frontend dependencies & scripts
│   └── index.html
├── data/sample/                   # Calibrated offline sample datasets
├── requirements.txt               # Backend Python dependencies
├── DEPLOYMENT.md                  # Cloud & local deployment documentation
└── README.md                      # Architecture summary & setup instructions
```

---

## 7. Execution & Operational Commands

### Backend Startup
```bash
# Activate virtual environment
source .venv/bin/activate

# Run test suite verifying zero future leakage and mathematical invariants
PYTHONPATH=backend pytest backend/tests

# Start FastAPI development server
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```

### Frontend Startup
```bash
cd frontend
npm install
npm run dev
# App is available at http://127.0.0.1:5173
```
