# BOARD: Investment-Opportunity Engine

A decision-support engine implementing the architecture proposed in the literature survey:  
**"Machine Learning for Investment Opportunity Identification: A Literature Survey on Historical Trends, Current Information, and Risk-Aware Prediction"** (Section 10, Proposed Research Direction).

BOARD integrates market microstructure, fundamental ratios, current financial news with learned lag, macroeconomic regime proxies, walk-forward predictive modeling, multi-method risk quantification, and personalized portfolio fit into an explainable broadsheet ledger.

---

## 1. What BOARD Is (and What It Isn't)

- **Is:** An institutional-grade decision-support tool. It pulls real market data across **Indian Equities (NSE)** and **US Equities (S&P 100)**, builds time-ordered non-leaking features, performs per-source ablation, assesses signal conflict, calculates downside risk (Historical & Parametric VaR, CVaR, Monte Carlo horizon fans, stress replays, and a 27-rule fuzzy risk inference engine), and ranks candidate opportunities tailored to the investor's risk profile and existing holdings.
- **Is NOT:** A trading bot, price oracle, or financial advisory system. BOARD guarantees zero returns and issues no "buy now" commands. When walk-forward predictive accuracy fails to beat naive persistent baselines in paired statistical tests, BOARD explicitly reports **`NO RELIABLE EDGE`**. When downside volatility breaches the investor's stated limits, it marks **`OUTSIDE YOUR RISK BUDGET`**.

---

## 2. Design Aesthetic: "Trading Desk Ledger, Not a Fintech Dashboard"

The user interface reflects a physical financial broadsheet printed on newsprint paper:
- **Strict Color Tokens:**
  - `--paper`: `#E9E4D8` (Warm newsprint background)
  - `--ink`: `#111110` (High-contrast typography, rules, borders)
  - `--signal`: `#E8321B` (Downside risk, drawdowns, signal conflicts, primary focal numbers)
  - `--gain`: `#1F6B3A` (Gains and metric improvements only)
  - `--mute`: `#8A8577` (Hairlines, stale indicators, secondary metadata)
- **Zero Border Radius:** Strict `border-radius: 0` across all cards, modals, buttons, and inputs.
- **No Gradients, Shadows, or Emojis:** Pure 2px and 1px ink rule decoration, hard 6px offset block shadows on buttons, and mono caps.
- **Typography:**
  - **Archivo (Condensed 800/900):** Massive condensed headlines and dominant opportunity score numerals.
  - **Newsreader:** Editorial serif for analytical commentary and audit narratives.
  - **IBM Plex Mono:** Dense financial tables, tickers, tags, and parameters.
- **Hand-Built SVG Charts:** Price fan charts with stepped hatched uncertainty bands, signed source gauge needles, learned news lag bars, and pairwise correlation heat-grids using stepped ink/signal tints.

---

## 3. The 6-Stage Pipeline

```
[ Stage 1: Historical Data & Technical Indicators ]
                  │
                  ▼
[ Stage 2: Current News & Sentiment with Learned Lag ]
                  │
                  ▼
[ Stage 3: Feature Integration, Ablation & Conflict Detection ]
                  │
                  ▼
[ Stage 4: Multi-Model Prediction (LSTM/GRU & Tabular SHAP) ]
                  │
                  ▼
[ Stage 5: Risk & Opportunity Scoring (VaR, CVaR, Monte Carlo, Fuzzy Rules) ]
                  │
                  ▼
[ Stage 6: Personalized, Explainable Recommendation & Portfolio Fit ]
```

1. **Historical Data + Technical Indicators (`app/features/technical.py`):**
   - 5+ years daily OHLCV from `yfinance` with SQLite caching and sample broadsheet fallbacks.
   - Zero look-ahead engineering: returns, percentage price changes, SMA/EMA ratios (10/20/50/200), RSI(14), MACD, Bollinger %B & width, ATR, rolling volatility (10/21/63d), volume z-score, momentum (21/63/126d), 52-week drawdown.
2. **Current News + Sentiment (`app/features/sentiment.py`):**
   - FinBERT signed polarity scoring `[-1, +1]` with fast financial lexicon fallback.
   - Recency-weighted daily aggregation.
   - Asset-specific news lag optimization (evaluating lags 0–3 trading days vs forward return). Threshold requires $\ge 60$ days of data; otherwise flags `LAG: INSUFFICIENT DATA`.
3. **Feature Integration, Ablation & Conflict (`app/features/integrate.py`, `app/validate/ablation.py`, `app/validate/conflict.py`):**
   - Forward-fill slow macroeconomic indicators only from publication dates with `days_since_update` counters.
   - Per-source group ablation: Drops feature groups (`PRICE_TECH`, `SENTIMENT`, `MACRO`) unless out-of-sample testing confirms simultaneous improvements in error metrics and directional accuracy.
   - Signal conflict engine: Evaluates directional agreement between technical momentum, sentiment, macro regime, and sequence models. Flags `CONFLICT` and discounts confidence when material divergence occurs.
4. **Prediction Models & Baselines (`app/models/`):**
   - **Sequence Models:** PyTorch CPU LSTM & GRU predicting forward $h$-day log return ($h \in \{5, 21, 63\}$ days) rather than deceptive price levels.
   - **Tabular Models:** Random Forest and XGBoost estimating cross-sectional drawdown probability worse than $X\%$, explained with TreeSHAP.
   - **Universe Tiers:** K-Means ($k=5$) clustering on valuation, profitability, volatility, and Sharpe ratios into `EXCELLENT`, `GOOD`, `FAIR`, `WEAK`, and `BAD`.
   - **Baselines:** Naive persistence, Buy & Hold, SMA Crossover, ARIMA, and Logistic Regression with paired statistical tests (Diebold-Mariano / paired bootstrap).
