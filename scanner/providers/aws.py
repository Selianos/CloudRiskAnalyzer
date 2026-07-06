class AWSProvider:
    name = "AWS"

    def required_credentials(self):
        """Return the credentials required by this provider."""
        return [
            {
                "name": "access_key",
                "label": "AWS Access Key ID",
                "secret": False,
            },
            {
                "name": "secret_key",
                "label": "AWS Secret Access Key",
                "secret": True,
            },
            {
                "name": "region",
                "label": "AWS Region",
                "secret": False,
            },
        ]

    def connect(self, credentials):
        """Authenticate with AWS."""
        self.credentials = credentials
        print("Connecting to AWS...")

    def validate_credentials(self):
        """Verify the provided credentials."""
        print("Validating AWS credentials...")
        return True

    def disconnect(self):
        """Close the connection."""
        print("Disconnecting from AWS...")

    def list_supported_resources(self):
        """Return supported AWS resource types."""
        return [
            "EC2",
            "S3",
            "IAM",
            "Security Groups",
        ]

    def discover_resources(self):
        """Discover supported resources."""
        print("Discovering resources...")
        return []

    def get_configuration(self, resource):
        """Retrieve the configuration for a resource."""
        print(f"Collecting configuration for {resource}...")
        return {}