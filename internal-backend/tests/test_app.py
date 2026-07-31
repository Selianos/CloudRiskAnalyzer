from fastapi.testclient import TestClient

from app.main import app
from app.main import WORKER_API_KEY

client = TestClient(app)


VALID_AUTH = {
    "Authorization": f"Bearer {WORKER_API_KEY}"
}


# --------------------------------------------------
# Health Endpoint
# --------------------------------------------------

def test_health():

    response = client.get(
        "/internal/health"
    )

    assert response.status_code == 200

    assert response.json() == {
        "status": "ok"
    }


# --------------------------------------------------
# Authentication Tests
# --------------------------------------------------

def test_missing_worker_auth():

    response = client.get(
        "/internal/jobs/test-id"
    )

    assert response.status_code == 401

    assert response.json()["detail"] == (
        "Missing worker authentication"
    )


def test_invalid_worker_auth():

    response = client.get(
        "/internal/jobs/test-id",
        headers={
            "Authorization":
            "Bearer wrong-key"
        }
    )

    assert response.status_code == 403

    assert response.json()["detail"] == (
        "Invalid worker credentials"
    )


# --------------------------------------------------
# Get Job Tests
# --------------------------------------------------

def test_get_existing_job(
    mocker
):

    fake_job = {

        "id": "job123",

        "connections": {

            "provider": "aws",

            "credentials":
                "encrypted"
        }
    }

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value=fake_job
    )

    mocker.patch(
        "app.main.CredentialManager.decrypt",
        return_value={
            "access_key": "abc",
            "secret": "xyz"
        }
    )

    response = client.get(
        "/internal/jobs/job123",
        headers=VALID_AUTH
    )

    assert response.status_code == 200

    assert response.json() == {

        "job_id": "job123",

        "provider": "aws",

        "credentials": {

            "access_key": "abc",

            "secret": "xyz"
        }
    }


def test_get_missing_job(
    mocker
):

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value=None
    )

    response = client.get(
        "/internal/jobs/not-found",
        headers=VALID_AUTH
    )

    assert response.status_code == 404

    assert response.json()["detail"] == (
        "Scan job not found"
    )


# --------------------------------------------------
# Poll Queue Tests
# --------------------------------------------------

def test_poll_job_available(
    mocker
):

    fake_job = {

        "id": "job555",

        "connections": {

            "provider": "gcp",

            "credentials":
                "encrypted"
        }
    }

    mocker.patch(
        "app.main.ScanDatabase.next_pending_job",
        return_value=fake_job
    )

    mocker.patch(
        "app.main.CredentialManager.decrypt",
        return_value={
            "service_account": "json"
        }
    )

    response = client.get(
        "/internal/jobs/poll",
        headers=VALID_AUTH
    )

    assert response.status_code == 200

    assert response.json()["job_id"] == (
        "job555"
    )


def test_poll_no_job_available(
    mocker
):

    mocker.patch(
        "app.main.ScanDatabase.next_pending_job",
        return_value=None
    )

    response = client.get(
        "/internal/jobs/poll",
        headers=VALID_AUTH
    )

    assert response.status_code == 200

    assert response.json() == {
        "job": None
    }


# --------------------------------------------------
# Result Submission Tests
# --------------------------------------------------

def test_submit_results_success(
    mocker
):

    fake_job = {

        "id": "job1"

    }

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value=fake_job
    )

    insert_mock = mocker.patch(
        "app.main.supabase.table"
    )

    mocker.patch(
        "app.main.ScanDatabase.update_status"
    )

    payload = {

        "resources": [

            {

                "resource_type":
                    "aws_s3_bucket",

                "provider_resource_id":
                    "bucket1",

                "name":
                    "test",

                "configuration":
                    {}
            }

        ],

        "findings": [

            {

                "resource_id":
                    "abc",

                "rule_id":
                    "SEC-001",

                "status":
                    "FAIL"

            }

        ]

    }

    response = client.post(

        "/internal/jobs/job1/results",

        headers=VALID_AUTH,

        json=payload
    )

    assert response.status_code == 201

    assert insert_mock.called


def test_submit_results_invalid_job(
    mocker
):

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value=None
    )

    response = client.post(

        "/internal/jobs/no-job/results",

        headers=VALID_AUTH,

        json={
            "resources": [],
            "findings": []
        }
    )

    assert response.status_code == 404


# --------------------------------------------------
# Status Update Tests
# --------------------------------------------------

def test_update_status_success(
    mocker
):

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value={
            "id": "job1"
        }
    )

    update = mocker.patch(
        "app.main.ScanDatabase.update_status"
    )

    response = client.post(

        "/internal/jobs/job1/status",

        headers=VALID_AUTH,

        json={
            "status":
            "RUNNING"
        }
    )

    assert response.status_code == 200

    update.assert_called_once_with(
        "job1",
        "RUNNING"
    )


def test_update_status_missing_job(
    mocker
):

    mocker.patch(
        "app.main.ScanDatabase.get_job",
        return_value=None
    )

    response = client.post(

        "/internal/jobs/job999/status",

        headers=VALID_AUTH,

        json={
            "status":
            "RUNNING"
        }
    )

    assert response.status_code == 404


# --------------------------------------------------
# Encryption Tests
# --------------------------------------------------

def test_credentials_encrypt_decrypt():

    from cryptography.fernet import Fernet

    key = Fernet.generate_key()

    cipher = Fernet(key)

    original = {

        "username":
            "admin",

        "password":
            "secret"

    }

    encrypted = cipher.encrypt(
        str(original).encode()
    )

    decrypted = cipher.decrypt(
        encrypted
    )

    assert "admin" in (
        decrypted.decode()
    )
