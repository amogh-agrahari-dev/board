# Production Deployment Guide: BOARD on Render & Vercel

This repository is pre-configured and production-ready for:
- **Backend (FastAPI, PyTorch CPU, Risk Engine)** on **[Render](https://render.com/)**
- **Frontend (Vite, React, TypeScript Broadsheet UI)** on **[Vercel](https://vercel.com/)**

---

## Step 1: Push This Repository to GitHub

Open your terminal in the project root and run:

```bash
# 1. Create a new repository on GitHub (e.g. named 'signalrisk' or 'board-engine')
# 2. Add your GitHub remote (replace with your repo URL):
git remote add origin https://github.com/<your-username>/signalrisk.git

# 3. Push to main:
git push -u origin main
```

*(Note: Your private keys in `.env` are automatically ignored by `.gitignore` and will never be committed to GitHub.)*

---

## Step 2: Deploy Backend to Render

### Option A: 1-Click Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Select your GitHub repository.
4. Render will read [`render.yaml`](file:///Users/amoghagrahari/Documents/PICT/EEFM/signalrisk/render.yaml) automatically.
5. In the environment variables prompt, paste your API keys:
   - `FINNHUB_API_KEY`: Your Finnhub key
   - `FRED_API_KEY`: Your FRED key
   - `NEWSAPI_KEY`: Your NewsAPI key
   - `LLM_API_KEY`: Your Groq/LLM key
   - `FAST_MODE`: `true`
6. Click **Apply**.

### Option B: Manual Web Service
1. In Render, click **New +** -> **Web Service**.
2. Connect your GitHub repo.
3. Configure the settings:
   - **Name**: `board-engine-api`
   - **Language**: `Python 3`
   - **Region**: `Oregon` (or closest to you)
   - **Root Directory**: `backend` (or leave empty)
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.9`
   - `FAST_MODE` = `true`
   - `FINNHUB_API_KEY` = `<your-key>`
   - `FRED_API_KEY` = `<your-key>`
   - `NEWSAPI_KEY` = `<your-key>`
   - `LLM_API_KEY` = `<your-key>`
5. Click **Create Web Service**.
6. When deployment finishes, copy your Render URL:  
   👉 `https://board-engine-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New...** -> **Project** and import your GitHub repo.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render Backend URL from Step 2 (e.g. `https://board-engine-api.onrender.com`)
5. Click **Deploy**.

*(Vercel uses [`frontend/vercel.json`](file:///Users/amoghagrahari/Documents/PICT/EEFM/signalrisk/frontend/vercel.json) to handle single-page routing rewrites automatically.)*

---

## Step 4: Verification in Production

1. Visit your Render backend health endpoint:
   ```bash
   curl https://<your-render-url>.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "OPERATIONAL",
     "active_sources": {
       "yfinance": "ONLINE",
       "finnhub": "ONLINE (KEYED)",
       "fred": "ONLINE (KEYED)"
     },
     "is_sample": false
   }
   ```
2. Open your Vercel deployment URL (e.g. `https://board-engine.vercel.app`):
   - Confirm Gate Modal appears (`MODELS CAN BE WRONG.`).
   - Confirm `DATA STATUS` displays the green `LIVE MARKET` badge.
   - Test both US and Indian universes and open an Asset Dossier.
