# CloudRiskAnalyzer: CCC Integration Implementation Plan

## 1. Scanner Requirements
The scanner will serve as the raw evidence-gathering engine. It will **not** process CCC logic directly. Its responsibility is strictly to evaluate cloud resource configurations against specific technical checks and output findings.

* **Standardization:** All rules (both legacy dicts and class-based `BaseRule`) must include a `finding_type`.
* **Execution Bug Fixes:** The `RULE_MAPPING` failure dropping GCP findings and the `TypeError` during rule metadata synchronization must be resolved.
* **Security & Sanitization:** The scanner must implement a redaction mechanism to sanitize raw configurations (stripping hardcoded secrets, API keys, passwords, and sensitive user-data) before saving evidence to the database.
* **Separation of Concerns:** The scanner emits raw findings containing only the `rule_id`. The API layer handles joining findings to `rules` to derive the `finding_type` and mapping to CCC requirements based on connection context (`ccc_applicability` and `data_classification_level`).

## 2. Scope

### 2.1 In Scope
* CCC control integration via dynamic JSON mapping.
* Core data model changes (`ccc_applicability`, `data_classification_level`, `finding_type`).
* Scanner engine bug fixes (GCP fallback, metadata sync) and secret redaction.
* Extending rule attributes to include `finding_type`.
* Developing missing automated rules (Key Management, Logging, Backup, WAF).
* API modifications to dynamically assess compliance status at report generation time.
* Frontend enhancements for connection settings and compliance dashboarding.
* Comprehensive Automated Testing (Unit, Integration, Regression).

### 2.2 Out of Scope (Manual Assessment)
The following CCC requirements explicitly **cannot** be automated via cloud API scraping and will be marked in the application as "Requires Manual Verification":
* **Domain 1:** Governance, Risk, and Compliance.
* **Domain 2 (Select Subdomains):** 
  * HR Screening & Personnel Security.
  * Penetration Testing (2-10).
  * Incident Response (2-12).
  * Physical Security (2-13).
  * Storage Media Security (2-17).
* **Domain 3:** Cybersecurity Resilience (e.g., BCP/DR plans).
* **Domain 4:** Third-Party Cybersecurity.

*The scanner must not falsely claim compliance or non-compliance for these un-assessable controls.*

## 3. Required CCC Mapping

### 3.1 Traceable Relationship
The architecture enforces the following chain of evidence:
`CCC Control` → `Security Requirement` → `Detection Rule (finding_type)` → `Cloud Resource` → `Evidence (Sanitized Configuration)` → `Finding (Pass/Fail via rule_id)` → `Severity` → `Remediation`

### 3.2 Evaluation States
When evaluating a CCC Control against findings, the following states apply:
* **Control Passes:** All related `finding_types` for the control evaluate to `PASS`. Marked as "Compliant".
* **Control Fails:** One or more `finding_types` evaluate to `FAIL`. Marked as "Non-Compliant". Generates an alert with severity and remediation steps.
* **Partially Satisfied:** Some resources pass while others fail for the same control. Marked as "Partial Compliance".
* **Evidence Missing:** The scanner could not retrieve configurations due to API errors or permission issues. Marked as "Indeterminate / Insufficient Evidence".
* **Not Applicable:** The control is excluded based on the target's `ccc_applicability` (e.g., control only applies to CSP, target is CST) or `data_classification_level` exemptions.
* **Cannot Be Automated:** The control falls under Out-of-Scope domains (Domains 1, 3, 4, HR, IR). Explicitly grouped under "Manual Verification Required".

---

## 4. The 19 Deliverables

### Phase 1: Database & Schema Updates
1. **DB Migrations (Schema Update):** Add `ccc_applicability` and `data_classification_level` to `public.connections`, and `finding_type` to `public.rules`. **Critical:** These columns must be defined as nullable or have explicit safe default values to ensure backward compatibility and prevent breaking existing records.
2. **Prisma Update:** Update the Prisma schema in the `web-api` to reflect the new columns and generate the client.

### Phase 2: Scanner Core Fixes & Security
3. **Runner Bug Fix:** Patch `scanner/runner.py` to add a fallback in `RULE_MAPPING` for GCP class-based rules, preventing silent drops.
4. **Metadata Sync Fix:** Update `get_all_rules_metadata` to safely extract properties from both `BaseRule` objects (`getattr()`) and legacy dictionaries (`rule["id"]`), preventing `TypeErrors`.
5. **Configuration Sanitization:** Implement a redaction filter in the scanner to strip sensitive secrets (API keys, passwords, EC2 user-data) from raw configurations before saving them to the database.

### Phase 3: Rule Definition Updates
6. **BaseRule Update:** Add the `finding_type` property to `scanner/rules/common.py` `BaseRule` class.
7. **Legacy Rule Refactor:** Update legacy AWS and OCI dictionary rules to include standard `finding_type` slugs.
8. **GCP Rule Refactor:** Update existing GCP class-based rules to include standard `finding_type` slugs.
9. **Rule Mapping Alignment:** Validate that all `finding_type` slugs in the codebase exactly match keys in `ccc_integration/finding_to_ccc_mapping.json`.

### Phase 4: New Rule Development (Coverage Gaps)
10. **Key Management Rules:** Implement new detection rules for CCC Domain 2-15 (e.g., KMS key rotation, HSM usage).
11. **Logging & Monitoring Rules:** Implement new detection rules for CCC Domain 2-11 (e.g., CloudTrail enabled, VPC Flow Logs).
12. **Backup Rules:** Implement new detection rules for CCC Domain 2-8 (e.g., automated snapshots enabled, cross-region backups).
13. **WAF Rules:** Implement new detection rules for CCC Domain 2-14 (e.g., WAF attached to ALB/CloudFront).

### Phase 5: API Layer Integration
14. **Mapping Loader:** Update `web-api` to load and cache `ccc_controls.json` and `finding_to_ccc_mapping.json`.
15. **Dynamic Reporting Logic:** Update report generation endpoints to evaluate compliance dynamically. The API will join the `findings` table to the `rules` table via `rule_id` to retrieve the `finding_type`, and apply CCC logic using connection variables (`ccc_applicability`, `level`).

### Phase 6: Frontend UI & Experience
16. **Connection Setup UI:** Update the frontend wizard to capture `ccc_applicability` and `data_classification_level` when adding a new cloud account.
17. **Compliance Dashboard:** Build the CCC Compliance View, visualizing Pass/Fail metrics, and clearly listing Out-of-Scope controls as "Requires Manual Verification".

### Phase 7: Testing & Documentation
18. **Automated Testing Suite:** Implement unit tests for the dynamic API reporting logic, integration tests for the nullable database migrations, and regression tests for the scanner core bug fixes.
19. **CCC Technical Docs:** Write documentation detailing the mapping traceability logic, Annex A exception handling, and instructions for adding new `finding_type` mappings for future rules.
