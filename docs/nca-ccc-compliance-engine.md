# NCA CCC-2:2024 Compliance Engine Architecture

This document describes how Sahaba maps technical cloud infrastructure findings to the National Cybersecurity Authority (**NCA**) Cloud Cybersecurity Controls (**CCC-2:2024**) framework.

---

## 1. Regulatory Context: NCA CCC-2:2024

The **NCA CCC-2:2024** standard extends the Essential Cybersecurity Controls (**ECC-1:2018**) to establish mandatory security requirements for cloud computing within the Kingdom of Saudi Arabia.

The framework is structured into:
- **4 Main Domains**:
  1. Cybersecurity Governance
  2. Cybersecurity Defense
  3. Cybersecurity Resilience
  4. Third-Party and Cloud Computing Cybersecurity
- **24 Subdomains**
- **55 Top-Level Controls** (37 for Cloud Service Providers `CSP` + 18 for Cloud Service Tenants `CST`)
- **120 Granular Subcontrols** (94 for `CSP` + 26 for `CST`)
- **Annex A Data Classification Matrix**: Specifies whether controls are mandatory across 4 organizational data sensitivity levels (`Level 1: Top Secret`, `Level 2: Secret`, `Level 3: Confidential`, `Level 4: Public`).

---

## 2. Decoupled Mapping Architecture

Sahaba decouples cloud scanning rules from regulatory control text using a 4-tier abstraction chain:

```
[ Cloud Infrastructure ] ──► (AWS / GCP / OCI APIs)
            │
            ▼
[ Technical Rule ] ─────────► Rule ID (e.g., AWS-EC2-001, GCP-FW-001, OCI-NET-002)
            │
            ▼
[ Normalized Category ] ────► finding_type Slug (e.g., ssh_open_to_internet)
            │
            ▼
[ Relational Mapping ] ─────► finding_to_ccc_mapping.json (Maps slug to CCC IDs for CSP & CST)
            │
            ▼
[ Regulatory Control ] ─────► ccc_controls.json (Control definitions + Annex A level_mandatory)
            │
            ▼
[ API Enriched Finding ] ───► Injects ccc_metadata dynamically at query time
```

### Abstraction Components

| Layer | Component | Location | Role |
| :--- | :--- | :--- | :--- |
| **1. Rule Definition** | `rule_id` | `scanner/rules/` & `public.rules.id` | Concrete technical implementation checking a specific cloud configuration. |
| **2. Category Slug** | `finding_type` | `public.rules.finding_type` | Standardized, vendor-agnostic category (25 canonical slugs) unifying AWS, GCP, and OCI risks. |
| **3. Mapping Matrix** | `finding_to_ccc_mapping.json` | `ccc_integration/` | Direct lookup table associating each `finding_type` with matching CSP and CST control IDs. |
| **4. Control Catalog** | `ccc_controls.json` | `ccc_integration/` | Full hierarchical JSON representation of the NCA CCC-2:2024 controls and level matrices. |

---

## 3. Dynamic Resolution Engine (`web-api/src/utils/cccResolver.js`)

Compliance resolution occurs **dynamically at query time** inside the Web API when `GET /api/scans/:scan_id/results` is invoked. Stale compliance text is not persisted in the database (`db/04_drop_ccc_metadata.sql`), allowing regulatory frameworks to be updated without database migrations.

### Resolution Algorithm
1. Retrieve finding record and extract `finding.rules.finding_type`.
2. Inspect target connection's compliance metadata:
   - `ccc_applicability`: Persona target (`"CSP"` vs `"CST"`).
   - `data_classification_level`: Organizational sensitivity tier (`"level_1"` to `"level_4"`).
3. Query `finding_to_ccc_mapping.json` for matching control IDs based on persona (`ccc_controls_csp` or `ccc_controls_cst`).
4. Cross-reference each control ID against `ccc_controls.json`.
5. Evaluate `control.level_mandatory[classification_level]`:
   - If `true`, the control is attached to the finding object under `ccc_metadata: [{ "id": "...", "text": "..." }]`.
   - If `false`, the control is excluded for that data classification level.

