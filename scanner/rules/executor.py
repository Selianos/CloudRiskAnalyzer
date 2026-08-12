"""
rules/executor.py
==================

The Rule Executor loads provider-specific rule sets and evaluates them
against normalized resource configurations.

Two rule styles currently coexist in this project:

    * Legacy dict-based rules (used by the AWS rule modules), where each
      rule is a plain dict with an "id", "check" callable, etc. Matching
      is done by comparing the resource type to a prefix on the rule id.

    * Class-based rules (used by the GCP rule modules and defined in
      `rules.common.BaseRule`), where each rule is an instance that knows
      how to match itself against a resource and evaluate itself.

Supporting both means the existing AWS behavior is left completely
untouched, while new providers (GCP now, Azure/OCI later) can use the
cleaner `BaseRule` contract without requiring further changes here: any
rule that is a `BaseRule` instance is handled generically, regardless of
which provider module it came from.

The executor only works with normalized dictionaries - it has no
knowledge of any cloud provider SDK.
"""

from __future__ import annotations

from typing import Optional

from rules.aws import ec2 as aws_ec2, s3 as aws_s3, iam as aws_iam
from rules.gcp import compute as gcp_compute, firewall as gcp_firewall, iam as gcp_iam, storage as gcp_storage
from rules.common import BaseRule

def get_rules_for_provider(provider_name: str) -> list:
    """Return all rule definitions for the specified cloud provider."""
    # Convert provider name to lowercase to match keys
    name = provider_name.lower()

    if name == "aws":
        rules = []
        rules.extend(getattr(aws_ec2, "RULES", []))
        rules.extend(getattr(aws_s3, "RULES", []))
        rules.extend(getattr(aws_iam, "RULES", []))
        return rules
    if name == "gcp":
        rules = []
        rules.extend(getattr(gcp_iam, "RULES", []))
        rules.extend(getattr(gcp_storage, "RULES", []))
        rules.extend(getattr(gcp_compute, "RULES", []))
        rules.extend(getattr(gcp_firewall, "RULES", []))
        return rules

    if "oci" in name or "oracle" in name:
        try:
            from rules.oci.oci import RULES as oci_rules
            return oci_rules
        except ImportError:
            return []

    # Placeholder for other providers (and future Azure)
    return []


def _evaluate_legacy_dict_rule(resource: dict, configuration: dict, rule: dict) -> Optional[dict]:
    """Evaluate a legacy dict-based rule (the pre-existing AWS rule format)."""
    resource_type = resource.get("type", "").upper()
    resource_id = resource.get("id", "")
    resource_name = resource.get("name", "")

    rule_id = rule.get("id", "").upper()

    # Determine if rule matches the resource type
    match = False
    if rule_id.startswith("SEC") and resource_type == "SECURITY GROUPS":
        match = True
    elif rule_id.startswith("EC2") and resource_type == "EC2":
        match = True
    elif rule_id.startswith("S3") and resource_type == "S3":
        match = True
    elif rule_id.startswith("IAM") and resource_type.startswith("IAM"):
        match = True
    elif rule_id.startswith("OCI") and rule.get("resource_type", "").upper() == resource_type:
        match = True

    if not match:
        return None

    try:
        # The rule check returns True if the check fails (finding exists)
        check_func = rule.get("check")
        failed = False
        if check_func:
            failed = check_func(configuration)

        status = rule.get("severity", "WARNING").upper() if failed else "SAFE"

        return {
            "rule_id": rule.get("id"),
            "rule_name": rule.get("name"),
            "severity": rule.get("severity"),
            "status": status,
            "description": rule.get("description"),
            "recommendation": rule.get("recommendation") if failed else None,
            "resource_type": resource["type"],
            "resource_id": resource_id,
            "resource_name": resource_name,
        }
    except Exception as e:
        print(f"[Error] Failed to evaluate rule {rule.get('id')} on resource {resource_id}: {e}")
        return None


def _evaluate_class_based_rule(resource: dict, configuration: dict, rule: BaseRule) -> Optional[dict]:
    """Evaluate a class-based rule (`rules.common.BaseRule` subclass instance)."""
    resource_id = resource.get("id", "")
    resource_name = resource.get("name", "")

    try:
        if not rule.matches(resource, configuration):
            return None

        finding = rule.evaluate(resource, configuration)

        if finding is not None:
            return {
                "rule_id": finding.rule_id,
                "rule_name": finding.title,
                "severity": finding.severity,
                "status": finding.severity,
                "description": finding.description,
                "recommendation": finding.recommendation,
                "resource_type": resource.get("type"),
                "resource_id": resource_id,
                "resource_name": finding.resource_name,
            }

        # Rule applied to this resource but found nothing wrong.
        return {
            "rule_id": rule.rule_id,
            "rule_name": rule.title,
            "severity": rule.severity,
            "status": "SAFE",
            "description": rule.description,
            "recommendation": None,
            "resource_type": resource.get("type"),
            "resource_id": resource_id,
            "resource_name": resource_name,
        }
    except Exception as e:
        print(f"[Error] Failed to evaluate rule {rule.rule_id} on resource {resource_id}: {e}")
        return None


def evaluate_rules(resource: dict, configuration: dict, rules: list) -> list:
    """Evaluate all applicable rules against a resource configuration.

    Supports both legacy dict-based rules and `BaseRule` class-based
    rules within the same rule list.

    Returns a list of rule evaluation results (dicts representing the
    status of each rule).
    """
    evaluations = []

    for rule in rules:
        if isinstance(rule, BaseRule):
            result = _evaluate_class_based_rule(resource, configuration, rule)
        elif isinstance(rule, dict):
            result = _evaluate_legacy_dict_rule(resource, configuration, rule)
        else:
            result = None

        if result is not None:
            evaluations.append(result)

    return evaluations
