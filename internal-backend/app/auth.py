import logging

from fastapi import Header, HTTPException

from app.config import WORKER_API_KEY


class WorkerAuth:

    @staticmethod
    def validate(authorization: str | None = Header(None), job_id: str | None = None):
        if not authorization:
            logging.warning(f" Missing worker authentication (Job ID: {job_id})")
            raise HTTPException(status_code=401, detail="Missing worker authentication")

        if authorization != f"Bearer {WORKER_API_KEY}":
            logging.warning(f" Invalid worker credentials (Job ID: {job_id})")
            raise HTTPException(status_code=403, detail="Invalid worker credentials")
