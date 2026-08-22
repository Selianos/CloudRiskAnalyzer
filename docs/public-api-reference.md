# Public Web API Reference

This document provides the complete API specification for the Sahaba Public Web API (`web-api`), running on Node.js/Express with Prisma ORM.

---

## 1. Overview & Authentication Model

- **Base URL**: `http://localhost:3000` (or configured `PORT`)
- **Protocol**: HTTP/1.1 with JSON request and response payloads
- **Authentication**: JWT Bearer token passed in the `Authorization` header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Identity Provider**: Supabase GoTrue standalone auth engine (port 9999). The Web API proxies auth requests to GoTrue and verifies returned tokens against `GOTRUE_JWT_SECRET`.

---

## 2. Authentication Endpoints (`/api/auth`)

These endpoints proxy directly to Supabase GoTrue to handle user account lifecycles.

### 2.1 Sign Up / Register
Creates a new user account.

- **Method**: `POST`
- **Path**: `/api/auth/signup` (Alias: `/api/auth/register`)
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "analyst@example.com",
    "password": "SecurePassword123!",
    "fullname": "Cloud Security Analyst"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "6e7b3ee1-db4a-4ef5-a81a-c4b4aafbc255",
    "email": "analyst@example.com",
    "created_at": "2026-08-22T12:00:00.000Z",
    "user_metadata": {
      "fullname": "Cloud Security Analyst",
      "role": "individual"
    }
  }
  ```

### 2.2 Login
Authenticates an existing user and returns access and refresh tokens.

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "analyst@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "d8a7c6b5...",
    "user": {
      "id": "6e7b3ee1-db4a-4ef5-a81a-c4b4aafbc255",
      "email": "analyst@example.com",
      "user_metadata": { "fullname": "Cloud Security Analyst" }
    }
  }
  ```

### 2.3 Refresh Session
Exchanges a valid refresh token for a renewed access token.

- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "refresh_token": "d8a7c6b5..."
  }
  ```
- **Response**: `200 OK` (returns updated token bundle)

### 2.4 Logout
Invalidates the current session.

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `204 No Content`

### 2.5 Get Current Profile
Fetches authenticated user identity and metadata.

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`
  ```json
  {
    "user": {
      "id": "6e7b3ee1-db4a-4ef5-a81a-c4b4aafbc255",
      "email": "analyst@example.com",
      "user_metadata": { "fullname": "Cloud Security Analyst" }
    }
  }
  ```

### 2.6 Update Password
Changes the user's password after re-verifying current credentials.

- **Method**: `PUT`
- **Path**: `/api/auth/password`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response**: `200 OK`

---

## 3. Cloud Connection Endpoints (`/api/connections`)

Manages cloud provider credentials. Credentials are encrypted using Fernet (AES-128-CBC + HMAC-SHA256) before database persistence and are never exposed in GET responses.

### 3.1 Public Provider Info
Returns supported cloud providers and versions.

- **Method**: `GET`
- **Path**: `/api/connections/public-info`
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  {
    "supported_providers": ["aws", "gcp", "oci"],
    "version": "1.0.0"
  }
  ```

### 3.2 List User Connections
Retrieves all registered cloud connections for the authenticated user, including the latest scan summary.

- **Method**: `GET`
- **Path**: `/api/connections`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "6ecf4951-6d11-4d47-83c9-eeca64cbd732",
      "name": "Production AWS Account",
      "provider": "aws",
      "ccc_applicability": "CSP",
      "data_classification_level": "Level 1",
      "created_at": "2026-08-22T10:00:00.000Z",
      "latest_scan": {
        "id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
        "status": "COMPLETED",
        "completed_at": "2026-08-22T10:05:00.000Z",
        "findings_count": 2
      }
    }
  ]
  ```

### 3.3 Create Connection
Registers a new cloud connection with encrypted credentials.

