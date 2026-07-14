import oci
from oci.config import from_file, validate_config
from providers.base import BaseProvider


class OrcProvider(BaseProvider):
    name = "OCI (Oracle Cloud)"

    def __init__(self):
        self._config = None
        self._identity_client = None
        self._compute_client = None
        self._network_client = None
        self._object_storage_client = None
        self._tenancy_id = None
        self._compartment_id = None
        self._namespace = None

    def required_credentials(self) -> list[dict]:
        return []

    def connect(self, credentials: dict) -> None:
        try:
            self._config = from_file()
            validate_config(self._config)
        except Exception as exc:
            print(f"[OCI] Failed to load config file: {exc}")
            self._config = None
            return

        self._tenancy_id = self._config.get("tenancy")
        self._compartment_id = self._tenancy_id

        try:
            self._identity_client = oci.identity.IdentityClient(self._config)
        except Exception as exc:
            print(f"[OCI] Could not initialize Identity client: {exc}")

        try:
            self._compute_client = oci.core.ComputeClient(self._config)
        except Exception as exc:
            print(f"[OCI] Could not initialize Compute client: {exc}")

        try:
            self._network_client = oci.core.VirtualNetworkClient(self._config)
        except Exception as exc:
            print(f"[OCI] Could not initialize Network client: {exc}")

        try:
            self._object_storage_client = oci.object_storage.ObjectStorageClient(
                self._config
            )
        except Exception as exc:
            print(f"[OCI] Could not initialize Object Storage client: {exc}")

        try:
            if self._object_storage_client:
                self._namespace = (
                    self._object_storage_client.get_namespace().data
                )
        except Exception as exc:
            print(f"[OCI] Could not fetch Object Storage namespace: {exc}")

        print(f"[OCI] Connected - tenancy: {self._tenancy_id}")

    def validate_credentials(self) -> bool:
        if self._config is None or self._identity_client is None:
            print("[OCI] Not connected. Call connect() first.")
            return False

        try:
            user = self._identity_client.get_user(self._config["user"]).data
            print(f"[OCI] Authenticated as: {user.name} ({user.id})")
            return True
        except Exception as exc:
            print(f"[OCI] Connection validation failed: {exc}")
            return False

    def disconnect(self) -> None:
        self._identity_client = None
        self._compute_client = None
        self._network_client = None
        self._object_storage_client = None
        self._config = None
        self._tenancy_id = None
        self._compartment_id = None
        self._namespace = None
        print("[OCI] Disconnected.")

    def list_supported_resources(self) -> list[str]:
        return []

    def discover_resources(self) -> list[dict]:
        print("[OCI] Resource discovery not yet implemented.")
        return []

    def get_configuration(self, resource: dict) -> dict:
        print("[OCI] Configuration collection not yet implemented.")
        return {}
