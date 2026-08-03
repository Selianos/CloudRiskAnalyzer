import logging

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

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
        return JSONResponse(content={"job": None})

    credentials = CredentialManager.decrypt(job["credentials"])

    return JSONResponse(content={
        "job_id":      job["id"],
        "provider":    job["provider"],
        "credentials": credentials,
    })


@router.get("/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(None)):
    WorkerAuth.validate(authorization, job_id=job_id)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f" Scan job not found (Job ID: {job_id})")
        raise HTTPException(status_code=404, detail="Scan job not found")

    credentials = CredentialManager.decrypt(job["credentials"])

    return JSONResponse(content={
        "job_id":      job["id"],
        "provider":    job["provider"],
        "credentials": credentials,
    })


@router.post("/{job_id}/results", status_code=201)
def submit_results(
    job_id: str, result: ScanResult, authorization: str | None = Header(None)
):
    WorkerAuth.validate(authorization, job_id=job_id)

    job = ScanDatabase.get_job(job_id)

    if not job:
        logging.error(f" Scan job does not exist (Job ID: {job_id})")
        raise HTTPException(status_code=404, detail="Scan job does not exist")

    from sqlalchemy.exc import IntegrityError
    try:
        ScanDatabase.save_scan_results(job_id, result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError as e:
        logging.error(f"Integrity Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid rule_id or foreign key constraint violation")

    return JSONResponse(
        status_code=201,
        content={"status": "created", "message": "Results submitted successfully"}
    )


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

    return JSONResponse(content={"status": "ok", "message": "Status updated successfully"})
