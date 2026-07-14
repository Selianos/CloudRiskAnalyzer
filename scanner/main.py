import sys
import pprint
from providers.aws import AWSProvider
from providers.gcp import GCPProvider
from providers.orc import OrcProvider
from rules.executor import get_rules_for_provider, evaluate_rules

SUPPORTED_PROVIDERS = {
    "aws": AWSProvider,
    "gcp": GCPProvider,
    "oci": OrcProvider,
}


def choose_provider():
    print("Supported providers:")

    for name in SUPPORTED_PROVIDERS:
        print(f" - {name}")

    while True:
        choice = input("\nSelect provider: ").strip().lower()

        if choice in SUPPORTED_PROVIDERS:
            return SUPPORTED_PROVIDERS[choice]()

        print("Invalid provider.")


def request_credentials(provider):
    credentials = {}

    print(f"\nCredentials required for {provider.name}:\n")

    for field in provider.required_credentials():
        credentials[field["name"]] = input(f'{field["label"]}: ')

    return credentials


def main():
    provider = choose_provider()

    credentials = request_credentials(provider)

    provider.connect(credentials)

    if not provider.validate_credentials():
        print("Authentication failed.")
        return

    # Load security rules for the selected provider
    provider_key = "aws" if "aws" in provider.name.lower() else provider.name.lower()
    rules = get_rules_for_provider(provider_key)

    print("\nScanning started. Redirecting all output to out.log...")

    with open("out.log", "w", encoding="utf-8") as f:
        # Redirect stdout to out.log
        original_stdout = sys.stdout
        sys.stdout = f

        try:
            print("--- Step 1: Discovering Resources ---")
            resources = provider.discover_resources()
            print(f"\n[Scanner] Discovered {len(resources)} resources:")
            for resource in resources:
                print(f" - Type: {resource['type']} | ID: {resource['id']} | Name: {resource['name']}")

            print("\n--- Step 2 & 3: Scanning Resources ---")
            for idx, resource in enumerate(resources, 1):
                # Print progress to both out.log and the interactive console
                progress_msg = f"[{idx}/{len(resources)}] Scanning resource: [{resource['type']}] {resource['name']} ({resource['id']})..."
                print(f"\n{progress_msg}")
                print(progress_msg, file=sys.__stdout__, flush=True)

                # Step 2: Collect configuration
                configuration = provider.get_configuration(resource)
                print("Configuration collected:")
                pprint.pprint(configuration, indent=2)

                # Step 3: Evaluate security rules
                resource_evaluations = evaluate_rules(resource, configuration, rules)
                print(f"Rule Evaluations (Checks: {len(resource_evaluations)}):")
                for rule_idx, eval_res in enumerate(resource_evaluations, 1):
                    status_str = f"[{eval_res['status']}]"
                    print(f"  - {status_str} Rule: {eval_res['rule_name']} ({eval_res['rule_id']})")
                    print(f"    Description:    {eval_res['description']}")
                    if eval_res['status'] != "SAFE":
                        print(f"    Recommendation: {eval_res['recommendation']}")

            provider.disconnect()

        finally:
            # Restore original stdout
            sys.stdout = original_stdout

    print("Scan completed successfully. Results saved in out.log.")


if __name__ == "__main__":
    main()