from unittest.mock import patch
import pytest
from sqlalchemy.exc import IntegrityError

MOCK_HEADERS = {"Authorization": "Bearer test_worker_key_12345"}
MOCK_JOB_ID = "651c814e-faeb-4e91-b8e7-92ec079ead1e"

# -------------------------------------------------------------
# Health Check Tests
# -------------------------------------------------------------
@patch("app.database.ScanDatabase.check_db")
def test_health_healthy(mock_check_db, client):
    mock_check_db.return_value = True
    res = client.get("/internal/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "healthy"}

@patch("app.database.ScanDatabase.check_db")
def test_health_unhealthy(mock_check_db, client):
    mock_check_db.return_value = False
    res = client.get("/internal/health")
    assert res.status_code == 503
    assert res.json() == {"status": "error", "database": "unhealthy"}

# -------------------------------------------------------------
# Worker Authentication Middleware Tests
# -------------------------------------------------------------
def test_auth_missing_header(client):
    res = client.get("/internal/jobs/poll")
    assert res.status_code == 401
    assert res.json()["detail"] == "Missing worker authentication"

def test_auth_invalid_header(client):
    res = client.get("/internal/jobs/poll", headers={"Authorization": "Bearer invalid_key"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Invalid worker credentials"

# -------------------------------------------------------------
# Poll Job Endpoint Tests
# -------------------------------------------------------------
@patch("app.database.ScanDatabase.next_pending_job")
def test_poll_no_jobs(mock_next_job, client):
    mock_next_job.return_value = None
    res = client.get("/internal/jobs/poll", headers=MOCK_HEADERS)
    assert res.status_code == 200
    assert res.json() == {"job": None}

@patch("app.database.ScanDatabase.next_pending_job")
def test_poll_job_success(mock_next_job, client):
    mock_job = {
        "id": MOCK_JOB_ID,
        "provider": "aws",
        "credentials": {"aws_access_key_id": "test-key"}
    }
    mock_next_job.return_value = mock_job
    res = client.get("/internal/jobs/poll", headers=MOCK_HEADERS)
    assert res.status_code == 200
    assert res.json() == {
        "job_id": MOCK_JOB_ID,
        "provider": "aws",
        "credentials": {"aws_access_key_id": "test-key"}
    }

# -------------------------------------------------------------
# Get Job Endpoint Tests
# -------------------------------------------------------------
@patch("app.database.ScanDatabase.get_job")
def test_get_job_not_found(mock_get_job, client):
    mock_get_job.return_value = None
    res = client.get(f"/internal/jobs/{MOCK_JOB_ID}", headers=MOCK_HEADERS)
    assert res.status_code == 404
    assert res.json()["detail"] == "Scan job not found"

@patch("app.database.ScanDatabase.get_job")
def test_get_job_success(mock_get_job, client):
    mock_job = {
        "id": MOCK_JOB_ID,
        "provider": "gcp",
        "credentials": {"project_id": "test-project"}
    }
    mock_get_job.return_value = mock_job
    res = client.get(f"/internal/jobs/{MOCK_JOB_ID}", headers=MOCK_HEADERS)
    assert res.status_code == 200
    assert res.json() == {
        "job_id": MOCK_JOB_ID,
        "provider": "gcp",
        "credentials": {"project_id": "test-project"}
    }

# -------------------------------------------------------------
# Update Status Endpoint Tests
# -------------------------------------------------------------
@patch("app.database.ScanDatabase.get_job")
def test_update_status_not_found(mock_get_job, client):
    mock_get_job.return_value = None
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/status",
        headers=MOCK_HEADERS,
        json={"status": "RUNNING"}
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Scan job does not exist"

@patch("app.database.ScanDatabase.update_status")
@patch("app.database.ScanDatabase.get_job")
def test_update_status_success(mock_get_job, mock_update, client):
    mock_get_job.return_value = {"id": MOCK_JOB_ID}
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/status",
        headers=MOCK_HEADERS,
        json={"status": "RUNNING"}
    )
    assert res.status_code == 200
    mock_update.assert_called_once_with(MOCK_JOB_ID, "RUNNING")

def test_update_status_invalid_format(client):
    # Send empty json body, should trigger FastAPI request validation handler
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/status",
        headers=MOCK_HEADERS,
        json={}
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid scan result format"

# -------------------------------------------------------------
# Submit Results Endpoint Tests
# -------------------------------------------------------------
@patch("app.database.ScanDatabase.get_job")
def test_submit_results_not_found(mock_get_job, client):
    mock_get_job.return_value = None
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/results",
        headers=MOCK_HEADERS,
        json={"resources": [], "findings": []}
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Scan job does not exist"

@patch("app.database.ScanDatabase.save_scan_results")
@patch("app.database.ScanDatabase.get_job")
def test_submit_results_success(mock_get_job, mock_save, client):
    mock_get_job.return_value = {"id": MOCK_JOB_ID}
    payload = {
        "resources": [
            {
                "id": "res-1",
                "resource_type": "s3",
                "provider_resource_id": "arn",
                "name": "bucket",
                "configuration": {}
            }
        ],
        "findings": [
            {
                "resource_id": "res-1",
                "rule_id": "rule-1",
                "status": "FAIL",
                "details": {}
            }
        ]
    }
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/results",
        headers=MOCK_HEADERS,
        json=payload
    )
    assert res.status_code == 201
    mock_save.assert_called_once()
    args, _ = mock_save.call_args
    assert args[0] == MOCK_JOB_ID
    assert args[1]["resources"][0]["id"] == "res-1"
    assert args[1]["findings"][0]["resource_id"] == "res-1"

@patch("app.database.ScanDatabase.save_scan_results")
@patch("app.database.ScanDatabase.get_job")
def test_submit_results_invalid_format(mock_get_job, mock_save, client):
    mock_get_job.return_value = {"id": MOCK_JOB_ID}
    # Simulate DB ValueError on format validation (e.g. unknown resource reference)
    mock_save.side_effect = ValueError("Invalid resource ID")
    
    # Send a Pydantic-valid payload so it passes validation but triggers our DB mock error
    payload = {
        "resources": [],
        "findings": [
            {
                "resource_id": "unknown",
                "rule_id": "rule-1",
                "status": "FAIL"
            }
        ]
    }
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/results",
        headers=MOCK_HEADERS,
        json=payload
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid resource ID"

@patch("app.database.ScanDatabase.save_scan_results")
@patch("app.database.ScanDatabase.get_job")
def test_submit_results_integrity_error(mock_get_job, mock_save, client):
    mock_get_job.return_value = {"id": MOCK_JOB_ID}
    # Simulate database IntegrityError (e.g. invalid rule_id)
    mock_save.side_effect = IntegrityError("statement", "params", "orig")

    payload = {
        "resources": [],
        "findings": [
            {
                "resource_id": "res-1",
                "rule_id": "invalid-rule-id",
                "status": "FAIL"
            }
        ]
    }
    res = client.post(
        f"/internal/jobs/{MOCK_JOB_ID}/results",
        headers=MOCK_HEADERS,
        json=payload
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid rule_id or foreign key constraint violation"
