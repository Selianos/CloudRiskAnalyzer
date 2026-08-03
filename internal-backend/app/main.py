import logging

from fastapi import FastAPI, APIRouter, Response

from app.routers import jobs
from app.database import ScanDatabase

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

app = FastAPI(title="Cloud Risk Analyzer Internal Backend")

internal_router = APIRouter(prefix="/internal")

@internal_router.get("/health")
def health(response: Response):
    is_healthy = ScanDatabase.check_db()
    if is_healthy:
        return {"status": "ok", "database": "healthy"}
    else:
        response.status_code = 503
        return {"status": "error", "database": "unhealthy"}

internal_router.include_router(jobs.router)
app.include_router(internal_router)
