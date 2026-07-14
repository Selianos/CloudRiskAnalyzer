RULES = [
    {
        "id": "IAM-001",
        "name": "Console Access without MFA",
        "severity": "Danger",
        "description": "IAM user has console access but MFA is disabled.",
        "recommendation": "Enable Multi-Factor Authentication (MFA) immediately for this user.",
        "check": lambda config: config.get("raw_data", {}).get("PasswordLastUsed") is not None and len(config.get("mfa_devices", [])) == 0
    },
    {
        "id": "IAM-002",
        "name": "Direct Administrator Access",
        "severity": "Danger",
        "description": "IAM user has AdministratorAccess policy directly attached.",
        "recommendation": "Remove direct AdministratorAccess policy attachment and assign privileges via IAM Groups or Roles.",
        "check": lambda config: any(p.get("PolicyName") == "AdministratorAccess" for p in config.get("attached_policies", []))
    },
    {
        "id": "IAM-003",
        "name": "User Direct Inline Policies",
        "severity": "Warning",
        "description": "IAM user has inline policies attached directly to their profile.",
        "recommendation": "Convert inline policies to IAM managed policies for better auditing and reuse.",
        "check": lambda config: len(config.get("inline_policies", [])) > 0
    }
]
