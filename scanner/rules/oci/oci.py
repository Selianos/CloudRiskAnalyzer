RULES = [
    {
        "id": "OCI-COMPUTE-001",
        "resource_type": "Compute",
        "name": "Instance with Public IP",
        "finding_type": "security_group_allow_all_inbound",
        "severity": "Medium",
        "description": "Compute instance has a public IP address and is exposed to the internet.",
        "recommendation": "Remove public IP attachment and use a bastion or private endpoint.",
        "check": lambda config: any(
            vnic.get("public_ip") is not None
            for vnic in config.get("raw_data", {}).get("vnics", [])
        ),
    },
    {
        "id": "OCI-NET-001",
        "resource_type": "Subnet",
        "name": "Public Subnet Enabled",
        "finding_type": "security_group_allow_all_inbound",
        "severity": "Low",
        "description": "Subnet is public and allows public IP addresses on VNICs.",
        "recommendation": "RISK: Public subnets allow compute instances to be assigned public IP addresses, putting them directly on the internet. This increases the attack surface significantly, as misconfigured firewalls or security lists will immediately expose the instances to automated exploitation.\n\nACTION STEPS:\n1. Navigate to the OCI Console 'Networking' > 'Virtual Cloud Networks'.\n2. Select the VCN and view its subnets.\n3. If instances do not need inbound internet access, migrate them to a Private Subnet.\n4. For outbound internet access, attach a NAT Gateway to the Private Subnet's route table instead.\n5. Alternatively, edit the subnet properties to prohibit public IPs on VNICs if supported by your architecture.",
        "check": lambda config: not config.get("raw_data", {}).get("prohibit_public_ip_on_vnic", True),
    },
    {
        "id": "OCI-NET-002",
        "resource_type": "SecurityList",
        "name": "Public SSH Access Allowed",
        "finding_type": "ssh_open_to_internet",
        "severity": "High",
        "description": "Security List allows incoming SSH traffic (port 22) from all source IPs (0.0.0.0/0).",
        "recommendation": "RISK: Allowing SSH (port 22) from the entire internet (0.0.0.0/0) exposes your instances to continuous brute-force credential stuffing and zero-day SSH vulnerabilities. Attackers actively scan for these open ports to gain initial access to your cloud environment.\n\nACTION STEPS:\n1. Open the OCI Console and navigate to 'Networking' > 'Virtual Cloud Networks'.\n2. Select the VCN and go to 'Security Lists'.\n3. Click the offending Security List and view the 'Ingress Rules'.\n4. Find the rule allowing port 22 from '0.0.0.0/0'.\n5. Delete the rule or edit the Source CIDR to be your specific trusted corporate IP or VPN range.",
        "check": lambda config: any(
            r.get("source") == "0.0.0.0/0" and
            r.get("protocol") == "6" and
            r.get("tcp_options") is not None and
            r["tcp_options"].get("destination_port_range") is not None and
            r["tcp_options"]["destination_port_range"].get("min", 0) <= 22 <= r["tcp_options"]["destination_port_range"].get("max", 0)
            for r in config.get("raw_data", {}).get("ingress_security_rules", [])
        ),
    },
    {
        "id": "OCI-NET-003",
        "resource_type": "SecurityList",
        "name": "Public RDP Access Allowed",
        "finding_type": "rdp_open_to_internet",
        "severity": "High",
        "description": "Security List allows incoming RDP traffic (port 3389) from all source IPs (0.0.0.0/0).",
        "recommendation": "Restrict source CIDR blocks to trusted IP addresses.",
        "check": lambda config: any(
            r.get("source") == "0.0.0.0/0" and
            r.get("protocol") == "6" and
            r.get("tcp_options") is not None and
            r["tcp_options"].get("destination_port_range") is not None and
            r["tcp_options"]["destination_port_range"].get("min", 0) <= 3389 <= r["tcp_options"]["destination_port_range"].get("max", 0)
            for r in config.get("raw_data", {}).get("ingress_security_rules", [])
        ),
    },
    {
        "id": "OCI-STORAGE-001",
        "resource_type": "ObjectStorage",
        "name": "Public Object Storage Bucket",
        "finding_type": "storage_bucket_public_read",
        "severity": "High",
        "description": "Object Storage bucket allows public access.",
        "recommendation": "RISK: A bucket with public access allows anyone on the internet to read or write objects depending on the specific public access type. Attackers can exploit this to leak sensitive data, distribute malware, or incur massive bandwidth charges.\n\nACTION STEPS:\n1. Go to the OCI Console and navigate to 'Storage' > 'Object Storage & Archive Storage' > 'Buckets'.\n2. Select the offending bucket and click 'Edit Visibility'.\n3. Change the visibility to 'Private' or 'NoPublicAccess'.\n4. Click 'Save Changes'.",
        "check": lambda config: config.get("raw_data", {}).get("public_access_type") != "NoPublicAccess",
    },
    {
        "id": "OCI-STORAGE-002",
        "resource_type": "ObjectStorage",
        "name": "Bucket Customer-Managed Key Encryption Disabled",
        "finding_type": "storage_unencrypted_at_rest",
        "severity": "Medium",
        "description": "Object Storage bucket is not encrypted using a Customer-Managed Key (KMS).",
        "recommendation": "RISK: Relying solely on Oracle-managed keys means you don't control the lifecycle, rotation, or revocation of the encryption keys protecting your data. If your compliance standards mandate strict data sovereignty, this configuration fails the audit and increases risk during a breach.\n\nACTION STEPS:\n1. Navigate to the OCI Console 'Storage' > 'Object Storage & Archive Storage' > 'Buckets'.\n2. Click on the bucket, then find the 'Encryption' section.\n3. Click 'Assign' next to 'Encryption Key'.\n4. Select a Vault and a Master Encryption Key that you manage.\n5. Click 'Assign' to apply the Customer-Managed Key (KMS).",
        "check": lambda config: config.get("raw_data", {}).get("kms_key_id") is None,
    },
    {
        "id": "OCI-IAM-001",
        "resource_type": "IAM_Users",
        "name": "MFA Not Enabled for User",
        "finding_type": "no_mfa_privileged_account",
        "severity": "High",
        "description": "IAM User does not have Multi-Factor Authentication (MFA) enabled.",
        "recommendation": "Enable MFA for the user under identity credentials.",
        "check": lambda config: not config.get("raw_data", {}).get("is_mfa_activated", False),
    },
    {
        "id": "OCI-IAM-002",
        "resource_type": "IAM_Users",
        "name": "Too Many Active API Keys",
        "finding_type": "weak_password_policy",
        "severity": "Low",
        "description": "IAM User has more than 1 active API key.",
        "recommendation": "Delete or rotate unused API keys to reduce credential leak risks.",
        "check": lambda config: len(config.get("raw_data", {}).get("api_keys", [])) > 1,
    },
    {
        "id": "OCI-IAM-003",
        "resource_type": "IAM_Policies",
        "name": "Overly Permissive Policy",
        "finding_type": "overly_permissive_iam_policy",
        "severity": "High",
        "description": "IAM Policy contains statements that allow managing all resources.",
        "recommendation": "RISK: A policy containing 'manage all-resources' grants administrative privileges. If an attacker compromises a user or instance associated with this policy, they gain full control over your OCI tenancy, allowing them to delete resources, exfiltrate data, or deploy cryptocurrency miners.\n\nACTION STEPS:\n1. Go to the OCI Console and navigate to 'Identity & Security' > 'Policies'.\n2. Select the offending policy and click 'Edit Policy Statements'.\n3. Locate the statement containing 'manage all-resources'.\n4. Modify the statement to specify only the exact resources and verbs required (e.g., 'read instances in compartment X').\n5. Save the policy changes.",
        "check": lambda config: any(
            "manage all-resources" in s.lower()
            for s in config.get("raw_data", {}).get("statements", [])
        ),
    }
]
