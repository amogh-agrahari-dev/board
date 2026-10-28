import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLE_DIR = DATA_DIR / "sample"
CACHE_DIR = BASE_DIR / "backend" / "cache"
DB_PATH = CACHE_DIR / "board_cache.db"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

try:
    from dotenv import load_dotenv
    # Load from root directory or backend directory
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR / "backend" / ".env")
except ImportError:
    pass

class Settings(BaseModel):
    app_name: str = "BOARD"
    version: str = "1.0.0"
    finnhub_api_key: str = os.getenv("FINNHUB_API_KEY", "")
    fred_api_key: str = os.getenv("FRED_API_KEY", "")
    newsapi_key: str = os.getenv("NEWSAPI_KEY", "")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    social_enabled: bool = os.getenv("ENABLE_SOCIAL", "false").lower() == "true"
    fast_mode: bool = os.getenv("FAST_MODE", "true").lower() == "true"
    frontend_url: str = os.getenv("FRONTEND_URL", "https://board-theta-one.vercel.app")
    db_path: Path = DB_PATH
    sample_dir: Path = SAMPLE_DIR

settings = Settings()
