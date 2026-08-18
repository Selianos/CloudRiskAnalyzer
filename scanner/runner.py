import logging
from providers.aws import AWSProvider
from providers.gcp import GCPProvider
from providers.oci import OCIProvider
from rules.executor import get_rules_for_provider, evaluate_rules

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SUPPORTED_PROVIDERS = {
    "aws": AWSProvider,
    "gcp": GCPProvider,
    "oci": OCIProvider,
}

# Maps local rules in scanner directory to rule IDs seeded in the database
RULE_MAPPING = {
    # AWS Rules
    "S3-001": "AWS-S3-001",
    "S3-002": "AWS-S3-002",
    "SEC-001": "AWS-EC2-001",
    "SEC-002": "AWS-EC2-002",
    "SEC-003": "AWS-EC2-003",
    "SEC-004": "AWS-EC2-004",
    "IAM-001": "AWS-IAM-002",
    "IAM-002": "AWS-IAM-001",
    "IAM-003": "AWS-IAM-003",
    # OCI Rules
    "OCI-COMPUTE-001": "OCI-COMPUTE-001",
    "OCI-NET-001": "OCI-NET-001",
    "OCI-NET-002": "OCI-NET-002",
    "OCI-NET-003": "OCI-NET-003",
    "OCI-STORAGE-001": "OCI-STORAGE-001",
    "OCI-STORAGE-002": "OCI-STORAGE-002",
    "OCI-IAM-001": "OCI-IAM-001",
    "OCI-IAM-002": "OCI-IAM-002",
    "OCI-IAM-003": "OCI-IAM-003",
}

class ScanRunner:
    @staticmethod
    def sanitize_configuration(config: dict) -> dict:
        import copy
        if not isinstance(config, dict):
            return config
        sanitized = copy.deepcopy(config)
        sensitive_keys = ['password', 'secret', 'api_key', 'token', 'user_data', 'user-data']
        
        def recurse(data):
            if isinstance(data, dict):
                for k, v in data.items():
                    if any(s in k.lower() for s in sensitive_keys):
                        data[k] = "[REDACTED]"
                    else:
                        recurse(v)
            elif isinstance(data, list):
                for item in data:
                    recurse(item)
                    
        recurse(sanitized)
        return sanitized

    @staticmethod
    def execute_scan(provider_name: str, credentials: dict) -> dict:
        """
        Executes a headless cloud scan for the given provider and credentials.
        Returns a dictionary containing Pydantic-compliant resources and findings lists.
        """
        provider_key = provider_name.lower().strip()
        if provider_key not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported cloud provider: {provider_name}")

        # 1. Initialize and connect the provider
        provider_cls = SUPPORTED_PROVIDERS[provider_key]
        provider = provider_cls()
        logging.info(f"Connecting to provider: {provider.name}")
        provider.connect(credentials)

        if not provider.validate_credentials():
            provider.disconnect()
            raise ValueError("Authentication with cloud provider failed: Invalid credentials")

        try:
            # 2. Discover resources
            logging.info("Step 1: Discovering cloud resources...")
            raw_resources = provider.discover_resources()
            logging.info(f"Discovered {len(raw_resources)} resources.")

            # 3. Load provider security rules
            rules = get_rules_for_provider("aws" if "aws" in provider_key else provider_key)
            
            resources_payload = []
            findings_payload = []

            # 4. Process each resource and evaluate rules
            for idx, raw_res in enumerate(raw_resources, 1):
                client_res_id = f"res-{idx}"  # Client-side temporary mapping ID
                logging.info(f"[{idx}/{len(raw_resources)}] Collecting config & checking: [{raw_res['type']}] {raw_res['name']}")

                # Collect configuration details
                configuration = provider.get_configuration(raw_res)

                # Evaluate security rules against the configuration
                evaluations = evaluate_rules(raw_res, configuration, rules)

                # Append resource to resources payload
                resources_payload.append({
                    "id": client_res_id,
                    "provider_resource_id": raw_res["id"],
                    "resource_type": raw_res["type"],
                    "name": raw_res["name"],
                    "region": raw_res.get("region") or "us-east-1",
                    "configuration": ScanRunner.sanitize_configuration(configuration)
                })
                
                for eval_res in evaluations:
                    # We only create a finding if the rule evaluation status is not SAFE (meaning the check failed)
                    if eval_res["status"] != "SAFE":
                        local_rule_id = eval_res["rule_id"]
                        
                        # Map rule ID to database seeded rule key
                        mapped_rule_id = RULE_MAPPING.get(local_rule_id, local_rule_id)
                        if not mapped_rule_id:
                            logging.warning(f"Skipping rule finding '{local_rule_id}' because it is not seeded in database rules table")
                            continue

                        findings_payload.append({
                            "resource_id": client_res_id,
                            "rule_id": mapped_rule_id,
                            "status": "FAIL",
                            "details": {
                                "reason": eval_res["description"],
                                "severity": eval_res["severity"],
                                "recommendation": eval_res["recommendation"]
                            }
                        })

            provider.disconnect()
            
            return {
                "resources": resources_payload,
                "findings": findings_payload
            }

        except Exception as e:
            logging.error(f"Error during scan pipeline execution: {e}")
            provider.disconnect()
            raise

    @staticmethod
    def get_all_rules_metadata() -> list[dict]:
        """Loads all local rules (AWS, OCI, GCP) and extracts their metadata."""
        metadata_list = []
        for provider_name in ["aws", "gcp", "oci"]:
            try:
                rules = get_rules_for_provider(provider_name)
                for r in rules:
                    if isinstance(r, dict):
                        local_id = r.get("id")
                        name = r.get("name")
                        severity = r.get("severity")
                        description = r.get("description")
                        recommendation = r.get("recommendation")
                        finding_type = r.get("finding_type")
                    else:
                        local_id = getattr(r, "id", None) or getattr(r, "rule_id", None)
                        name = getattr(r, "name", None) or getattr(r, "title", None)
                        severity = getattr(r, "severity", None)
                        description = getattr(r, "description", None)
                        recommendation = getattr(r, "recommendation", None)
                        finding_type = getattr(r, "finding_type", None)

                    # Resolve database mapped ID
                    mapped_id = RULE_MAPPING.get(local_id, local_id)
                    
                    metadata_list.append({
                        "id": mapped_id,
                        "provider": provider_name,
                        "name": name,
                        "finding_type": finding_type,
                        "severity": severity,
                        "description": description,
                        "recommendation": recommendation
                    })
            except Exception as e:
                logging.warning(f"Could not load rules metadata for provider {provider_name}: {e}")
        return metadata_list

