# Scanner Subsystem Architecture

This document describes the design, execution modes, provider integration contracts, rule evaluation mechanics, and result submission protocol of the Sahaba Scanner subsystem (`scanner/`).

---

## 1. Overview & Execution Modes

The Scanner is a Python 3.11 engine that audits cloud infrastructure configurations across Amazon Web Services (AWS), Google Cloud Platform (GCP), and Oracle Cloud Infrastructure (OCI).

```
                 ┌────────────────────────────────┐
                 │       Execution Triggers       │
                 └──────────────┬─────────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Daemon / Worker Mode  │           │   Standalone CLI Mode   │
│     (scanner/worker.py) │           │     (scanner/main.py)   │
├─────────────────────────┤           ├─────────────────────────┤
│ • Consumes Redis queue  │           │ • Interactive terminal  │
│ • Zero idle CPU usage   │           │ • Prompts credentials   │
│ • Talks to internal-API │           │ • Direct stdout logging │
│ • Automated catalog sync│           │ • Diagnostic audits     │
└─────────────────────────┘           └─────────────────────────┘
```

### 1.1 Daemon Worker Mode (`scanner/worker.py`)
- **Queue Model**: Connects to the Redis broker and issues blocking pop operations: `r.blpop("scan_queue", timeout=5)`.
- **Rule Catalog Synchronization**: On boot, the daemon extracts rule metadata from all provider modules (`ScanRunner.get_all_rules_metadata()`) and synchronizes it with the database via `POST /internal/jobs/rules/sync` (with built-in retry backoff).
- **Process Management**: Handles `SIGINT` and `SIGTERM` signals for graceful teardown without terminating active scans in an inconsistent state.
- **Workflow**:
  1. Receives `job_id` from Redis list `scan_queue`.
  2. Fetches decrypted credentials from `GET /internal/jobs/{job_id}` using `Bearer WORKER_API_KEY`.
  3. Updates job state to `RUNNING` via `POST /internal/jobs/{job_id}/status`.
  4. Runs discovery and rule evaluation via `ScanRunner.execute_scan(provider, credentials)`.
  5. Submits findings and sanitized configurations to `POST /internal/jobs/{job_id}/results`.
  6. On unhandled failure, marks job status as `FAILED` with error details.

### 1.2 Standalone CLI Mode (`scanner/main.py`)
- **Direct Invocation**: Designed for local development, diagnostic audits, and manual credential testing.
- **Interactive Prompts**: Prompts the operator for cloud provider and credentials based on `provider.required_credentials()`.
- **Output Streaming**: Redirects stdout dynamically to timestamped log files (`RESULT-{PROVIDER}-{ACCOUNT_ID}-{TIMESTAMP}.log`) while echoing evaluation status (`[SAFE]`, `[HIGH]`, `[CRITICAL]`) to the terminal.

---

## 2. Provider Abstraction Contract (`scanner/providers/base.py`)

All cloud providers implement the `BaseProvider` abstract base class:

```python
from abc import ABC, abstractmethod

class BaseProvider(ABC):
    @abstractmethod
    def required_credentials(self) -> list[dict]:
        """Returns list of credential field definitions."""
        pass

    @abstractmethod
    def connect(self, credentials: dict) -> None:
        """Authenticates client sessions using provided credentials."""
        pass

    @abstractmethod
    def validate_credentials(self) -> bool:
        """Tests API authentication validity against cloud provider."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Cleans up active client sessions and temporary keys."""
        pass

    @abstractmethod
    def list_supported_resources(self) -> list[str]:
        """Returns list of resource type strings discovered by this provider."""
        pass

    @abstractmethod
    def discover_resources(self) -> list[dict]:
        """Queries cloud APIs and returns discovered resource inventory."""
        pass

    @abstractmethod
    def get_configuration(self, resource: dict) -> dict:
        """Fetches detailed, normalized configuration dictionary for a resource."""
        pass
```

### 2.1 Provider Implementations

