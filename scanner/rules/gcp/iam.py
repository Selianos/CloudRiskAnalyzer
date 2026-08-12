"""
rules/gcp/iam.py
================

Security rules for GCP IAM configurations.

Covers two IAM configuration subtypes produced by ``GCPProvider``:

    * ``project_iam_policy`` - the project-level IAM policy bindings.
    * ``service_account``    - an individual IAM service account.

Each rule below has a single responsibility and matches only the resource
subtype it is designed to inspect.
"""

from __future__ import annotations

from rules.common import BaseRule

_RESOURCE_TYPE = "IAM"


class PrimitiveIamRolesAssigned(BaseRule):
    """Flags project IAM bindings that use primitive (basic) roles."""

    rule_id = "GCP-IAM-001"
    provider = "GCP"
    category = "IAM"
    title = "Primitive IAM Roles Assigned"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    resource_subtype = "project_iam_policy"
    description = "Owner, Editor or Viewer roles were detected on the project IAM policy."
    recommendation = "Replace primitive roles with least-privilege predefined or custom roles."

    def check(self, configuration: dict) -> bool:
        """Return True if any binding uses a primitive role."""
        return configuration.get("has_primitive_role_binding", False)


class PublicIamBindings(BaseRule):
    """Flags project IAM bindings granted to allUsers or allAuthenticatedUsers."""

    rule_id = "GCP-IAM-002"
    provider = "GCP"
    category = "IAM"
    title = "Public IAM Bindings"
    severity = "CRITICAL"
    resource_type = _RESOURCE_TYPE
    resource_subtype = "project_iam_policy"
    description = (
        "One or more IAM bindings grant access to 'allUsers' or "
        "'allAuthenticatedUsers', exposing the project publicly."
    )
    recommendation = "Remove public members from IAM bindings and grant access to specific identities instead."

    def check(self, configuration: dict) -> bool:
        """Return True if any binding grants access to the public."""
        return configuration.get("has_public_binding", False)


class UserManagedServiceAccountKeysExist(BaseRule):
    """Flags service accounts that have user-managed (long-lived) keys."""

    rule_id = "GCP-IAM-003"
    provider = "GCP"
    category = "IAM"
    title = "User-Managed Service Account Keys Exist"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    resource_subtype = "service_account"
    description = (
        "The service account has one or more user-managed keys, which do not "
        "expire automatically and increase the risk of credential leakage."
    )
    recommendation = (
        "Avoid user-managed keys; prefer short-lived credentials such as "
        "Workload Identity Federation or attached service accounts, and "
        "rotate or delete any existing user-managed keys."
    )

    def check(self, configuration: dict) -> bool:
        """Return True if the service account has any user-managed keys."""
        return configuration.get("user_managed_key_count", 0) > 0


RULES = [
    PrimitiveIamRolesAssigned(),
    PublicIamBindings(),
    UserManagedServiceAccountKeysExist(),
]
