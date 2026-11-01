"""
exporter.py
===========

Fact exporter: Sahaba scan result (interface 1) -> facts/<scan_id>.pl (interface 2).

Owner:    Integration programmer
Name:     <write your name>
Tasks:    T2.1, T2.2, T2.4
Contract: INTERFACES.md sections 1, 2 and 7
Report:   3.5.1 Field-to-Fact Mapping, 3.5.2 Exporter Implementation

Called from ``worker.py`` between ``ScanRunner.execute_scan`` and
``client.submit_results``, on the same ``results`` dictionary::

    results = ScanRunner.execute_scan(job["provider"], job["credentials"])
    export_facts(results, scan_id=job_id)
    client.submit_results(job_id, results)

It must run there, because the finding IDs (``res-1``, ``res-2``, ...) only
match resources inside this one dictionary. If it fails, it logs the error
and the scan still completes normally.

The exporter writes facts only. It never decides what a permission means
(that is ``permission_class/2`` in ``kb/permissions.pl``).
"""

from __future__ import annotations

from pathlib import Path

FACTS_DIR = Path(__file__).resolve().parent.parent / "facts"
SENSITIVE_OVERRIDES = FACTS_DIR / "sensitive_overrides.pl"

# Reserved atoms (INTERFACES.md 2.1)
INTERNET = "internet"
ANY = "any"

PROVIDERS = ("aws", "gcp", "oci")
SEVERITIES = ("critical", "high", "medium", "low", "warning", "info")
PROTOCOLS = ("tcp", "udp", "icmp", "all")
ALL_PORTS = (0, 65535)

# Sahaba resource_type (and IAM subtype for GCP) -> type atom (INTERFACES.md 2.2).
# Types not listed here (OCI VCN, Subnet, IAM_Policies, GCP project_iam_policy)
# are not resources; they are only read to build other facts.
TYPE_ATOMS = {
    ("aws", "EC2"): "ec2_instance",
    ("aws", "Security Groups"): "security_group",
    ("aws", "S3"): "s3_bucket",
    ("aws", "IAM"): "iam_user",
    ("aws", "IAM Role"): "iam_role",
    ("gcp", "Compute Engine"): "gce_instance",
    ("gcp", "Firewall Rules"): "gcp_firewall_rule",
    ("gcp", "Cloud Storage"): "gcs_bucket",
    ("gcp", "IAM", "service_account"): "gcp_service_account",
    ("oci", "Compute"): "oci_instance",
    ("oci", "SecurityList"): "oci_security_list",
    ("oci", "ObjectStorage"): "oci_bucket",
    ("oci", "IAM_Users"): "oci_user",
    # PROPOSED (pending INTERFACES.md 2.2 / 2.5, gap 4):
    # ("oci", "DynamicGroup"): "oci_dynamic_group",
}

# Bucket classification values that make a bucket sensitive (INTERFACES.md 2.4).
SENSITIVE_CLASSIFICATIONS = ("confidential", "secret", "top_secret")


def export_facts(results: dict, scan_id: str, out_dir: Path = FACTS_DIR) -> Path:
    """Write ``<out_dir>/<scan_id>.pl`` for one scan and return its path.

    The file starts with a header comment (scan ID, date, provider) and
    contains only facts, no rules (INTERFACES.md 2.3). The facts of
    ``sensitive_overrides.pl`` are copied into it.

    Must not raise: on any error, log it and return without breaking the scan.
    """
    raise NotImplementedError("T2.2")


def quote_atom(value: str) -> str:
    """Return *value* as a quoted Prolog atom, e.g. ``'i-0abc'``.

    IDs contain ``-``, ``:`` and ``/``, so IDs are always quoted. Escape
    single quotes and backslashes.
    """
    raise NotImplementedError("T2.2")


def normalize_severity(severity: str) -> str:
    """Lowercase Sahaba's severity (``Critical``, ``CRITICAL``, ``Low``) to one of SEVERITIES."""
    raise NotImplementedError("T2.4")