- **Method**: `POST`
- **Path**: `/api/connections`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "name": "Production AWS Account",
    "provider": "aws",
    "credentials": {
      "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
      "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "region_name": "us-east-1"
    },
    "ccc_applicability": "CSP",
    "data_classification_level": "Level 1"
  }
  ```
- **Response**: `201 Created` (sanitized connection object, credentials omitted)

### 3.4 Delete Connection
Removes a connection. Associated scan jobs, resources, and findings cascade delete.

- **Method**: `DELETE`
- **Path**: `/api/connections/:id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`

---

## 4. Scan Management Endpoints (`/api/scans`)

Handles triggering scans, polling status, and fetching compliance-enriched findings.

### 4.1 List User Scans
Retrieves scan history for the authenticated user ordered by creation time.

- **Method**: `GET`
- **Path**: `/api/scans`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
      "connection_id": "6ecf4951-6d11-4d47-83c9-eeca64cbd732",
      "status": "COMPLETED",
      "started_at": "2026-08-22T10:00:05.000Z",
      "completed_at": "2026-08-22T10:02:15.000Z",
      "connections": {
        "id": "6ecf4951-6d11-4d47-83c9-eeca64cbd732",
        "name": "Production AWS Account",
        "provider": "aws"
      }
    }
  ]
  ```

### 4.2 Trigger New Scan
Initiates an asynchronous scan job for a specific connection.

- **Method**: `POST`
- **Path**: `/api/scans`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "connection_id": "6ecf4951-6d11-4d47-83c9-eeca64cbd732"
  }
  ```
- **Side Effect**: Inserts record into `public.scan_jobs` with status `PENDING` and pushes job ID to Redis queue `scan_queue`.
- **Response**: `201 Created`
  ```json
  {
    "id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
    "connection_id": "6ecf4951-6d11-4d47-83c9-eeca64cbd732",
    "status": "PENDING",
    "created_at": "2026-08-22T10:00:00.000Z"
  }
  ```

### 4.3 Check Scan Status
Polls the execution state of an ongoing scan.

- **Method**: `GET`
- **Path**: `/api/scans/:scan_id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`
  ```json
  {
    "id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
    "status": "COMPLETED",
    "started_at": "2026-08-22T10:00:05.000Z",
    "completed_at": "2026-08-22T10:02:15.000Z",
    "error_message": null
  }
  ```

### 4.4 Get Enriched Scan Results
Fetches all findings for a scan with associated resource and rule records, dynamically resolved against **NCA CCC-2:2024** regulatory controls.

- **Method**: `GET`
- **Path**: `/api/scans/:scan_id/results`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "539eaac4-578e-4a37-8d6c-d8e79e2f32da",
      "scan_job_id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
      "resource_id": "38938ee8-3861-42d8-9d35-055cf70ff82a",
      "rule_id": "AWS-S3-001",
      "status": "FAIL",
      "details": {
        "reason": "Bucket permissions set to public read via ACL."
      },
      "created_at": "2026-08-22T10:02:15.000Z",
      "resources": {
        "id": "38938ee8-3861-42d8-9d35-055cf70ff82a",
        "scan_job_id": "564f21a5-cb6e-422c-b8a4-e286d8051b0a",
        "resource_type": "S3",
        "provider_resource_id": "arn:aws:s3:::my-public-reports",
        "name": "my-public-reports",
        "region": "us-east-1",
        "configuration": {
          "is_public": true
        }
      },
      "rules": {
        "id": "AWS-S3-001",
        "provider": "aws",
        "name": "S3 Buckets should not be publicly readable",
        "finding_type": "storage_bucket_public_read",
        "severity": "HIGH",
        "description": "Checks if any S3 buckets permit public read access.",
        "recommendation": "Enable Block Public Access on the S3 bucket."
      },
      "ccc_metadata": [
        {
          "id": "2-3-P-1-2",
          "text": "The CSP shall configure and implement cloud services access control..."
        }
      ]
    }
  ]
  ```

---

## 5. Error Response Standards

All error responses adhere to standard HTTP status codes with structured JSON error bodies:

| Status Code | Reason | Typical Payload |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid payload or missing required fields | `{"error": "Validation failed", "details": [...]}` |
| `401 Unauthorized` | Missing, expired, or malformed JWT token | `{"error": "Unauthorized"}` |
| `404 Not Found` | Resource ID does not exist or belong to user | `{"error": "Scan job not found"}` |
| `500 Internal Server Error` | Unexpected backend or database error | `{"error": "Internal server error"}` |
