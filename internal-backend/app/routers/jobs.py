import logging

from fastapi import APIRouter, Header, HTTPException

from app.auth import WorkerAuth
from app.crypto import CredentialManager
from app.database import ScanDatabase
from app.models import ScanResult, StatusUpdate

router = APIRouter(prefix="/jobs")


@router.get("/poll")
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


@router.get("/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(None)):
    WorkerAuth.validate(authorization, job_id=job_id)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f" Scan job not found (Job ID: {job_id})")
        raise HTTPException(status_code=404, detail="Scan job not found")

    credentials = CredentialManager.decrypt(job["credentials"])

    return {
        "job_id":      job["id"],
        "provider":    job["provider"],
        "credentials": credentials,
    }


@router.post("/{job_id}/results", status_code=201)
def submit_results(
    job_id: str, result: ScanResult, authorization: str | None = Header(None)
):
    WorkerAuth.validate(authorization, job_id=job_id)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f" Scan job does not exist (Job ID: {job_id})")
        raise HTTPException(status_code=404, detail="Scan job does not exist")

    for resource in result.resources:
        ScanDatabase.insert_resource(job_id, resource.model_dump())

    for finding in result.findings:
        ScanDatabase.insert_finding(job_id, finding.model_dump())

    ScanDatabase.update_status(job_id, "COMPLETED")

    return


@router.post("/{job_id}/status")
def update_status(
    job_id: str, update: StatusUpdate, authorization: str | None = Header(None)
):
    WorkerAuth.validate(authorization, job_id=job_id)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f" Scan job does not exist (Job ID: {job_id})")
        raise HTTPException(status_code=404, detail="Scan job does not exist")

    ScanDatabase.update_status(job_id, update.status)

    return