def build_reference_index(resources: list[dict]) -> dict[str, str]:
    """Map every way a resource is referenced to its ``provider_resource_id``.

    Covers role ARNs (``raw_data.Arn``), service-account emails (the GCP
    resource ``name``), security-group IDs and bucket ARNs
    (``arn:aws:s3:::name`` and ``arn:aws:s3:::name/*`` -> ``name``).
    """
    raise NotImplementedError("T2.2")


def resolve_reference(reference: str, index: dict[str, str]) -> str | None:
    """Return the resource ID for *reference*, or None and log a warning.

    When None is returned, the caller skips the fact (INTERFACES.md 2.1).
    """
    raise NotImplementedError("T2.2")


def resource_facts(resource: dict, provider: str) -> list[str]:
    """Return the ``resource/3`` and ``name/2`` facts for one Sahaba resource.

    Returns an empty list for types that are not resources (see TYPE_ATOMS).
    """
    raise NotImplementedError("T2.2")


def aws_facts(resources: list[dict], index: dict[str, str]) -> list[str]:
    """Return the AWS facts, using the AWS column of INTERFACES.md 2.4.

    has_public_ip, protected_by, open_to_internet, runs_as, can_assume,
    allows, user, console_access, mfa_enabled, public_bucket, sensitive.
    """
    raise NotImplementedError("T2.1, T2.2")


def gcp_facts(resources: list[dict], index: dict[str, str]) -> list[str]:
    """Return the GCP facts, using the GCP column of INTERFACES.md 2.4."""
    raise NotImplementedError("T2.1, T2.2")


def oci_facts(resources: list[dict], index: dict[str, str]) -> list[str]:
    """Return the OCI facts, using the OCI column of INTERFACES.md 2.4.

    Available from today's scanner data: has_public_ip, protected_by
    (VNIC subnet -> security lists), open_to_internet, user, mfa_enabled,
    console_access (after T2.5), public_bucket, sensitive.

    ``allows``: one fact per IAM policy statement in ``raw_data.statements``
    (``Allow group G to <verb> <resource-type> in <location>``), with
    Permission = ``'<verb> <resource-type>'`` and Target = ``any`` unless the
    statement names a scanned resource. A ``group`` statement becomes one
    fact per member user (see ``oci_group_members``); a ``dynamic-group``
    statement becomes one fact for the dynamic group.

    ``runs_as``: instance -> dynamic group whose matching rule selects it
    (see ``oci_dynamic_group_members``).

    ``can_assume``: none; OCI has no role assumption between identities.

    Group memberships and dynamic groups are not collected yet
    (INTERFACES.md section 6, gap 4; scanner change in
    ``providers/oci.py``). Until then, skip these facts and log a warning.
    """
    raise NotImplementedError("T2.1, T2.2")


def oci_group_members(resources: list[dict]) -> dict[str, list[str]]:
    """Map each OCI group name to the IDs of its member users.

    Used to expand ``Allow group G ...`` statements into per-user
    ``allows`` facts. Needs the user group memberships from the scanner (gap 4).
    """
    raise NotImplementedError("T2.2")


def oci_dynamic_group_members(resources: list[dict]) -> dict[str, list[str]]:
    """Map each OCI dynamic group to the IDs of the instances it matches.

    Used for ``runs_as(Instance, DynamicGroup)``. Needs the dynamic groups
    and their matching rules from the scanner (gap 4).
    """
    raise NotImplementedError("T2.2")


def finding_facts(results: dict) -> list[str]:
    """Return one ``finding(Id, RuleId, Severity)`` fact per ``FAIL`` finding.

    ``resource_id`` (``res-N``) is replaced by that resource's
    ``provider_resource_id``; ``rule_id`` is kept exactly as given.
    """
    raise NotImplementedError("T2.4")
