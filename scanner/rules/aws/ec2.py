RULES = [
    {
        "id": "EC2-001",
        "name": "Public SSH Access",
        "severity": "High",
        "description": "Security Group allows SSH from 0.0.0.0/0.",
        "recommendation": "Restrict SSH access to trusted IP addresses.",
        "check": lambda config: config.get("public_ssh", False),
    }
]