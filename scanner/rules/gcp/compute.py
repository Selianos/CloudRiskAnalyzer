"""
rules/gcp/compute.py
=====================

Security rules for GCP Compute Engine VM instance configurations.
"""

from __future__ import annotations

from rules.common import BaseRule

_RESOURCE_TYPE = "Compute Engine"


class ExternalIpAssigned(BaseRule):
    """Flags VM instances with a public (external) IP address."""

    rule_id = "GCP-VM-001"
    provider = "GCP"
    category = "Compute"
    title = "External IP Assigned"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    description = "The instance has an external IP address, making it directly reachable from the internet."
    recommendation = "Remove the external IP and access the instance via Cloud NAT, IAP, or a bastion host instead."

    def check(self, configuration: dict) -> bool:
        """Return True if the instance has an external IP."""
        return configuration.get("has_external_ip", False)


class ShieldedVmSecureBootDisabled(BaseRule):
    """Flags VM instances without Shielded VM Secure Boot enabled."""

    rule_id = "GCP-VM-002"
    provider = "GCP"
    category = "Compute"
    title = "Shielded VM Secure Boot Disabled"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    description = "Secure Boot is disabled, reducing protection against boot-level and firmware rootkits."
    recommendation = "Enable Shielded VM Secure Boot on the instance."

    def check(self, configuration: dict) -> bool:
        """Return True if Shielded VM Secure Boot is disabled."""
        shielded_config = configuration.get("shielded_vm_config") or {}
        return not shielded_config.get("enable_secure_boot", False)


class SerialPortEnabled(BaseRule):
    """Flags VM instances with the interactive serial port enabled."""

    rule_id = "GCP-VM-003"
    provider = "GCP"
    category = "Compute"
    title = "Serial Port Enabled"
    severity = "HIGH"
    resource_type = _RESOURCE_TYPE
    description = "Interactive serial port access is enabled, exposing an additional remote access surface."
    recommendation = "Disable serial port access by setting the 'serial-port-enable' metadata key to 'false'."

    def check(self, configuration: dict) -> bool:
        """Return True if the serial port is enabled."""
        return configuration.get("metadata_serial_port_enabled", False)


class IpForwardingEnabled(BaseRule):
    """Flags VM instances configured to forward IP traffic."""

    rule_id = "GCP-VM-004"
    provider = "GCP"
    category = "Compute"
    title = "IP Forwarding Enabled"
    severity = "MEDIUM"
    resource_type = _RESOURCE_TYPE
    description = "IP forwarding is enabled, allowing the instance to route traffic on behalf of other hosts."
    recommendation = "Disable IP forwarding unless the instance is an intentional router, NAT gateway, or VPN endpoint."

    def check(self, configuration: dict) -> bool:
        """Return True if IP forwarding is enabled."""
        return configuration.get("can_ip_forward", False)


RULES = [
    ExternalIpAssigned(),
    ShieldedVmSecureBootDisabled(),
    SerialPortEnabled(),
    IpForwardingEnabled(),
]
