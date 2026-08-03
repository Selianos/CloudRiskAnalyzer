import os
import json
import logging

from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from psycopg2 import pool

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from cryptography.fernet import Fernet

load_dotenv()


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

WORKER_API_KEY = os.getenv("WORKER_API_KEY")
if not WORKER_API_KEY:
    raise ValueError("WORKER_API_KEY environment variable is not set")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable is not set")


# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


# ──────────────────────────────────────────────
# Database connection pool
# ──────────────────────────────────────────────

db_pool = psycopg2.pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=DATABASE_URL,
    cursor_factory=psycopg2.extras.RealDictCursor,
)


@contextmanager
def get_db():
    conn = db_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        db_pool.putconn(conn)


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────

cipher = Fernet(ENCRYPTION_KEY.encode())
app = FastAPI(title="Cloud Risk Analyzer Internal Backend")


# ──────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────

class WorkerAuth:

    @staticmethod
    def validate(authorization: str | None):

        if not authorization:
            logging.warning("Missing worker authentication")
            raise HTTPException(status_code=401, detail="Missing worker authentication")

        if authorization != f"Bearer {WORKER_API_KEY}":
            logging.warning("Invalid worker credentials")
            raise HTTPException(status_code=403, detail="Invalid worker credentials")


# ──────────────────────────────────────────────
# Encryption
# ──────────────────────────────────────────────

class CredentialManager:

    @staticmethod
    def decrypt(data):
        decrypted = cipher.decrypt(data.encode())
        return json.loads(decrypted.decode())


# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────

class ScanDatabase:

    @staticmethod
    def get_job(job_id):

        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        sj.id,
                        sj.connection_id,
                        sj.status,
                        c.provider,
                        c.credentials
                    FROM scan_jobs sj
                    JOIN connections c ON c.id = sj.connection_id
                    WHERE sj.id = %s
                    """,
                    (job_id,),
                )
                row = cur.fetchone()

        if not row:
            return None

        return dict(row)

    @staticmethod
    def next_pending_job():
        """
        Atomically claim the next PENDING job using SELECT FOR UPDATE SKIP LOCKED
        so concurrent workers never pick up the same job.
        """
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE scan_jobs
                    SET    status = 'RUNNING'
                    WHERE  id = (
                        SELECT sj.id
                        FROM   scan_jobs sj
                        WHERE  sj.status = 'PENDING'
                        ORDER  BY sj.created_at
                        LIMIT  1
                        FOR UPDATE SKIP LOCKED
                    )
                    RETURNING id, connection_id
                    """
                )
                row = cur.fetchone()

            if not row:
                return None

            job_id      = row["id"]
            conn_id     = row["connection_id"]

            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT provider, credentials
                    FROM   connections
                    WHERE  id = %s
                    """,
                    (conn_id,),
                )
                conn_row = cur.fetchone()

        if not conn_row:
            return None

        return {
            "id":          job_id,
            "connection_id": conn_id,
            "provider":    conn_row["provider"],
            "credentials": conn_row["credentials"],
        }

    @staticmethod
    def update_status(job_id, status):

        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE scan_jobs SET status = %s WHERE id = %s",
                    (status, job_id),
                )

    @staticmethod
    def insert_resource(job_id, resource: dict):

        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO resources
                        (scan_job_id, resource_type, provider_resource_id, name, region, configuration)
                    VALUES
                        (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        job_id,
                        resource.get("resource_type"),
                        resource.get("provider_resource_id"),
                        resource.get("name"),
                        resource.get("region"),
                        json.dumps(resource.get("configuration", {})),
                    ),
                )

    @staticmethod
    def insert_finding(job_id, finding: dict):

        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO findings
                        (scan_job_id, resource_id, rule_id, status, details)
                    VALUES
                        (%s, %s, %s, %s, %s)
                    """,
                    (
                        job_id,
                        finding.get("resource_id"),
                        finding.get("rule_id"),
                        finding.get("status"),
                        json.dumps(finding.get("details")) if finding.get("details") else None,
                    ),
                )


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class ScanResult(BaseModel):
    findings: list
    resources: list


class StatusUpdate(BaseModel):
    status: str


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/internal/health")
def health():
    return {"status": "ok"}


@app.get("/internal/jobs/poll")
def poll_job(authorization: str | None = Header(None)):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.next_pending_job()

    if not job:
        return {"job": None}

    credentials = CredentialManager.decrypt(job["credentials"])

    return {
        "job_id":      job["id"],
        "provider":    job["provider"],
        "credentials": credentials,
    }


@app.get("/internal/jobs/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(None)):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f"Job not found: {job_id}")
        raise HTTPException(status_code=404, detail="Scan job not found")

    credentials = CredentialManager.decrypt(job["credentials"])

    return {
        "job_id":      job["id"],
        "provider":    job["provider"],
        "credentials": credentials,
    }


@app.post("/internal/jobs/{job_id}/results", status_code=201)
def submit_results(
    job_id: str, result: ScanResult, authorization: str | None = Header(None)
):

    WorkerAuth.validate(authorization)

    job = ScanDatabase.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Scan job does not exist")

    for resource in result.resources:
        ScanDatabase.insert_resource(job_id, resource)

    for finding in result.findings:
        ScanDatabase.insert_finding(job_id, finding)

    ScanDatabase.update_status(job_id, "COMPLETED")

    return


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