5. **Risk & Opportunity Scoring (`app/risk/`, `app/opportunity/`):**
   - Historical & Parametric VaR(95%), Expected Shortfall CVaR(95%), 5,000-path Monte Carlo horizon simulations.
   - Historical crisis replay (March 2020 crash) and user-defined stress shocks.
   - Fuzzy Logic Inference: 27 expert rules across Volatility, Trend Weakness, and Macro/Sentiment Stress using triangular memberships.
   - Gated Opportunity Formula:
     $$\mu = \text{confidence} \times \text{expected\_return}$$
     $$\text{raw} = \mu - \lambda \times \text{CVaR}_{\text{loss}}$$
6. **Personalized Recommendation & Portfolio Fit (`app/personalize/`, `app/explain/`):**
   - Herfindahl-Hirschman Index (HHI) concentration tracking, sector exposure breakdown.
   - Marginal VaR delta ($\Delta \text{VaR}$) for candidate additions.
   - Pairwise correlation heat-grid.
   - Deterministic audit reports with an expandable "Numbers behind this text" payload.

---

## 4. Repository Layout

```
signalrisk/
├── backend/
│   ├── app/
│   │   ├── config.py              # Settings, directories, and API key discovery
│   │   ├── data/
│   │   │   ├── cache.py           # SQLite persistence for OHLCV, news, models
│   │   │   ├── fetcher.py         # YFinance data fetcher with throttled caching
│   │   │   ├── macro.py           # Macro indicators (^VIX, ^INDIAVIX, USDINR=X, etc.)
│   │   │   ├── news.py            # Finnhub, Google News RSS, and sample broadsheet wire
│   │   │   └── sample_fallback.py # 20 calibrated equities & macro sample data
│   │   ├── features/
│   │   │   ├── technical.py       # Technical indicator suite (zero future leak)
│   │   │   ├── sentiment.py       # FinBERT scoring & learned news lag
│   │   │   └── integrate.py       # Frequency alignment & feature group assembly
│   │   ├── models/
│   │   │   ├── lstm_gru.py        # PyTorch sequence predictor
│   │   │   ├── drawdown_tabular.py# Drawdown risk tabular model & TreeSHAP
│   │   │   ├── tiers.py           # K-Means universe clustering
│   │   │   ├── baselines.py       # Naive, B&H, SMA, ARIMA, LogReg baselines
│   │   │   └── informer_stub.py   # Future long-sequence research stub
│   │   ├── risk/
│   │   │   ├── var_cvar.py        # Historical/parametric VaR & CVaR
│   │   │   ├── monte_carlo.py     # 5,000-path simulation fan & loss probability
│   │   │   ├── stress.py          # March 2020 replay & custom shocks
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
│   │   ├── index.css              # Strict broadsheet CSS tokens
│   │   └── App.tsx                # Master state controller & routing
│   └── index.html
├── data/
│   └── sample/                    # Offline sample market & macro data
└── README.md
```

---

## 5. Quickstart & Installation

BOARD is engineered to run **completely keyless out of the box** using free public market feeds and fallback offline sample sets.

### Prerequisites
- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (recommended) or standard `pip`

### Step 1: Clone and Set Up Python Environment
```bash
git clone <repo-url>
cd signalrisk

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies using uv or pip
uv pip install -r backend/requirements.txt
# OR
pip install -r backend/requirements.txt
```

### Step 2: Configure Environment (Optional)
Create a `.env` file in the root directory if you have API keys:
```bash
# Optional: All keys can be omitted for fully keyless operation
FINNHUB_API_KEY=""      # For real-time institutional company news
NEWSAPI_KEY=""          # For secondary news feeds
FRED_API_KEY=""         # For St. Louis Fed macro series
LLM_API_KEY=""          # Optional LLM polish (deterministic commentary is default)
FAST_MODE=true          # Enables demo mode for fast laptop CPU inference
```

### Step 3: Run Backend Tests
Run the integrity test suite to verify zero future data leakage and mathematical invariants:
```bash
PYTHONPATH=backend pytest backend/tests
```

### Step 4: Start the Backend Server
```bash
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
The FastAPI documentation will be available at `http://127.0.0.1:8000/docs`.

### Step 5: Start the Frontend Client
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://127.0.0.1:5173`.

---

## 6. Verification and Testing Checklist

- [x] **Zero Future Leakage:** Unit tests explicitly attempt to predict using future data points and confirm failure.
- [x] **Baselines Gating:** Assets with walk-forward test statistics failing to beat naive random walk persistence are forced to `NO RELIABLE EDGE`.
- [x] **Risk-Constrained Gating:** Assets breaching user risk limits are forced to `OUTSIDE YOUR RISK BUDGET`.
- [x] **Broadsheet Aesthetics:** Full WCAG AA contrast, zero border-radius, pure black ink rules, custom hatched SVG forecast fans, and no gradients.
- [x] **Side-by-Side Cross-Market Validation:** Validation Lab reports independent out-of-sample metrics for both Indian NSE and US S&P universes.
