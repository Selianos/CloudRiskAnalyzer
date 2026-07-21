import importlib

def get_rules_for_provider(provider_key):
    """
    Loads and returns security rules for a given provider key.
    """
    rules = []
    if provider_key == "oci":
        try:
            from rules.oci.oci import RULES as oci_rules
            rules.extend(oci_rules)
        except ImportError:
            pass
    elif provider_key == "aws":
        for module_name, resource_type in [("ec2", "EC2"), ("s3", "S3"), ("iam", "IAM")]:
            try:
                mod = importlib.import_module(f"rules.aws.{module_name}")
                module_rules = getattr(mod, "RULES", [])
                for r in module_rules:
                    rule_copy = r.copy()
                    rule_copy["resource_type"] = resource_type
                    rules.append(rule_copy)
            except ImportError:
                pass
    return rules


def evaluate_rules(resource, configuration, rules):
    """
    Evaluates all applicable rules against a single resource configuration.
    """
    evaluations = []
    rtype = resource.get("type")

    for rule in rules:
        target_type = rule.get("resource_type")

        # Match rule scope
        if isinstance(target_type, list):
            match = rtype in target_type
        else:
            match = rtype == target_type

        if match:
            status = "SAFE"
            try:
                if rule["check"](configuration):
                    status = rule.get("severity", "FAIL").upper()
            except Exception:
                status = "ERROR"

            evaluations.append({
                "status": status,
                "rule_id": rule.get("id"),
                "rule_name": rule.get("name"),
                "description": rule.get("description"),
                "recommendation": rule.get("recommendation")
            })

    return evaluations


def execute_rules(provider_id, results):
    """
    Executes security rules against scanned resources for a given provider.
    
    :param provider_id: str, e.g. 'oci' or 'aws'
    :param results: list of dict, each containing 'resource' and 'configuration'
    :return: list of dict, representing security findings in the shared format
    """
    findings = []
    rules = get_rules_for_provider(provider_id)

    for item in results:
        resource = item.get("resource")
        config = item.get("configuration")
        if not resource or not config:
            continue

        evals = evaluate_rules(resource, config, rules)
        for ev in evals:
            if ev["status"] not in ("SAFE", "ERROR"):
                findings.append({
                    "provider": provider_id,
                    "rule_id": ev["rule_id"],
                    "rule_name": ev["rule_name"],
                    "severity": ev["status"].capitalize(),
                    "resource_id": resource["id"],
                    "resource_name": resource["name"],
                    "resource_type": resource.get("type"),
                    "description": ev["description"],
                    "recommendation": ev["recommendation"]
                })

    return findings



def run_analysis_and_report(provider, results):
    """
    Runs the rules evaluation, prints findings to console, and writes the JSON report snapshot.
    """
    import json
    from datetime import datetime
    from providers.aws import AWSProvider
    from providers.orc import OrcProvider

    # Determine provider_id
    if isinstance(provider, OrcProvider):
        provider_id = "oci"
    elif isinstance(provider, AWSProvider):
        provider_id = "aws"
    else:
        provider_id = provider.name.lower().split()[0]

    # Evaluate security rules
    findings = execute_rules(provider_id, results)

    # Print results/findings
    print(f"\n--- Security Scanner Findings Summary ({provider.name}) ---")
    if not findings:
        print("No security findings detected. Everything is compliant!")
    else:
        print(f"Detected {len(findings)} security findings:")
        for idx, f in enumerate(findings, 1):
            severity = f["severity"].upper()
            print(f"\n[{idx}] [{severity}] {f['rule_name']} ({f['resource_type']}: {f['resource_name']})")
            print(f"    Description: {f['description']}")
            print(f"    Recommendation: {f['recommendation']}")

    # Save to a JSON file snapshot
    output_data = {
        "provider": provider.name,
        "scanned_at": datetime.now().isoformat(),
        "resources_scanned": len(results),
        "results": results,
        "findings": findings
    }

    clean_provider_name = provider.name.lower().replace(" ", "_").replace("(", "").replace(")", "")
    output_filename = f"scan_results_{clean_provider_name}.json"
    with open(output_filename, "w") as f:
        json.dump(output_data, f, indent=4)
    print(f"\n[SCANNER] Snapshot of configurations and findings successfully saved to {output_filename}")