| Provider | Module | Authentication | Discovered Resource Types |
| :--- | :--- | :--- | :--- |
| **AWS** | `scanner/providers/aws.py` | Boto3 Session (`access_key`, `secret_key`, `region`). Verified via STS `get_caller_identity`. Generates IAM credential report. | `EC2`, `Security Groups`, `S3`, `IAM` (Users + Synthetic `<root_account>`), `IAM Role` |
| **GCP** | `scanner/providers/gcp.py` | Service Account JSON (`google.oauth2.service_account.Credentials`). Verified via Cloud Resource Manager `get_project`. | `Compute Engine`, `Cloud Storage`, `IAM` (`service_account` & `project_iam_policy`), `Firewall Rules` |
| **OCI** | `scanner/providers/oci.py` | OCI SDK Config (`user`, `fingerprint`, `tenancy`, `region`, `key_file`/PEM). Recursively traverses all active compartments. | `Compute`, `VCN`, `Subnet`, `SecurityList`, `ObjectStorage`, `IAM_Users`, `IAM_Policies` |

---

## 3. Rule Evaluation Engine (`scanner/rules/`)

The Rule Executor (`scanner/rules/executor.py`) coordinates rule evaluation against normalized resource configurations. It supports two coexisting rule formats:

### 3.1 Class-Based Rules (`BaseRule`)
Defined in `scanner/rules/common.py` (used for GCP rules and new rule authoring):
- Inherits from `BaseRule`.
- Encapsulates rule metadata: `rule_id`, `provider`, `category`, `severity`, `resource_type`, `finding_type`, `description`, `recommendation`.
- Implements `matches(resource, configuration) -> bool` and `check(configuration) -> bool`.
- `evaluate(resource, configuration)` produces an immutable `Finding` dataclass on failure or `None` on pass.

### 3.2 Legacy Dictionary Rules
Used for AWS and OCI rule sets:
- Defined as plain Python dictionaries with `id`, `name`, `severity`, `finding_type`, `description`, `recommendation`, and a `check(config) -> bool` callable.
- Evaluated via `_evaluate_legacy_dict_rule` in `executor.py`.

### 3.3 Rule ID Normalization
Before results submission, `scanner/runner.py` uses `RULE_MAPPING` to map local rule IDs (e.g. `SEC-001`, `S3-001`, `IAM-002`) to canonical database identifiers (e.g. `AWS-EC2-001`, `AWS-S3-001`, `AWS-IAM-001`).

---

## 4. Configuration Sanitization & Secret Redaction

To prevent sensitive cloud secrets from being stored in the database or exposed via logs, `ScanRunner.sanitize_configuration()` recursively walks every configuration dictionary before persistence:

```python
SENSITIVE_KEY_PATTERNS = ["password", "secret", "api_key", "token", "user_data", "user-data"]
```

Any key matching these substrings is replaced with the string `"[REDACTED]"`.

---

## 5. Result Submission Contract

When a scan completes, the worker sends a batch payload to `POST /internal/jobs/{job_id}/results`:

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
        "public_ip": "54.210.10.5",
        "security_groups": ["sg-012345"]
      }
    }
  ],
  "findings": [
    {
      "resource_id": "res-1",
      "rule_id": "AWS-EC2-001",
      "status": "FAIL",
      "details": {
        "reason": "Security group allows SSH (port 22) from 0.0.0.0/0",
        "severity": "CRITICAL",
        "recommendation": "Restrict SSH access to trusted IP addresses only."
      }
    }
  ]
}
```

### Relational ID Resolution in Internal Backend
1. The scanner links resources to findings using temporary client-side IDs (`"res-1"`).
2. The Internal Backend receives the payload inside a database transaction.
3. It generates UUIDs for each resource, maps `"res-1"` to the generated UUID, and inserts the rows into `public.resources`.
4. It flushes the transaction and inserts findings into `public.findings` using the assigned PostgreSQL UUIDs.
5. It marks `public.scan_jobs.status = 'COMPLETED'` and records `completed_at`.
