import os
import json
import logging

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from supabase import create_client
from cryptography.fernet import Fernet

load_dotenv()


# Configuration
WORKER_API_KEY = os.getenv("WORKER_API_KEY")
if not WORKER_API_KEY:
    raise ValueError("WORKER_API_KEY environment variable is not set")

SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is not set")

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable is not set")

SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY environment variable is not set")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
cipher = Fernet(ENCRYPTION_KEY.encode())
app = FastAPI(title="Cloud Risk Analyzer Internal Backend")


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


# Authentication
class WorkerAuth:

    @staticmethod
    def validate(authorization: str | None):

        if not authorization:
            logging.warning("Missing worker authentication")

            raise HTTPException(status_code=401, detail="Missing worker authentication")

        if authorization != f"Bearer {WORKER_API_KEY}":

            logging.warning("Invalid worker credentials")

            raise HTTPException(status_code=403, detail="Invalid worker credentials")


# Encryption
class CredentialManager:

    @staticmethod
    def decrypt(data):

        decrypted = cipher.decrypt(data.encode())

        return json.loads(decrypted.decode())


# Database
class ScanDatabase:

    @staticmethod
    def get_job(job_id):

        result = supabase.table("scan_jobs").select("""
                id,
                connection_id,
                status,
                connections(
                    provider,
                    credentials
                )
                """).eq("id", job_id).execute()

        if not result.data:
            return None

        return result.data[0]

    @staticmethod
    def reserve_job(job_id):

        supabase.table("scan_jobs").update({"status": "RUNNING"}).eq(
            "id", job_id
        ).execute()

    @staticmethod
    def next_pending_job():

        result = supabase.table("scan_jobs").select("""
                id,
                connection_id,
                connections(
                    provider,
                    credentials
                )
                """).eq("status", "PENDING").limit(1).execute()

        if not result.data:
            return None

        job = result.data[0]

        ScanDatabase.reserve_job(job["id"])  # type: ignore

        return job

    @staticmethod
    def update_status(job_id, status):

        supabase.table("scan_jobs").update({"status": status}).eq(
            "id", job_id
        ).execute()


# Models
class ScanResult(BaseModel):

    findings: list
    resources: list


class StatusUpdate(BaseModel):

    status: str


# Health
@app.get("/internal/health")
def health():
    return {"status": "ok"}


# Poll Job Queue
@app.get("/internal/jobs/poll")
def poll_job(authorization: str | None = Header(None)):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.next_pending_job()

    if not job:

        return {"job": None}

    credentials = CredentialManager.decrypt(
        job["connections"]["credentials"]  # type: ignore
    )

    return {
        "job_id": job["id"],  # type: ignore
        "provider": job["connections"]["provider"],  # type: ignore
        "credentials": credentials,
    }


# Get Specific Job
@app.get("/internal/jobs/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(None)):
    WorkerAuth.validate(authorization)
    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f"Job not found: {job_id}")
        raise HTTPException(status_code=404, detail="Scan job not found")

    credentials = CredentialManager.decrypt(
        job["connections"]["credentials"]  # type: ignore
    )

    return {
        "job_id": job["id"],  # type: ignore
        "provider": job["connections"]["provider"],  # type: ignore
        "credentials": credentials,
    }


# Submit Results
@app.post("/internal/jobs/{job_id}/results", status_code=201)
def submit_results(
    job_id: str, result: ScanResult, authorization: str | None = Header(None)
):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.get_job(job_id)

    if not job:

        raise HTTPException(status_code=404, detail="Scan job does not exist")

    # Store resources
    for resource in result.resources:

        supabase.table("resources").insert(
            {"scan_job_id": job_id, **resource}
        ).execute()

    # Store findings
    for finding in result.findings:

        supabase.table("findings").insert({"scan_job_id": job_id, **finding}).execute()

    ScanDatabase.update_status(job_id, "COMPLETED")

    return


# Update Status
@app.post("/internal/jobs/{job_id}/status")
def update_status(
    job_id: str, update: StatusUpdate, authorization: str | None = Header(None)
):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.get_job(job_id)

    if not job:

        raise HTTPException(status_code=404, detail="Scan job does not exist")

    ScanDatabase.update_status(job_id, update.status)

    return
