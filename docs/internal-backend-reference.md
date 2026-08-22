# Internal Backend Service Reference

This document describes the API endpoints, authentication mechanisms, database transaction model, and security controls for the Sahaba Internal Backend (`internal-backend`), implemented in Python with FastAPI and SQLAlchemy.

---

## 1. Overview & Isolation Architecture

The Internal Backend is a private service dedicated to coordinating with decoupled Scanner Workers.

- **Network Scope**: Enclosed entirely inside Docker `private_network` (`internal: true`).
- **External Exposure**: None. The service does not publish host ports and cannot be accessed from outside the container environment.
- **Authentication**: Bearer API token validation via `WORKER_API_KEY`:
  ```http
  Authorization: Bearer <WORKER_API_KEY>
  ```
- **Primary Roles**:
  - Securely decrypts and serves cloud provider credentials to authorized workers.
  - Ingests batch scan findings and maintains relational foreign key integrity.
  - Synchronizes the scanner's dynamic rule catalog to the PostgreSQL database.
  - Implements concurrency-safe job polling (`SKIP LOCKED`).

---

## 2. API Endpoints

### 2.1 Health Check
Verifies database connectivity (`SELECT 1`).

- **Method**: `GET`
- **Path**: `/internal/health`
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  { "status": "ok" }
  ```

### 2.2 Direct Job Retrieval
Called by the Scanner Worker after receiving a `job_id` from the Redis `scan_queue`.

- **Method**: `GET`
- **Path**: `/internal/jobs/{job_id}`
- **Auth Required**: Yes (`Bearer <WORKER_API_KEY>`)
- **Action**: Loads the scan job, verifies the associated connection, decrypts the Fernet credentials envelope in-memory, and returns the scan configuration.
- **Response**: `200 OK`
  ```json
  {
    "job_id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
    "provider": "aws",
    "credentials": {
      "aws_access_key_id": "AKIA...",
      "aws_secret_access_key": "...",
      "region_name": "us-east-1"
    }
  }
  ```

### 2.3 Atomic Job Polling (Fallback)
Used when workers pull jobs directly from the database rather than via Redis.

- **Method**: `GET`
- **Path**: `/internal/jobs/poll`
- **Auth Required**: Yes (`Bearer <WORKER_API_KEY>`)
- **Concurrency Safety**: Queries the next `PENDING` job using PostgreSQL `FOR UPDATE SKIP LOCKED`, sets `status = 'RUNNING'`, and records `started_at`.
- **Response**: `200 OK` (returns job payload if available, or `{"job": null}` if the queue is empty)

### 2.4 Update Scan Status
Updates execution lifecycle states (`RUNNING`, `FAILED`, `COMPLETED`).

- **Method**: `POST`
- **Path**: `/internal/jobs/{job_id}/status`
- **Auth Required**: Yes (`Bearer <WORKER_API_KEY>`)
- **Request Body**:
  ```json
  {
    "status": "RUNNING",
    "error_message": null
  }
  ```
- **Response**: `200 OK`

### 2.5 Submit Scan Results
Ingests discovered resources and evaluation findings in an atomic database transaction.

- **Method**: `POST`
- **Path**: `/internal/jobs/{job_id}/results`
- **Auth Required**: Yes (`Bearer <WORKER_API_KEY>`)
- **Request Body**:
  ```json
  {
    "resources": [
      {
        "id": "res-1",
        "provider_resource_id": "i-0123456789abcdef0",
        "resource_type": "EC2",
        "name": "web-production-01",
        "region": "us-east-1",
        "configuration": {
          "instance_id": "i-0123456789abcdef0",
          "public_ip": "54.210.10.5"
        }
      }
    ],
    "findings": [
      {
        "resource_id": "res-1",
        "rule_id": "AWS-EC2-001",
        "status": "FAIL",
        "details": {
          "reason": "Security group allows SSH from 0.0.0.0/0",
          "severity": "CRITICAL",
          "recommendation": "Restrict SSH to trusted CIDR blocks."
        }
      }
    ]
  }
  ```
- **Transaction Flow**:
  1. Generates permanent UUIDs for each entry in `resources`.
  2. Builds an in-memory mapping from client temporary ID (`"res-1"`) to the database UUID.
  3. Inserts all resources into `public.resources`.
  4. Flushes the transaction to satisfy PostgreSQL foreign key constraints.
  5. Inserts findings into `public.findings` with mapped `resource_id` references.
  6. Updates `public.scan_jobs` status to `COMPLETED` and sets `completed_at = NOW()`.
- **Response**: `201 Created`

### 2.6 Synchronize Rule Catalog
Called automatically during scanner daemon boot to keep the database rules reference synchronized with the code.

- **Method**: `POST`
- **Path**: `/internal/jobs/rules/sync`
- **Auth Required**: Yes (`Bearer <WORKER_API_KEY>`)
- **Request Body**: Array of rule definitions:
  ```json
  [
    {
      "id": "AWS-EC2-001",
      "provider": "aws",
      "name": "Public SSH (IPv4) Access",
      "finding_type": "ssh_open_to_internet",
      "severity": "CRITICAL",
      "description": "Security group allows port 22 inbound from 0.0.0.0/0",
      "recommendation": "Restrict port 22 to trusted IP addresses."
    }
  ]
  ```
- **Normalization**: Automatically maps severity `LOW` to database-standard `INFO` and converts strings to uppercase.
- **Upsert Logic**: Executes PostgreSQL `ON CONFLICT (id) DO UPDATE` to keep descriptions, recommendations, and finding types up to date without manual migrations.
- **Response**: `200 OK`

---

## 3. Worker Authentication & Error Handling

| Status Code | Condition | Response Payload |
| :--- | :--- | :--- |
| `401 Unauthorized` | Missing `Authorization` header | `{"detail": "Missing worker authentication"}` |
| `403 Forbidden` | Provided token does not match `WORKER_API_KEY` | `{"detail": "Invalid worker credentials"}` |
| `400 Bad Request` | Payload validation failure | `{"detail": "Invalid scan result format"}` |
| `404 Not Found` | Target job ID does not exist | `{"detail": "Scan job not found"}` |
