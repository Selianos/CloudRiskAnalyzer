# Internal Backend Service Design for Scanner Platform

## 1. Overview

The Internal Backend Service is a private backend service responsible for secure communication
between the scanner workers and the platform backend.

This service is not used by customers and must not be exposed to the public internet.

Its responsibilities are:

- Provide scan jobs to scanner workers
- Provide cloud provider credentials securely
- Receive scan results from workers
- Update scan status
- Protect sensitive operations from internet access

## 2. Architecture

```
Internet

    |
    |

Frontend Application

    |
    |

Public Backend API

    |
    |
----------------------------

Database

Job Queue

----------------------------

Private Network

    |
    |

Internal Backend Service

    |
    |

Scanner Workers

    |
    |

AWS / OCI / GCP APIs
```

## 3. Why Create a Separate Internal Backend?

The public backend is designed for customers.

Example public endpoints:

```
/api/login
/api/scans
/api/results
```

The internal backend is designed only for scanner workers.

Example internal endpoints:

```
/internal/jobs
/internal/results
```

Benefits:

- Smaller attack surface
- Better security isolation
- Clear separation between users and workers
- Easier monitoring
- Easier scaling

## 4. Technology Options

### Option 1: Python

Language:

```
Python
```

Framework examples:

- FastAPI
- Flask

### Option 2: JavaScript

Language:

```
JavaScript / Node.js
```

Framework examples:

- Express.js
- NestJS

## 5. Docker Isolation

The internal backend must run as a separate Docker service.

Example structure:

```
project/

    frontend/

    public-backend/

    internal-backend/

    scanner/

    docker-compose.yml
```

The internal backend should not expose ports to the internet.

## 6. Docker Network Isolation

The internal backend should run inside a private Docker network.

```yaml
services:

  public-backend:

    ports:
      - "443:3000"

    networks:
      - public-network



  internal-backend:

    networks:
      - private-network



  scanner:

    networks:
      - private-network



networks:

  public-network:


  private-network:

    internal: true
```

### What does internal: true mean?

- The network is not reachable from outside Docker
- No public internet access
- Only connected containers can communicate

Result:

```
Internet

    X

Internal Backend

    |

Scanner
```

## 7. Environment Variables

The internal backend uses environment variables for secrets.

```
.env


WORKER_API_KEY=random-long-secret-key

POSTGRES_HOST=postgres
POSTGRES_DB=cradb
POSTGRES_USER=admin
POSTGRES_PASSWORD=StrongPassword123
POSTGRES_PORT=5432

DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

ENCRYPTION_KEY=encryption-key
```

Secrets must never be hardcoded inside the source code.

## 8. Worker Authentication

Even though the service is private, workers must authenticate.

Worker sends:

```
Authorization: Bearer WORKER_API_KEY
```

Internal backend checks:

- Is the worker allowed?
- Is the key correct?

## 9. API Endpoint Structure

| Method | Path | Description |
|--------|------|--------------|
| GET | /internal/jobs/{job_id} | Worker retrieves scan information and credentials |
| GET | /internal/jobs/poll | Worker polls for the next available scan job |
| POST | /internal/jobs/{job_id}/results | Worker uploads scan results |
| POST | /internal/jobs/{job_id}/status | Worker updates scan progress |
| GET | /internal/health | Service health check |

## 10. Endpoint: Get Scan Job

### Method

```
GET
```

### Path

```
/internal/jobs/{job_id}
```

### Purpose

The scanner worker requests the scan details required to start scanning.

### Steps Inside Endpoint

1. Receive worker request
2. Validate worker authentication key
3. Validate job ID
4. Load job from database
5. Check job status
6. Decrypt cloud credentials
7. Return scan configuration

### Success

Status:

```
200 OK
```

When:

The worker is authenticated and the job exists. No response message body is required for this
success case, since this is a service-to-service call; the job payload itself is sufficient
confirmation and there is no need to log or return a "Job returned successfully" style message.

### Error Cases

Missing authentication:

```
401 Unauthorized

Message:
Missing worker authentication
```

Invalid key:

```
403 Forbidden

Message:
Invalid worker credentials
```

Job does not exist:

```
404 Not Found

Message:
Scan job not found
```

All error responses above must be logged for audit purposes, including worker identity,
timestamp, job ID, and failure reason.

## 11. Endpoint: Poll for Scan Jobs

### Method

```
GET
```

### Path

```
/internal/jobs/poll
```

### Purpose

Allows a scanner worker to ask the internal backend whether a new job is available to work on,
instead of being assigned a job ID directly. Useful for workers that pull work from a shared
queue rather than being pushed a specific job.

### Steps Inside Endpoint

1. Receive worker request
2. Validate worker authentication key
3. Query database/queue for next pending job matching worker capabilities
4. Lock or reserve the job for this worker, if one is found
5. Decrypt cloud credentials for the returned job
6. Return job payload, or an empty result if no job is available

### Success

```
200 OK
```

When a job is available, the response body contains the job configuration and credentials.
When no job is available, the response body indicates an empty result (no job to process).
No informational message is logged for either case, since this is routine internal
service-to-service polling.

### Error Cases

```
401 Unauthorized

Message:
Missing worker authentication
```

```
403 Forbidden

Message:
Invalid worker credentials
```

All error responses above must be logged for audit purposes.

## 12. Endpoint: Submit Scan Results

### Method

```
POST
```

### Path

```
/internal/jobs/{job_id}/results
```

### Purpose

Scanner worker sends the completed scan findings.

### Steps Inside Endpoint

1. Authenticate worker
2. Validate job exists
3. Validate result format
4. Store findings
5. Update scan status
6. Notify public backend

### Success

```
201 Created
```

When:

Results are successfully validated and stored. No confirmation message is required in the
response body for this success case, since this is a service-to-service call and the 201
status code is sufficient.

### Error Cases

```
400 Bad Request

Message:
Invalid scan result format
```

When:

Worker sends incorrect data.

```
404 Not Found

Message:
Scan job does not exist
```

When:

The job ID is invalid.

All error responses above must be logged for audit purposes.

## 13. Important Security Rules

- The internal backend must have no public IP.
- Do not expose internal ports in Docker.
- Do not place secrets inside the queue.
- Always authenticate workers.
- Encrypt cloud credentials in the database.
- Keep audit logs for worker actions, especially all error responses, even though routine success messages between internal services are not logged.

## 14. Final Workflow

```
Customer

   |

Frontend

   |

Public Backend

   |

Encrypt Credentials
Create Job

   |

Queue

   |

Scanner

   |

Internal Backend Authentication

   |

Receive Job + Credentials
(via direct fetch or poll endpoint)

   |

Run Cloud Scan

   |

Send Results

   |

Database

   |

Frontend Displays Results
```

## Summary

The internal backend is a private service between the platform backend and scanner workers.
It should run in Docker as an isolated service with no public exposure.
Communication is protected using private networking, environment-based secrets,
and worker authentication. Routine success responses between services are kept minimal,
while all errors are logged for audit purposes.
