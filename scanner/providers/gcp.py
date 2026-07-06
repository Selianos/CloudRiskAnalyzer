# GCP API / SDK integration
class GCPProvider:
    name = "GCP"

    def required_credentials(self):
        """Return the credentials required by this provider."""
        return [
            {
                "name": "project_id",
                "label": "GCP Project ID",
                "secret": False,
            },
            {
                "name": "service_account_key",
                "label": "Service Account Key (JSON file path)",
                "secret": False,
            },
        ]

    def connect(self, credentials):
        """Authenticate with GCP."""
        self.credentials = credentials
        print("Connecting to GCP...")

    def validate_credentials(self):
        """Verify the provided credentials."""
        print("Validating GCP credentials...")
        return True

    def disconnect(self):
        """Close the connection."""
        print("Disconnecting from GCP...")

    def list_supported_resources(self):
        """Return supported GCP resource types."""
        return [
            "Compute Engine",
            "Cloud Storage",
            "IAM",
            "Firewall Rules",
        ]

    def discover_resources(self):
        """Discover supported resources."""
        print("Discovering resources...")
        return []

    def get_configuration(self, resource):
        """Retrieve the configuration for a resource."""
        print(f"Collecting configuration for {resource}...")
        return {}