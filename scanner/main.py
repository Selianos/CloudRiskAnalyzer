from providers.aws import AWSProvider
from providers.gcp import GCPProvider

SUPPORTED_PROVIDERS = {
    "aws": AWSProvider,
    "gcp": GCPProvider,
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

    resources = provider.discover_resources()

    for resource in resources:
        configuration = provider.get_configuration(resource)

        # TODO: Evaluate security rules
        # TODO: Generate findings

    provider.disconnect()


if __name__ == "__main__":
    main()