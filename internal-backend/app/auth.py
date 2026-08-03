import logging

from fastapi import Header, HTTPException

from app.config import WORKER_API_KEY


class WorkerAuth:

    @staticmethod
    def validate(authorization: str | None = Header(None)):
        if not authorization:
            logging.warning("Missing worker authentication")
            raise HTTPException(status_code=401, detail="Missing worker authentication")

        if authorization != f"Bearer {WORKER_API_KEY}":
            logging.warning("Invalid worker credentials")
            raise HTTPException(status_code=403, detail="Invalid worker credentials")
