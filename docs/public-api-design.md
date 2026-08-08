# Public API (Backend) Design

## 1. Overview

The Public API (Public Backend) is the internet-facing service designed to serve the Customer Frontend Application. 

Unlike the Internal Backend, this service:
- Is exposed to the public internet (typically via HTTPS).
- Handles customer user accounts and authentication.
- Allows users to configure their cloud accounts.
- Triggers scan jobs (which are then picked up by the Scanner Workers via the queue).
- Retrieves scan results from the database to display to the user.

## 2. Architecture Context

```
Customer (Browser)
       |
       v
  Frontend Application
       |
       v
+-----------------------+
|  Public API Backend   | <--- (This Service)
+-----------------------+
       |
       +---> Database (Stores users, encrypted credentials, results)
       |
       +---> Job Queue (Creates scan jobs for workers)
```

## 3. Public Endpoints

All endpoints are prefixed with `/api`. All endpoints (except login/register) require standard user authentication (e.g., a JWT token or Session Cookie).

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create a new user account. |
| POST | `/api/auth/login` | Authenticate a user and return a session token/JWT and refresh token. |
| POST | `/api/auth/logout` | End the user's session by invalidating tokens. |
| POST | `/api/auth/refresh` | Obtain a new access token using a valid refresh token. |
| GET | `/api/auth/me` | Retrieve the authenticated user's profile and metadata from GoTrue. |

### Cloud Connections (Credentials)
Users need to provide read-only credentials so the platform can scan their cloud accounts. The Public API encrypts these before saving them to the database.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/connections` | List all cloud accounts connected by the user. |
| POST | `/api/connections` | Connect a new cloud account (AWS, GCP, OCI). |
| DELETE | `/api/connections/{id}` | Delete a connected cloud account. |

### Scans (Jobs)
Users use these endpoints to start a scan and check if it is running, completed, or failed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scans` | List the history of all scans (running and completed). |
| POST | `/api/scans` | Trigger a new manual scan for a specific connection. The API pushes this job to the Queue. |
| GET | `/api/scans/{scan_id}` | Check the current status of a specific scan (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`). |

### Results / Findings
Once the internal workers finish scanning, users can view the security risks discovered.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scans/{scan_id}/results` | Get the detailed list of failed security rules and vulnerable resources for a specific scan. |
| GET | `/api/dashboard/summary` | Get high-level statistics (e.g., total critical vulnerabilities, overall score) for the frontend dashboard. |

## 4. Security Rules for the Public API

1. **Authentication:** All routes (except `/auth/*`) must strictly verify the user's token.
2. **Authorization:** A user must only be able to view their own `connections`, `scans`, and `results`.
3. **Encryption:** Cloud credentials submitted via `POST /api/connections` must be immediately encrypted before they touch the database. The Public API should never return raw decrypted credentials in any `GET` request.
4. **Input Validation:** Ensure all user inputs are strictly validated to prevent SQL Injection or Cross-Site Scripting (XSS).
