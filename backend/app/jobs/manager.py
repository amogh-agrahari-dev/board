import time
import uuid
import threading
from typing import Dict, Any, Optional

# In-memory job tracker
JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()

def create_job(job_type: str, details: Dict[str, Any]) -> str:
    job_id = str(uuid.uuid4())[:8]
    with JOBS_LOCK:
        JOBS[job_id] = {
            "id": job_id,
            "type": job_type,
            "status": "RUNNING",
            "progress_pct": 0,
            "message": "INITIALIZING WORKER...",
            "details": details,
            "result": None,
            "created_at": time.time(),
            "updated_at": time.time()
        }
    return job_id

def update_job(job_id: str, progress_pct: int, message: str, status: str = "RUNNING", result: Optional[Any] = None):
    with JOBS_LOCK:
        if job_id in JOBS:
            JOBS[job_id]["progress_pct"] = progress_pct
            JOBS[job_id]["message"] = message
            JOBS[job_id]["status"] = status
            JOBS[job_id]["updated_at"] = time.time()
            if result is not None:
                JOBS[job_id]["result"] = result

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with JOBS_LOCK:
        return JOBS.get(job_id)
