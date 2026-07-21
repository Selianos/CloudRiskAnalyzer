from rules.aws import ec2 as aws_ec2, s3 as aws_s3, iam as aws_iam


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
        
    if "oci" in name or "oracle" in name:
        try:
            from rules.oci.oci import RULES as oci_rules
            return oci_rules
        except ImportError:
            return []
            
    # Placeholder for other providers (GCP)
    return []


def evaluate_rules(resource: dict, configuration: dict, rules: list) -> list:
    """Evaluate all applicable rules against a resource configuration.
    
    Returns a list of rule evaluation results (dicts representing the status of each rule).
    """
    evaluations = []
    resource_type = resource.get("type", "").upper()
    resource_id = resource.get("id", "")
    resource_name = resource.get("name", "")
    
    for rule in rules:
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
            
        if match:
            try:
                # The rule check returns True if the check fails (finding exists)
                check_func = rule.get("check")
                failed = False
                if check_func:
                    failed = check_func(configuration)
                
                status = rule.get("severity", "WARNING").upper() if failed else "SAFE"
                
                evaluations.append({
                    "rule_id": rule.get("id"),
                    "rule_name": rule.get("name"),
                    "severity": rule.get("severity"),
                    "status": status,
                    "description": rule.get("description"),
                    "recommendation": rule.get("recommendation") if failed else None,
                    "resource_type": resource["type"],
                    "resource_id": resource_id,
                    "resource_name": resource_name
                })
            except Exception as e:
                print(f"[Error] Failed to evaluate rule {rule.get('id')} on resource {resource_id}: {e}")
                
    return evaluations
