# Redis-Driven Scanner Worker Design

## 1. Overview

This document specifies the design for a **Redis-driven event-queue architecture** for the Cloud Risk Analyzer platform. 

Instead of having the Scanner Worker continuously poll the database over HTTP, we introduce a **Redis message broker**. The backend pushes new jobs to Redis as they are triggered, and the Scanner Worker blocks (sleeps in memory) until Redis wakes it up with a new job ID.

---

## 2. Comparison: Old Polling Plan vs. Redis Queue Plan

| Feature | Old Polling Plan (`scanner-design.md`) | Redis Queue Plan (`redis-scanner-design.md`) |
| :--- | :--- | :--- |
| **Worker Idle CPU Usage** | Low but continuous (spins, sleeps, and requests every 10 seconds). | **0% CPU** (Process is put to sleep by the OS kernel while waiting on socket). |
| **Job Start Latency** | Up to 10 seconds (depends on polling interval). | **Sub-millisecond** (Instantly wakes up when pushed). |
| **Network Traffic** | High (continuous HTTP requests when idle). | **Zero** network requests while idle. |
| **Concurrency Scaling** | Relies on DB-level lock (`skip_locked=True`). | Relies on Redis native atomic queue distribution (round-robin to free workers). |
| **Infrastructure Complexity**| Low (no extra containers needed). | Moderate (requires a Redis container in `docker-compose`). |

---

## 3. System Architecture & Flow

```text
+---------------------------------------------------------------------------------------------------+
|                                          PRIVATE NETWORK                                          |
|                                                                                                   |
|  +--------------------+  1. User triggers scan   +---------------------+                          |
|  |     Public API     | -----------------------> |     PostgreSQL      |                          |
|  |     (Express)      |                          |     (App Database)  |                          |
|  +--------------------+                          +---------------------+                          |
|            |                                                                                      |
|            | 2. RPUSH scan_queue <job_id>                                                         |
|            v                                                                                      |
|  +--------------------+                                                                           |
|  |    Redis Broker    |                                                                           |
|  |  (In-Memory Queue) |                                                                           |
|  +--------------------+                                                                           |
|            |                                                                                      |
|            | 3. TCP Push (Unblocks BLPOP)                                                         |
|            v                                                                                      |
|  +--------------------+  4. GET /jobs/<job_id>   +---------------------+                          |
|  |   Scanner Worker   | -----------------------> |  Internal Backend   |                          |
|  |  (Python Daemon)   | <----------------------- |  (FastAPI / Pytest) |                          |
|  +--------------------+   Credentials (Decrypted)+---------------------+                          |
|            |                                                                                      |
|            | 5. Run Audit Rules                                                                   |
|            v                                                                                      |
|  +--------------------+                                                                           |
|  | Cloud Providers API|                                                                           |
|  +--------------------+                                                                           |
+---------------------------------------------------------------------------------------------------+
```

### Flow Step-by-Step:
1. **Trigger Scan**: A user makes a request to `POST /api/scans` (Web API).
2. **Database Record**: The Web API inserts the scan job record with status `PENDING` into PostgreSQL.
3. **Queue Notification**: The Web API executes `RPUSH scan_queue <job_id>` in Redis.
4. **Wake Up**: Redis pushes the `job_id` to one of the waiting scanner workers holding a `BLPOP scan_queue 0` socket open.
5. **Fetch Details**: The newly awakened worker calls `GET /internal/jobs/{job_id}` on the Internal Backend to retrieve the decrypted credentials securely.
6. **Execution & Results**: The worker runs the scan rules and uploads findings to `/internal/jobs/{job_id}/results`.

---

## 4. Modified Data Schemas & Constraints (Fixes Schema Mismatches)

To satisfy PostgreSQL foreign key constraints and the FastAPI `ScanResult` pydantic model, the payload format submitted by the worker to `/results` must link resources and findings using **temporary client-side mapping IDs** (`id` and `resource_id`):

### Final Compliant Result Payload (Sent to `/results`):
```json
{
  "resources": [
    {
      "id": "res-01", 
      "provider_resource_id": "arn:aws:s3:::my-public-reports",
      "resource_type": "s3",
      "name": "my-public-reports",
      "region": "us-east-1",
      "configuration": {
        "is_public": true
      }
    }
  ],
  "findings": [
    {
      "resource_id": "res-01",
      "rule_id": "AWS-S3-001",
      "status": "FAIL",
      "details": {
        "reason": "Bucket permissions set to public read."
      }
    }
  ]
}
```

---

## 5. Implementation Roadmap

### Step 5.1: Redis Service Configuration
Add a lightweight Redis service to `docker-compose.yml`:
```yaml
  redis:
    image: redis:7-alpine
    container_name: redis_container
    restart: unless-stopped
    networks:
      - private_network
```

### Step 5.2: Install Redis Clients
* **Web API**: Install `redis` client via npm (`npm install redis`).
* **Scanner**: Install `redis` client via pip (add `redis` to `requirements.txt`).

### Step 5.3: Update Web API Trigger Controller
Modify the `createScan` controller in the Web API:
* Import `redis`.
* On scan creation, run `rpush('scan_queue', scanJobId)` to notify the queue.

### Step 5.4: Implement Scanner Components
* **`scanner/api_client.py`**: Handles API requests to `/internal/jobs/{job_id}` and `/results` using the header `Authorization: Bearer <WORKER_API_KEY>`.
* **`scanner/runner.py`**: Executes AWS/GCP/OCI audits, formats payloads using the temporary client-side `id` mapping format, and maps rule IDs to database keys (e.g. `S3-001` -> `AWS-S3-001`).
* **`scanner/worker.py`**: The background daemon utilizing the `blpop` event loop.