---

## 4. Risk Severity Normalization Lifecycle

Severity levels are normalized across system layers to maintain database integrity:

```
[ Scanner Rule Code ]   ──► Severities: "CRITICAL", "HIGH", "MEDIUM", "LOW", "WARNING"
         │
         ▼
[ Internal Backend ]    ──► sync_rules_catalog(): Converts to uppercase, maps "LOW" -> "INFO"
         │
         ▼
[ PostgreSQL DB ]       ──► CHECK (severity IN ('CRITICAL', 'HIGH', 'WARNING', 'MEDIUM', 'INFO'))
         │
         ▼
[ Web API Output ]      ──► Standardized severity exposed to client
         │
         ▼
[ Frontend Dashboard ]  ──► UI tokens: Red (CRITICAL), Orange (HIGH), Amber (MEDIUM), Blue/Gray (INFO)
```

---

## 5. Automated vs. Manual Compliance Coverage

| NCA CCC Subdomain | Control Identifiers | Automation Status | Detected Technical Capability |
| :--- | :--- | :---: | :--- |
| **2-2 Identity & Access Management** | `2-2-P-1-1`, `2-2-P-1-2`, `2-2-P-1-3`, `2-2-P-1-5`, `2-2-P-1-7`, `2-2-P-1-10`, `2-2-P-1-11`, `2-2-T-1-1`, `2-2-T-1-3`, `2-2-T-1-4` | **Automated** | Active root access keys, missing MFA on root and privileged accounts, wildcard admin policies, password/key aging >90 days, public IAM bindings (`allUsers`). |
| **2-4 Networks Security Management** | `2-4-P-1-1`, `2-4-P-1-2`, `2-4-P-1-5`, `2-4-T-1-1` | **Automated** | Ingress ports 22 (SSH) and 3389 (RDP) exposed to `0.0.0.0/0` or `::/0`, open database ports, overly broad security groups, and allow-all firewall rules. |
| **2-6 Data Protection / 2-3 InfoSys** | `2-3-P-1-2`, `2-6-P-1-4`, `2-2-T-1-1` | **Automated** | Public S3 buckets, GCP Storage public ACLs/bindings, GCP Public Access Prevention (PAP) disabled, OCI public bucket visibility. |
| **2-7 Cryptography (At Rest)** | `2-7-P-1-1`, `2-7-T-1-1` | **Automated** | Unencrypted S3 buckets and OCI Object Storage lacking Customer-Managed KMS Key (CMEK) encryption. |
| **2-8 Backup & Recovery (Basic)** | `2-8-P-1-1`, `2-8-P-1-2` | **Automated** | Disabled object versioning on Cloud Storage. |
| **2-9 Vulnerability Management** | `2-9-P-1-1`, `2-9-T-1-1` | **Automated** | Shielded VM Secure Boot disabled on Compute Engine instances. |
| **2-11 Event Logs & Monitoring (Basic)**| `2-11-P-1-1`, `2-11-P-1-3`, `2-11-T-1-1` | **Automated** | Disabled bucket access and audit logging. |
| **2-14 Web Application Security (WAF)**| `2-14-P-1-1` | **Roadmap** | Automated verification of WAF attachment to public load balancers and API gateways. |
| **2-4 / 2-7 Data-in-Transit Encryption**| `2-4-P-1-4`, `2-7-P-1-1`, `2-7-T-1-2` | **Roadmap** | TLS 1.2+ minimum policies and enforced HTTPS bucket transport policies. |
| **1-1 to 1-3 Governance & Risk** | `1-1-*`, `1-2-*`, `1-3-*` | **Manual Review** | Governance committees, RACI definitions, and organizational cybersecurity strategies. |
| **2-10, 2-12, 2-13 Operational** | `2-10` (PenTest), `2-12` (IR), `2-13` (Physical) | **Manual Review** | Physical data center controls, incident response tabletop exercises, and annual penetration testing. |
