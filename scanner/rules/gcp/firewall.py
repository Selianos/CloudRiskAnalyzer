"""
rules/gcp/firewall.py
======================

Security rules for GCP VPC firewall rule configurations.
"""

from __future__ import annotations

from rules.common import BaseRule

_RESOURCE_TYPE = "Firewall Rules"


def _allows_all_ports(configuration: dict) -> bool:
    """Check whether any allowed entry permits every port for its protocol.

    An "allow-all" entry is one where the protocol is 'all', or the
    protocol is 'tcp'/'udp' with no explicit port list (which GCP treats
    as "every port").

    Args:
        configuration: Normalized firewall rule configuration.

    Returns:
        True if at least one allowed entry is unrestricted by port.
    """
    for entry in configuration.get("allowed", []):
        protocol = entry.get("protocol")
        ports = entry.get("ports") or []
        if protocol == "all":
            return True
        if protocol in ("tcp", "udp") and not ports:
            return True
    return False


class SensitivePortsExposedToInternet(BaseRule):
    """Flags firewall rules that expose sensitive ports to the internet."""

    rule_id = "GCP-FW-001"
    provider = "GCP"
    category = "Network"
    title = "Sensitive Ports Exposed to the Internet"
    severity = "HIGH"
    resource_type = _RESOURCE_TYPE
    finding_type = "ssh_open_to_internet"
    description = (
        "The firewall rule allows inbound traffic from the internet (0.0.0.0/0) "
        "on sensitive ports such as SSH (22) or RDP (3389)."
    )
    recommendation = "Restrict source ranges to trusted IP addresses or use Identity-Aware Proxy for admin access."

    def check(self, configuration: dict) -> bool:
        """Return True if sensitive ports are open to the internet."""
        if not configuration.get("is_open_to_internet", False):
            return False
        risky_ports = configuration.get("risky_open_ports", [])
        return any(port != "ALL" for port in risky_ports)


class AllowAllFirewallRule(BaseRule):
    """Flags firewall rules that allow all ports/protocols from the internet."""

    rule_id = "GCP-FW-002"
    provider = "GCP"
    category = "Network"
    title = "Allow-All Firewall Rule"
    severity = "CRITICAL"
    resource_type = _RESOURCE_TYPE
    finding_type = "security_group_allow_all_inbound"
    description = "The firewall rule allows all ports and/or all protocols from the internet (0.0.0.0/0)."
    recommendation = "Replace the rule with explicit allow entries limited to the required protocols, ports, and sources."

    def check(self, configuration: dict) -> bool:
        """Return True if the rule allows all traffic from the internet."""
        if not configuration.get("is_open_to_internet", False):
            return False
        if "ALL" in configuration.get("risky_open_ports", []):
            return True
        return _allows_all_ports(configuration)


RULES = [
    SensitivePortsExposedToInternet(),
    AllowAllFirewallRule(),
]
