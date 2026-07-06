RULES = [
    {
        "id": "S3-001",
        "name": "Public Bucket",
        "severity": "High",
        "description": "S3 bucket allows public access.",
        "recommendation": "Disable public access and review the bucket policy.",
        "check": lambda config: config.get("public", False),
    },
    {
        "id": "S3-002",
        "name": "Encryption Disabled",
        "severity": "Medium",
        "description": "S3 bucket encryption is disabled.",
        "recommendation": "Enable server-side encryption.",
        "check": lambda config: not config.get("encrypted", False),
    },
]