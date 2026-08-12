"""
rules/gcp/storage.py
=====================

Security rules for GCP Cloud Storage bucket configurations.
"""

from __future__ import annotations

from rules.common import BaseRule

_RESOURCE_TYPE = "Cloud Storage"


class PublicBucket(BaseRule):
    """Flags buckets that are publicly accessible."""

    rule_id = "GCP-STORAGE-001"
    provider = "GCP"
    category = "Storage"
    title = "Public Bucket"
    severity = "CRITICAL"
    resource_type = _RESOURCE_TYPE
    description = "The bucket's IAM policy grants access to 'allUsers' or 'allAuthenticatedUsers'."
    recommendation = "Remove public members from the bucket's IAM policy and enable Public Access Prevention."

    def check(self, configuration: dict) -> bool:
        """Return True if the bucket is publicly accessible."""
        return configuration.get("is_public", False)


class PublicAccessPreventionDisabled(BaseRule):
    """Flags buckets without Public Access Prevention enforced."""

    rule_id = "GCP-STORAGE-002"
    provider = "GCP"
    category = "Storage"
    title = "Public Access Prevention Disabled"
    severity = "HIGH"
    resource_type = _RESOURCE_TYPE
    description = "Public Access Prevention is not set to 'enforced' on the bucket."
    recommendation = "Set the bucket's public access prevention setting to 'enforced'."

    def check(self, configuration: dict) -> bool:
        """Return True if public access prevention is not enforced."""
        return configuration.get("public_access_prevention") != "enforced"


class UniformBucketLevelAccessDisabled(BaseRule):
    """Flags buckets that still rely on legacy per-object ACLs."""

    rule_id = "GCP-STORAGE-003"
    provider = "GCP"
    category = "Storage"
    title = "Uniform Bucket-Level Access Disabled"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    description = "Uniform bucket-level access is disabled, allowing legacy per-object ACLs to grant access."
    recommendation = "Enable uniform bucket-level access to enforce IAM-only access control on the bucket."

    def check(self, configuration: dict) -> bool:
        """Return True if uniform bucket-level access is disabled."""
        return not configuration.get("uniform_bucket_level_access", False)


class VersioningDisabled(BaseRule):
    """Flags buckets without object versioning enabled."""

    rule_id = "GCP-STORAGE-004"
    provider = "GCP"
    category = "Storage"
    title = "Versioning Disabled"
    severity = "LOW"
    resource_type = _RESOURCE_TYPE
    description = "Object versioning is disabled, so overwritten or deleted objects cannot be recovered."
    recommendation = "Enable object versioning to protect against accidental or malicious data loss."

    def check(self, configuration: dict) -> bool:
        """Return True if versioning is disabled."""
        return not configuration.get("versioning_enabled", False)


class BucketLoggingDisabled(BaseRule):
    """Flags buckets without access logging enabled."""

    rule_id = "GCP-STORAGE-005"
    provider = "GCP"
    category = "Storage"
    title = "Bucket Logging Disabled"
    severity = "LOW"
    resource_type = _RESOURCE_TYPE
    description = "Access logging is disabled, limiting visibility into who accessed the bucket's contents."
    recommendation = "Enable bucket logging and route logs to a dedicated, access-restricted logging bucket."

    def check(self, configuration: dict) -> bool:
        """Return True if logging is disabled."""
        return not configuration.get("logging_enabled", False)


RULES = [
    PublicBucket(),
    PublicAccessPreventionDisabled(),
    UniformBucketLevelAccessDisabled(),
    VersioningDisabled(),
    BucketLoggingDisabled(),
]
