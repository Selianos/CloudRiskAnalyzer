# CloudRiskAnalyzer Internal Backend

This directory contains the Python FastAPI Internal Backend that serves the scanner workers. It handles job metadata retrieval, result submission, and status updates, acting as a secure bridge between the workers and the PostgreSQL database.

It runs inside a **private Docker network** and is not exposed to the public internet or the host machine directly.

---

## 1. Overview & Security

* **Worker Authentication**: All endpoints require an `Authorization: Bearer <WORKER_API_KEY>` header.
* **Credentials Decryption**: It accesses the shared `ENCRYPTION_KEY` environment variable on startup. When a worker requests job details via `GET /internal/jobs/{job_id}`, it automatically decrypts the connection's credentials from PostgreSQL and returns them securely in-memory.

---

## 2. API Endpoints

All internal endpoints are prefixed with `/internal`.

### Job Endpoints
* `GET /internal/jobs/{job_id}`: Get the details of a specific scan job (including decrypted credentials).
* `POST /internal/jobs/{job_id}/status`: Update the status of a specific scan job (e.g. to `RUNNING` or `FAILED`).
  - Body: `{ "status": "RUNNING" }`
* `POST /internal/jobs/{job_id}/results`: Submit the final resources and findings of a completed scan.
  - Body: JSON object matching the `ScanResult` Pydantic model (`{"resources": [...], "findings": [...]}`).
  - Action: Inserts resources and findings to the database, maps relations, and automatically marks the scan job status as `COMPLETED`.

### Health Check Endpoint
* `GET /internal/health`: Checks that the database connection is active and responsive. Returns `200 OK` or `503 Service Unavailable`.

---

## 3. Database Constraints & Payload Formats

To successfully submit results to `/results`, the scanner payload must conform to the database foreign key and model structure:
1. **Client-Side IDs**: Every item in `resources` must have a temporary client-side generated key (e.g. `id: "res-1"`). Findings must link back to these resources using the `resource_id` field (e.g., `resource_id: "res-1"`).
2. **Rule IDs Constraint**: Any `rule_id` in a finding must exist in the database `rules` catalog (e.g. `AWS-S3-001`, `AWS-EC2-001`, `AWS-IAM-001`). Unknown rule IDs will trigger an `IntegrityError` (Foreign Key Constraint Failure).

---

## 4. Running Unit Tests

The backend uses **Pytest** for unit testing. To run the tests inside the Docker container:
```bash
docker exec internal_backend_container pytest /app/tests
```
