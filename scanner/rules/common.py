"""
common.py
=========

Shared building blocks for CloudRiskAnalyzer's Rules Engine.

This module intentionally contains no provider-specific or resource-specific
logic. It only defines the contract that every rule module (AWS, GCP, OCI,
and any future provider) can build on top of:

    * Finding  - the immutable result produced when a rule fails.
    * BaseRule - the base class every rule implementation extends.

Individual rule files (e.g. ``rules/gcp/storage.py``) are expected to
subclass ``BaseRule`` once per check and expose a module-level ``RULES``
list of instances, mirroring the existing ``RULES`` convention already used
by the AWS rule modules.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Finding:
    """A single security finding produced by a rule evaluation.

    Attributes:
        rule_id: Unique identifier of the rule that produced the finding
            (e.g. "GCP-IAM-001").
        provider: Cloud provider the finding belongs to (e.g. "GCP").
        category: Logical grouping of the finding (e.g. "IAM", "Storage").
        title: Short, human-readable name of the finding.
        severity: Severity level (e.g. "LOW", "MEDIUM", "HIGH", "CRITICAL").
        resource_name: Human-readable name of the affected resource.
        description: Explanation of what was detected and why it matters.
        recommendation: Suggested remediation step.
    """

    rule_id: str
    provider: str
    category: str
    title: str
    severity: str
    resource_name: str
    description: str
    recommendation: str


class BaseRule:
    """Base class for a single, focused security rule.

    Each concrete rule represents exactly one check (one responsibility).
    Subclasses only need to declare metadata as class attributes and
    implement :meth:`check`.

    Class attributes:
        rule_id: Unique identifier of the rule (e.g. "GCP-STORAGE-001").
        provider: Cloud provider name (e.g. "GCP").
        category: Logical grouping of the rule (e.g. "Storage").
        title: Short, human-readable name of the rule.
        severity: Severity level assigned when the rule fails.
        resource_type: The normalized ``configuration["type"]`` value this
            rule applies to (e.g. "Cloud Storage").
        resource_subtype: Optional ``configuration["subtype"]`` value this
            rule applies to, for resource types that are split into
            subtypes (e.g. GCP IAM's "service_account" vs
            "project_iam_policy"). ``None`` means "no subtype filtering".
        description: Explanation of what the rule detects.
        recommendation: Suggested remediation step.
    """

    rule_id: str = ""
    provider: str = ""
    category: str = ""
    title: str = ""
    severity: str = "MEDIUM"
    resource_type: str = ""
    resource_subtype: Optional[str] = None
    description: str = ""
    recommendation: str = ""

    def matches(self, resource: dict, configuration: dict) -> bool:
        """Determine whether this rule applies to the given resource.

        Args:
            resource: The discovery-level resource descriptor (as returned
                by ``Provider.discover_resources()``).
            configuration: The normalized configuration dictionary (as
                returned by ``Provider.get_configuration()``).

        Returns:
            True if this rule should be evaluated against *configuration*.
        """
        if configuration.get("type") != self.resource_type:
            return False
        if self.resource_subtype is not None:
            return configuration.get("subtype") == self.resource_subtype
        return True

    def check(self, configuration: dict) -> bool:
        """Return True if the insecure condition this rule looks for is present.

        Args:
            configuration: The normalized configuration dictionary for the
                resource being evaluated.

        Returns:
            True when the configuration is insecure (a finding should be
            raised), False when it is compliant.
        """
        raise NotImplementedError

    def evaluate(self, resource: dict, configuration: dict) -> Optional[Finding]:
        """Evaluate this rule against a resource, returning a Finding if it fails.

        Args:
            resource: The discovery-level resource descriptor.
            configuration: The normalized configuration dictionary.

        Returns:
            A Finding instance if the rule applies and fails, otherwise None.
        """
        if not self.matches(resource, configuration):
            return None

        if not self.check(configuration):
            return None

        resource_name = configuration.get("name") or resource.get("name", "unknown")

        return Finding(
            rule_id=self.rule_id,
            provider=self.provider,
            category=self.category,
            title=self.title,
            severity=self.severity,
            resource_name=resource_name,
            description=self.description,
            recommendation=self.recommendation,
        )
