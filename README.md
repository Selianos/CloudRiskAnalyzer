# Cloud Security Analyzer

A modular cloud security analyzer that discovers cloud resources, collects their configurations, evaluates security rules, and generates security findings. The architecture is provider-agnostic, making it easy to support multiple cloud platforms.

## Supported Providers

* AWS
* GCP
* OCI (Oracle Cloud Infrastructure)

---

## Getting Started

### 1. Setup Virtual Environment
Create a virtual environment and install the required dependencies:
```powershell
# Create venv
python -m venv .venv

# Install requirements - Windows PowerShell
.\.venv\Scripts\pip.exe install -r scanner/requirements.txt
```
```powershell
# Install requirements - Linux / macOS
source .venv/bin/activate
pip install -r scanner/requirements.txt
```

### 2. Run the Scanner
Execute the scanner CLI:
```powershell
python scanner/main.py
# If you get an error on command above, Then try:
.\.venv\Scripts\python.exe scanner/main.py
```

---

## Scanning Flow

```text
Select Provider
      │
      ▼
Request Credentials
      │
      ▼
Connect & Validate
      │
      ▼
Discover Resources
      │
      ▼
Collect Configurations
      │
      ▼
Execute Security Rules
      │
      ▼
Generate Findings
```

---

## Project Structure

```text
scanner/
│
├── main.py
├── providers/
│   ├── aws.py
│   └── gcp.py
└── rules/
    ├── common.py
    ├── executor.py
    └── aws/
        ├── ec2.py
        ├── iam.py
        └── s3.py
```

### Folders

* **main.py** – Entry point that orchestrates the scanning workflow.
* **providers/** – Cloud provider implementations (authentication, resource discovery, configuration collection).
* **rules/** – Rule engine and provider-specific security checks.
* **rules/aws/** – Security rules for AWS services (EC2, IAM, S3).
* **common.py** – Shared rule utilities.
* **executor.py** – Executes security rules against collected configurations.

---

## Design

The scanner follows a modular architecture:

* **Providers** communicate with cloud APIs.
* **Rules** evaluate resource configurations.
* **Main** orchestrates the scanning pipeline.

This design simplifies adding new cloud providers, services, and security rules while keeping the codebase maintainable.

---

## Supabase Database & Edge Functions Backend

This project integrates with **Supabase** to manage user authentication, store cloud connections, maintain a scan job queue, and hold scan results/findings.

### 🗄️ Database Tables (PostgreSQL)
The database is structured into 5 core normalized tables with **Row-Level Security (RLS)** active:
1. **`connections`**: Holds cloud access credentials per user.
2. **`scan_jobs`**: Serves as our task queue (tracks `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` jobs).
3. **`resources`**: Inventory database holding raw configurations inside `JSONB` columns.
4. **`rules`**: Static check reference catalog (e.g., `SEC-001`, `IAM-001`).
5. **`findings`**: Contains security alerts linking resources to rule statuses (`PASS`/`FAIL`).

### ⚙️ Supabase CLI Commands
We use the Supabase CLI for database schema migrations and serverless Edge Functions.

#### 1. Enable script execution (Windows PowerShell)
If PowerShell blocks Node/NPM scripts, run this developer override:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Link local workspace to cloud project
```powershell
npx supabase link --project-ref <your-project-reference-id>
```

#### 3. Push schema migrations to remote database
```powershell
npx supabase db push
```

#### 4. Deploy serverless Edge Functions
Deploy code directly to the cloud without needing a local Docker daemon:
```powershell
npx supabase functions deploy <function-name> --project-ref <your-project-ref> --use-api
```
