# Risk Classification & Compliance Mapping Architecture

This document explains how the CloudRiskAnalyzer (Sahaba) system links detected cloud risks to the National Cybersecurity Authority (NCA) Cloud Computing Controls (CCC), and how risk severity is classified throughout the platform.

---

## 1. CCC Control → System Rule → Risk

The platform dynamically maps technical cloud misconfigurations to high-level compliance controls using an intermediary abstraction called `finding_type`.

### Mapping Flow
1. **Rule Evaluation (Risk Detection):** The scanner workers (written in Python) evaluate cloud resources against specific configuration checks. If a resource fails a check, a `Finding` is generated.
2. **Rule Metadata:** Every finding is tagged with a `rule_id` (e.g., `AWS-S3-001`). This ID connects the finding to a specific rule in the `rules` database table.
3. **Finding Type Abstraction:** Inside the `rules` table, each rule is assigned a `finding_type` string (e.g., `storage_bucket_public_read`). This acts as a standardized category across different cloud providers.
4. **Dynamic Resolution:** When the Web API serves scan results, it intercepts the `finding_type` and looks up which specific NCA CCC controls apply to it.

### Where is this implemented?
*   **Rule Definitions:** Located in `scanner/rules/**/*.py`. Each rule class defines a `rule_id` and its corresponding `finding_type`.
*   **Database Schema:** The `public.rules` table in PostgreSQL stores the `finding_type` alongside the rule metadata.
*   **API Resolver:** The logic connecting the `finding_type` to actual CCC control text is located in `web-api/src/utils/cccResolver.js`.
*   **Mapping Data:** The actual relationships between `finding_type` strings and CCC control IDs are hardcoded in two JSON files: `ccc_integration/finding_to_ccc_mapping.json` and `ccc_integration/ccc_controls.json`.

---

## 2. Risk Severity Classification

Risk severity is determined statically at the rule definition level and flows into the database where it is standardized.

### Severity Flow & Logic
1. **Source Code Definition:** The severity of a risk is determined by the developers who write the scanner rules. In `scanner/rules/**/*.py`, every rule class inherits from `BaseRule` (defined in `scanner/rules/common.py`) and sets a `severity` attribute.
    *   *Scanner Severities:* `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
2. **Catalog Synchronization:** When the scanner worker starts up, it syncs all rule metadata to the Internal Backend API.
3. **Data Transformation:** The Internal Backend (`internal-backend/app/database.py` in the `sync_rules_catalog` function) intercepts the rule metadata before saving it. It enforces the following logic:
    *   Converts all severity strings to `UPPERCASE`.
    *   Explicitly maps the scanner's `LOW` severity to the database's `INFO` severity.
4. **Database Constraints:** The PostgreSQL database strictly enforces severity classifications via a CHECK constraint on the `public.rules` table: 
    *   *Allowed DB Severities:* `CRITICAL`, `HIGH`, `WARNING`, `MEDIUM`, `INFO`.
5. **Final Finding Output:** When a `Finding` is generated, the finding itself does *not* store a severity score. Instead, the finding references the `rule_id`. The Web API joins the finding with the `rules` table, meaning the severity presented to the user is the standardized database severity (`INFO`), not the original scanner code severity (`LOW`).
