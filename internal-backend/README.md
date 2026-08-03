# CloudRiskAnalyzer Internal Backend

This directory contains the Python FastAPI Internal Backend that serves the scanner workers. It handles job polling, result submission, and status updates, acting as a secure bridge between the workers and the PostgreSQL database.

## Overview

The Internal API is built using Python 3.13, FastAPI, and SQLAlchemy 2.0 as the ORM to interact with the PostgreSQL database. It runs inside a private Docker network and is not exposed to the public internet or the host machine directly.

## Endpoints

All internal API endpoints are prefixed with `/internal`.

### Job Endpoints

These endpoints interact directly with the database to manage scan jobs and are protected by a static `WORKER_API_KEY`.

- `GET /internal/jobs/poll`: Atomically claim the next `PENDING` scan job.
  - Headers: `Authorization: Bearer <WORKER_API_KEY>`
  - Returns: Job details including decrypted cloud credentials.
- `GET /internal/jobs/{job_id}`: Get the details of a specific scan job.
  - Headers: `Authorization: Bearer <WORKER_API_KEY>`
- `POST /internal/jobs/{job_id}/results`: Submit the final resources and findings of a completed scan.
  - Headers: `Authorization: Bearer <WORKER_API_KEY>`
  - Body: JSON containing `resources` array and `findings` array.
- `POST /internal/jobs/{job_id}/status`: Update the status of a specific scan job (e.g., to `FAILED`).
  - Headers: `Authorization: Bearer <WORKER_API_KEY>`
  - Body: `{ "status": "FAILED" }`

### Health Endpoint

- `GET /internal/health`: Check the health of the internal backend.
  - Validates the SQLAlchemy connection to the PostgreSQL database with a simple query.
  - Returns `200 OK` if the database is reachable, or `503 Service Unavailable` if the database is unhealthy.
