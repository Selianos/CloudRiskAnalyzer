# Rule Development & Extensibility Guide

This guide details how developers can author, test, and register new multi-cloud security rules in the Sahaba scanning engine.

---

## 1. Rule Architecture & Contract

All new security rules should be authored as Python classes inheriting from `BaseRule` (defined in `scanner/rules/common.py`).

```python
from rules.common import BaseRule

class S3PublicAccessBlockDisabled(BaseRule):
    rule_id = "AWS-S3-003"
    provider = "AWS"
    category = "Storage"
    title = "S3 Public Access Block Disabled"
    severity = "HIGH"
    resource_type = "S3"
    finding_type = "storage_bucket_public_read"
    description = "Checks if Amazon S3 account-level or bucket-level Block Public Access is disabled."
    recommendation = "Enable all four Block Public Access settings on the S3 bucket."

    def check(self, configuration: dict) -> bool:
        """
        Return True if the resource is INSECURE (rule fails).
        Return False if the resource is COMPLIANT (rule passes).
        """
        public_block = configuration.get("public_access_block", {})
        if not public_block:
            return True  # Fails if no public access block configured
        
        return not (
            public_block.get("BlockPublicAcls", False) and
            public_block.get("IgnorePublicAcls", False) and
            public_block.get("BlockPublicPolicy", False) and
            public_block.get("RestrictPublicBuckets", False)
        )
```

---

## 2. Rule Attributes Specification

| Attribute | Type | Description | Allowed Values / Examples |
| :--- | :--- | :--- | :--- |
| `rule_id` | `str` | Unique uppercase identifier prefixed by provider. | `AWS-S3-003`, `GCP-FW-003`, `OCI-IAM-004` |
| `provider` | `str` | Target cloud ecosystem. | `"AWS"`, `"GCP"`, `"OCI"` |
| `category` | `str` | High-level risk domain. | `"Storage"`, `"Compute"`, `"Network"`, `"IAM"` |
| `title` | `str` | Human-readable check title. | `"S3 Public Access Block Disabled"` |
| `severity` | `str` | Risk classification rating. | `"CRITICAL"`, `"HIGH"`, `"WARNING"`, `"MEDIUM"`, `"INFO"` (Note: `"LOW"` automatically maps to `"INFO"`). |
| `resource_type` | `str` | Primary resource type discovered by provider. | `"S3"`, `"EC2"`, `"Security Groups"`, `"Cloud Storage"`, `"Compute Engine"`, `"ObjectStorage"` |
| `resource_subtype` | `str` (Optional) | Sub-filter when multiple resources share a `resource_type`. | `"service_account"`, `"project_iam_policy"` |
| `finding_type` | `str` | Canonical slug linking rule to NCA CCC-2:2024 controls. | See canonical slugs in [Threat Detection Catalog](threat-detection-catalog.md). |
| `description` | `str` | Explanation of what the rule detects and why it poses risk. | Concise explanation without marketing prose. |
| `recommendation` | `str` | Actionable remediation guidance for engineers. | Concrete steps in console, CLI, or IaC to resolve the finding. |

---

## 3. Writing Rule Logic

### 3.1 The `matches()` Method
By default, `BaseRule.matches(resource, configuration)` matches against `self.resource_type` and optional `self.resource_subtype`. Override this method only if custom matching is needed:

```python
def matches(self, resource: dict, configuration: dict) -> bool:
    return resource.get("type") == "Compute Engine" and configuration.get("status") == "RUNNING"
```

### 3.2 The `check()` Method
- Input: `configuration` dictionary (normalized and sanitized by the provider).
- Returns:
  - `True`: Insecure condition detected (Generates a `Finding` with `status: "FAIL"`).
  - `False`: Configuration is safe (Rule passes).

---

## 4. Registering New Rules

1. **Place in Provider Rules Module**:
   Add the rule class to the corresponding module in `scanner/rules/` (e.g. `scanner/rules/gcp/storage.py` or `scanner/rules/aws/s3.py`).
2. **Export in Rule List**:
   Add the class to the module's `RULES` array:
   ```python
   RULES = [
       PublicBucket(),
       PublicAccessPreventionDisabled(),
       S3PublicAccessBlockDisabled(),
   ]
   ```
3. **Automatic Synchronization**:
   When the scanner worker container restarts, `ScanRunner.get_all_rules_metadata()` collects all registered rules and issues `POST /internal/jobs/rules/sync` to the Internal Backend, automatically inserting or updating the rule in PostgreSQL.

---

## 5. Local Testing & Verification

### 5.1 Standalone CLI Mode
Test the new rule locally without running the full container stack:

```bash
# 1. Activate virtual environment
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows

# 2. Run scanner CLI
python scanner/main.py
```

### 5.2 Unit Testing
Write isolated unit tests passing mock configuration dictionaries to `rule.check()`:

```python
def test_s3_public_access_block():
    rule = S3PublicAccessBlockDisabled()
    
    # Insecure configuration
    assert rule.check({"public_access_block": {}}) is True
    
    # Compliant configuration
    assert rule.check({
        "public_access_block": {
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True
        }
    }) is False
```
