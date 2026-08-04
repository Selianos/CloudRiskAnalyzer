# CloudRiskAnalyzer Public API

This directory contains the Express.js Public API backend that serves the frontend application. It handles user authentication, cloud connections (AWS, GCP, OCI), and scan jobs.

---

## 1. Environment & Configuration

The Public API requires the following environment variables (which are automatically pre-configured in `docker-compose.yml`):
* `ENCRYPTION_KEY`: A 32-byte URL-safe base64 Fernet key used to encrypt connection credentials before writing to PostgreSQL.
* `REDIS_URL`: Connection string for the Redis queue broker (e.g. `redis://redis:6379/0`).

---

## 2. API Endpoints

All public API endpoints are prefixed with `/api` and require `Authorization: Bearer <JWT_TOKEN>` (except login/register).

### Authentication Endpoints
Interacts with the GoTrue identity service:
* `POST /api/auth/register` - Create user.
* `POST /api/auth/login` - Authenticate user and return a JWT access token.
* `POST /api/auth/logout` - Revoke JWT session.

### Cloud Connections Endpoints
Manages cloud account settings. Credentials payloads are encrypted:
* `GET /api/connections` - List all connections (raw credentials are stripped for safety).
* `POST /api/connections` - Register a connection (credentials are Fernet-encrypted).
* `GET /api/connections/:id` - Get connection details (credentials stripped).
* `PUT /api/connections/:id` - Update connection name or credentials.
* `DELETE /api/connections/:id` - Delete connection.

### Scan Operations Endpoints
Triggers and retrieves audits:
* `GET /api/scans` - List all scans history.
* `POST /api/scans` - Trigger a scan (saves a `PENDING` job and publishes its ID to Redis queue).
* `GET /api/scans/:scan_id` - Fetch scan metadata and status (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`).
* `GET /api/scans/:scan_id/results` - Fetch scan results (joins findings with resource detail).

---

## 3. Running Unit Tests

The test suite has been migrated to **Vitest**. To run the tests locally or in the container:
```bash
# Run tests inside the web_api container
docker exec web_api_container npm test

# Run tests directly in this folder (requires npm install)
npm test
```
