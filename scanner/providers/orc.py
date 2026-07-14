import oci
from oci.config import from_file, validate_config

class OrcProvider():
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

    def required_credentials(self):
        return []

    def connect(self, credentials):
        self._config = from_file()
        validate_config(self._config)

        self._tenancy_id = self._config["tenancy"]
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
            self._object_storage_client = oci.object_storage.ObjectStorageClient(self._config)
        except Exception as exc:
            print(f"[OCI] Could not initialize Object Storage client: {exc}")

        try:
            self._namespace = self._object_storage_client.get_namespace().data
        except Exception as exc:
            print(f"[OCI] Could not fetch Object Storage namespace: {exc}")

        print(f"[OCI] Connected - tenancy: {self._tenancy_id}")

    def validate_credentials(self):
        if self._config is None or self._identity_client is None:
            print("[OCI] Not connected. Call connect() first.")
            return False

        user = self._identity_client.get_user(self._config["user"]).data
        print(f"[OCI] Authenticated as: {user.name} ({user.id})")
        return True

    def disconnect(self):
        self._identity_client = None
        self._compute_client = None
        self._network_client = None
        self._object_storage_client = None
        self._config = None
        self._tenancy_id = None
        self._compartment_id = None
        self._namespace = None
        print("[OCI] Disconnected.")

    # ----------------------to be implemented-------------------------- #
    def list_supported_resources(self):
        return ["Compute", "VCN", "Subnet", "SecurityList", "ObjectStorage", "IAM_Users", "IAM_Policies"]

    def discover_resources(self):
        compartments = [self._tenancy_id]
        try:
            all_comps = oci.pagination.list_call_get_all_results(
                self._identity_client.list_compartments,
                compartment_id=self._tenancy_id,
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            ).data
            for comp in all_comps:
                if comp.lifecycle_state == "ACTIVE":
                    compartments.append(comp.id)
        except Exception as exc:
            print(f"[OCI] Error listing compartments: {exc}")

        print(f"[OCI] Found {len(compartments)} active compartments to scan.")

        resources = []
        resources.extend(self._discover_compute(compartments))
        resources.extend(self._discover_vcns(compartments))
        resources.extend(self._discover_subnets(compartments))
        resources.extend(self._discover_security_lists(compartments))
        resources.extend(self._discover_buckets(compartments))
        resources.extend(self._discover_iam_users())
        resources.extend(self._discover_iam_policies(compartments))

        print(f"[OCI] Discovered {len(resources)} resources across all compartments.")
        return resources

    def _discover_compute(self, compartments):
        results = []
        for cid in compartments:
            try:
                instances = oci.pagination.list_call_get_all_results(
                    self._compute_client.list_instances,
                    compartment_id=cid
                ).data
                for inst in instances:
                    if inst.lifecycle_state != "TERMINATED":
                        results.append({
                            "type": "Compute",
                            "id": inst.id,
                            "name": inst.display_name,
                            "compartment_id": cid
                        })
            except Exception as exc:
                print(f"[OCI] Error listing instances in compartment {cid}: {exc}")
        return results

    def _discover_vcns(self, compartments):
        results = []
        for cid in compartments:
            try:
                vcns = oci.pagination.list_call_get_all_results(
                    self._network_client.list_vcns,
                    compartment_id=cid
                ).data
                for vcn in vcns:
                    results.append({
                        "type": "VCN",
                        "id": vcn.id,
                        "name": vcn.display_name,
                        "compartment_id": cid
                    })
            except Exception as exc:
                print(f"[OCI] Error listing VCNs in compartment {cid}: {exc}")
        return results

    def _discover_subnets(self, compartments):
        results = []
        for cid in compartments:
            try:
                subnets = oci.pagination.list_call_get_all_results(
                    self._network_client.list_subnets,
                    compartment_id=cid
                ).data
                for subnet in subnets:
                    results.append({
                        "type": "Subnet",
                        "id": subnet.id,
                        "name": subnet.display_name,
                        "vcn_id": subnet.vcn_id,
                        "compartment_id": cid
                    })
            except Exception as exc:
                print(f"[OCI] Error listing subnets in compartment {cid}: {exc}")
        return results

    def _discover_security_lists(self, compartments):
        results = []
        for cid in compartments:
            try:
                sec_lists = oci.pagination.list_call_get_all_results(
                    self._network_client.list_security_lists,
                    compartment_id=cid
                ).data
                for sl in sec_lists:
                    results.append({
                        "type": "SecurityList",
                        "id": sl.id,
                        "name": sl.display_name,
                        "vcn_id": sl.vcn_id,
                        "compartment_id": cid
                    })
            except Exception as exc:
                print(f"[OCI] Error listing security lists in compartment {cid}: {exc}")
        return results

    def _discover_buckets(self, compartments):
        results = []
        if not (self._object_storage_client and self._namespace):
            return results
        for cid in compartments:
            try:
                buckets = oci.pagination.list_call_get_all_results(
                    self._object_storage_client.list_buckets,
                    namespace_name=self._namespace,
                    compartment_id=cid
                ).data
                for bucket in buckets:
                    results.append({
                        "type": "ObjectStorage",
                        "id": bucket.name,
                        "name": bucket.name,
                        "namespace": self._namespace,
                        "compartment_id": cid
                    })
            except Exception as exc:
                print(f"[OCI] Error listing buckets in compartment {cid}: {exc}")
        return results

    def _discover_iam_users(self):
        results = []
        try:
            users = oci.pagination.list_call_get_all_results(
                self._identity_client.list_users,
                compartment_id=self._tenancy_id
            ).data
            for user in users:
                results.append({
                    "type": "IAM_Users",
                    "id": user.id,
                    "name": user.name,
                    "compartment_id": self._tenancy_id
                })
        except Exception as exc:
            print(f"[OCI] Error listing IAM Users: {exc}")
        return results

    def _discover_iam_policies(self, compartments):
        results = []
        for cid in compartments:
            try:
                policies = oci.pagination.list_call_get_all_results(
                    self._identity_client.list_policies,
                    compartment_id=cid
                ).data
                for policy in policies:
                    results.append({
                        "type": "IAM_Policies",
                        "id": policy.id,
                        "name": policy.name,
                        "compartment_id": cid
                    })
            except Exception as exc:
                print(f"[OCI] Error listing IAM Policies in compartment {cid}: {exc}")
        return results

    def get_configuration(self, resource):
        print(f"[OCI] Collecting configuration for {resource['type']}: {resource['name']}...")
        rtype = resource.get("type", "")
        cid = resource.get("compartment_id", self._compartment_id)

        dispatch = {
            "Compute": lambda: self._get_compute_config(resource, cid),
            "VCN": lambda: self._get_vcn_config(resource),
            "Subnet": lambda: self._get_subnet_config(resource),
            "SecurityList": lambda: self._get_security_list_config(resource),
            "ObjectStorage": lambda: self._get_bucket_config(resource),
            "IAM_Users": lambda: self._get_iam_user_config(resource),
            "IAM_Policies": lambda: self._get_iam_policy_config(resource)
        }

        handler = dispatch.get(rtype)
        if handler:
            return handler()

        return {
            "id": resource.get("id"),
            "name": resource.get("name"),
            "type": rtype
        }

    def _get_compute_config(self, resource, cid):
        try:
            inst = self._compute_client.get_instance(resource["id"]).data
            public_ips = []
            vnic_attachments = oci.pagination.list_call_get_all_results(
                self._compute_client.list_vnic_attachments,
                compartment_id=cid,
                instance_id=inst.id
            ).data
            for va in vnic_attachments:
                try:
                    vnic = self._network_client.get_vnic(va.vnic_id).data
                    if vnic.public_ip:
                        public_ips.append(vnic.public_ip)
                except Exception:
                    pass
            return {
                "id": inst.id,
                "name": inst.display_name,
                "shape": inst.shape,
                "lifecycle_state": inst.lifecycle_state,
                "public_ips": public_ips,
                "has_public_ip": len(public_ips) > 0
            }
        except Exception as exc:
            print(f"[OCI] Error getting compute config: {exc}")
            return {}

    def _get_vcn_config(self, resource):
        try:
            vcn = self._network_client.get_vcn(resource["id"]).data
            return {
                "id": vcn.id,
                "name": vcn.display_name,
                "cidr_block": vcn.cidr_block,
                "lifecycle_state": vcn.lifecycle_state
            }
        except Exception as exc:
            print(f"[OCI] Error getting VCN config: {exc}")
            return {}

    def _get_subnet_config(self, resource):
        try:
            subnet = self._network_client.get_subnet(resource["id"]).data
            return {
                "id": subnet.id,
                "name": subnet.display_name,
                "cidr_block": subnet.cidr_block,
                "prohibit_public_ip_on_vnic": subnet.prohibit_public_ip_on_vnic,
                "is_public": not subnet.prohibit_public_ip_on_vnic,
                "security_list_ids": subnet.security_list_ids
            }
        except Exception as exc:
            print(f"[OCI] Error getting Subnet config: {exc}")
            return {}

    def _get_security_list_config(self, resource):
        try:
            sl = self._network_client.get_security_list(resource["id"]).data
            ingress_rules = []
            for rule in (sl.ingress_security_rules or []):
                entry = {
                    "source": rule.source,
                    "protocol": rule.protocol,
                    "source_type": rule.source_type
                }
                if rule.tcp_options and rule.tcp_options.destination_port_range:
                    entry["port_min"] = rule.tcp_options.destination_port_range.min
                    entry["port_max"] = rule.tcp_options.destination_port_range.max
                ingress_rules.append(entry)

            public_ssh = any(
                r.get("source") == "0.0.0.0/0" and
                r.get("protocol") == "6" and
                r.get("port_min", 0) <= 22 <= r.get("port_max", 0)
                for r in ingress_rules
            )
            public_rdp = any(
                r.get("source") == "0.0.0.0/0" and
                r.get("protocol") == "6" and
                r.get("port_min", 0) <= 3389 <= r.get("port_max", 0)
                for r in ingress_rules
            )
            return {
                "id": sl.id,
                "name": sl.display_name,
                "ingress_rules": ingress_rules,
                "public_ssh": public_ssh,
                "public_rdp": public_rdp
            }
        except Exception as exc:
            print(f"[OCI] Error getting SecurityList config: {exc}")
            return {}

    def _get_bucket_config(self, resource):
        try:
            bucket = self._object_storage_client.get_bucket(
                namespace_name=resource["namespace"],
                bucket_name=resource["name"]
            ).data
            return {
                "id": bucket.name,
                "name": bucket.name,
                "public_access_type": bucket.public_access_type,
                "is_public": bucket.public_access_type != "NoPublicAccess",
                "kms_key_id": bucket.kms_key_id,
                "encrypted_with_cmk": bucket.kms_key_id is not None,
                "versioning": bucket.versioning
            }
        except Exception as exc:
            print(f"[OCI] Error getting Bucket config: {exc}")
            return {}

    def _get_iam_user_config(self, resource):
        try:
            user = self._identity_client.get_user(resource["id"]).data
            api_keys = []
            try:
                api_keys = self._identity_client.list_api_keys(user_id=user.id).data
            except Exception:
                pass
            return {
                "id": user.id,
                "name": user.name,
                "is_mfa_activated": user.is_mfa_activated,
                "api_key_count": len(api_keys)
            }
        except Exception as exc:
            print(f"[OCI] Error getting IAM User config: {exc}")
            return {}

    def _get_iam_policy_config(self, resource):
        try:
            policy = self._identity_client.get_policy(resource["id"]).data
            broad_statements = [
                s for s in (policy.statements or [])
                if "manage all-resources" in s.lower()
            ]
            return {
                "id": policy.id,
                "name": policy.name,
                "statements": policy.statements or [],
                "has_broad_permissions": len(broad_statements) > 0,
                "broad_statements": broad_statements
            }
        except Exception as exc:
            print(f"[OCI] Error getting IAM Policy config: {exc}")
            return {}
