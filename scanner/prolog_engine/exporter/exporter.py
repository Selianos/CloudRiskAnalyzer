"""
exporter.py -- converts a Sahaba scan result into Prolog facts.

Input : the dict returned by ScanRunner.execute_scan()
        {"resources": [...], "findings": [...]} plus the provider name.
Output: facts/<scan_id>.pl  (working memory for one scan)

Every reference found inside a configuration (role ARN, instance-profile
role, service-account e-mail, OCI subnet / security-list OCID) is resolved
to the provider_resource_id of a scanned resource, so all facts use the
same identifiers. References that point outside the scan are dropped.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

WATCHED_PORTS = (22, 3389)          # remote-login ports (rule R1)
SENSITIVE_TAG_KEYS = ("data-classification", "data_classification", "DataClassification")
SENSITIVE_VALUES = ("sensitive", "confidential", "restricted")
INTERNET = ("0.0.0.0/0", "::/0")


def q(value) -> str:
    """Quote any value as a Prolog atom: 'i-0abc', 'arn:aws:...'."""
    s = str(value).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


class FactWriter:
    def __init__(self):
        self.facts: set[str] = set()

    def add(self, pred: str, *args):
        self.facts.add(f"{pred}({', '.join(q(a) if not isinstance(a, int) else str(a) for a in args)}).")

    def render(self, header: str) -> str:
        by_pred: dict[str, list[str]] = {}
        for f in self.facts:
            by_pred.setdefault(f.split("(")[0], []).append(f)
        out = [header]
        for pred in sorted(by_pred):
            out.append(f"\n% {pred}")
            out.extend(sorted(by_pred[pred]))
        return "\n".join(out) + "\n"


# ---------------------------------------------------------------- helpers
def _as_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def _is_sensitive(tags: dict) -> bool:
    return any(str(tags.get(k, "")).lower() in SENSITIVE_VALUES for k in SENSITIVE_TAG_KEYS)


def _port_set(from_port, to_port, protocol) -> list:
    """Watched ports covered by a rule; 'all' when every port is open."""
    if protocol in ("-1", "all") or from_port is None or to_port is None:
        return ["all"]
    if int(from_port) == 0 and int(to_port) == 65535:
        return ["all"]
    return [p for p in WATCHED_PORTS if int(from_port) <= p <= int(to_port)]


def _aws_action_level(action: str):
    """Map an IAM action to the simplified levels read / write / admin."""
    a = action.lower()
    if a == "*":
        return "admin"
    svc, _, verb = a.partition(":")
    if svc != "s3":
        return None
    if verb == "*" or verb.startswith(("put", "delete")):
        return "write"
    if verb.startswith(("get", "list")):
        return "read"
    return None


# ------------------------------------------------------------------- AWS
def export_aws(scan: dict, fw: FactWriter):
    res = scan["resources"]
    role_by_name = {r["name"]: r["provider_resource_id"] for r in res if r["resource_type"] == "IAM Role"}
    user_by_name = {r["name"]: r["provider_resource_id"] for r in res if r["resource_type"] == "IAM"}
    buckets = {r["provider_resource_id"] for r in res if r["resource_type"] == "S3"}

    def principal_id(arn: str):
        """arn:aws:iam::123:role/Name -> role id; ...:user/Name -> user id."""
        m = re.match(r"arn:aws:iam::\d+:(role|user)/(?:.*/)?([^/]+)$", arn)
        if not m:
            return None
        return (role_by_name if m.group(1) == "role" else user_by_name).get(m.group(2))

    def bucket_of(arn: str):
        if arn == "*":
            return "*"
        m = re.match(r"arn:aws:s3:::([^/]+)", arn)
        if m and m.group(1) == "*":
            return "*"                     # every bucket
        return m.group(1) if m and m.group(1) in buckets else None   # prefixes like "cust*" are not expanded

    def policy_facts(pid: str, cfg: dict):
        docs = [p.get("PolicyDocument", {}) for p in _as_list(cfg.get("attached_policies"))
                if isinstance(p, dict)]
        docs += [p.get("PolicyDocument", {}) for p in _as_list(cfg.get("inline_policies"))
                 if isinstance(p, dict)]
        for doc in docs:
            for st in _as_list(doc.get("Statement")):
                if st.get("Effect") != "Allow":
                    continue
                for action in _as_list(st.get("Action")):
                    level = _aws_action_level(action)
                    if not level:
                        continue
                    for r in _as_list(st.get("Resource")):
                        target = bucket_of(r)
                        if target:
                            fw.add("allows", pid, level, target)

    for r in res:
        rid, rtype, cfg = r["provider_resource_id"], r["resource_type"], r.get("configuration", {})
        fw.add("label", rid, r["name"])

        if rtype == "EC2":
            fw.add("resource", rid, "aws", "ec2_instance")
            for sg in _as_list(cfg.get("security_groups")):
                fw.add("uses_network_rule", rid, sg["GroupId"])
            for role_name in _as_list(cfg.get("iam_roles")):         # added by T2.3
                if role_name in role_by_name:
                    fw.add("instance_identity", rid, role_by_name[role_name])

        elif rtype == "Security Groups":
            fw.add("resource", rid, "aws", "security_group")
            for perm in cfg.get("raw_data", {}).get("IpPermissions", []):
                cidrs = [x.get("CidrIp") for x in perm.get("IpRanges", [])] + \
                        [x.get("CidrIpv6") for x in perm.get("Ipv6Ranges", [])]
                if any(c in INTERNET for c in cidrs):
                    for p in _port_set(perm.get("FromPort"), perm.get("ToPort"), perm.get("IpProtocol")):
                        fw.add("open_to_internet", rid, p)

        elif rtype == "S3":
            fw.add("resource", rid, "aws", "s3_bucket")
            if _is_sensitive(cfg.get("tags", {})):                     # added by T2.3
                fw.add("sensitive", rid)
            pab = cfg.get("public_access_block", {})
            blocked = isinstance(pab, dict) and pab.get("RestrictPublicBuckets") and pab.get("IgnorePublicAcls")
            policy = cfg.get("policy")
            if not blocked and isinstance(policy, str) and policy:
                for st in _as_list(json.loads(policy).get("Statement")):
                    pr = st.get("Principal")
                    if st.get("Effect") == "Allow" and (pr == "*" or (isinstance(pr, dict) and pr.get("AWS") == "*")):
                        fw.add("public_bucket", rid)

        elif rtype == "IAM":
            if cfg.get("is_root"):
                continue                                               # root is not a path node
            fw.add("resource", rid, "aws", "iam_user")
            row = cfg.get("credential_report_row", {})
            if row.get("password_enabled") == "true":                 # kept by T2.5
                fw.add("console_login", rid)
            if cfg.get("mfa_devices"):
                fw.add("mfa_enabled", rid)
            policy_facts(rid, cfg)

        elif rtype == "IAM Role":
            fw.add("resource", rid, "aws", "iam_role")
            policy_facts(rid, cfg)
            trust = cfg.get("raw_data", {}).get("AssumeRolePolicyDocument", {})
            for st in _as_list(trust.get("Statement")):
                if st.get("Effect") != "Allow":
                    continue
                for arn in _as_list((st.get("Principal") or {}).get("AWS")):
                    src = principal_id(arn)
                    if src:
                        fw.add("can_assume", src, rid)


# ------------------------------------------------------------------- GCP
GCP_ROLE_LEVEL = {
    "roles/owner": "admin", "roles/editor": "admin",
    "roles/storage.admin": "write", "roles/storage.objectAdmin": "write",
    "roles/storage.objectViewer": "read", "roles/viewer": "read",
}
GCP_IMPERSONATE = ("roles/iam.serviceAccountTokenCreator", "roles/iam.serviceAccountUser")


def export_gcp(scan: dict, fw: FactWriter):
    res = scan["resources"]
    sa_by_email = {r["configuration"].get("name"): r["provider_resource_id"] for r in res
                   if r["resource_type"] == "IAM" and r["configuration"].get("subtype") == "service_account"}
    firewalls = [r for r in res if r["resource_type"] == "Firewall Rules"]

    def member_id(m: str):
        kind, _, ident = m.partition(":")
        if kind == "serviceAccount":
            return sa_by_email.get(ident)
        if kind == "user":
            fw.add("resource", m, "gcp", "gcp_user")
            fw.add("label", m, ident)
            return m
        return None

    for r in res:
        rid, rtype, cfg = r["provider_resource_id"], r["resource_type"], r.get("configuration", {})
        fw.add("label", rid, r["name"])

        if rtype == "Compute Engine":
            fw.add("resource", rid, "gcp", "gce_instance")
            nets = {n.get("network") for n in cfg.get("network_interfaces", [])}
            if cfg.get("has_external_ip"):
                for f in firewalls:          # instance network tags are not collected (3.5.1)
                    fc = f["configuration"]
                    if fc.get("network") in nets and not fc.get("target_tags") and not fc.get("disabled"):
                        fw.add("uses_network_rule", rid, f["provider_resource_id"])
            for sa in cfg.get("service_accounts", []):
                if sa.get("email") in sa_by_email:
                    fw.add("instance_identity", rid, sa_by_email[sa["email"]])

        elif rtype == "Firewall Rules":
            fw.add("resource", rid, "gcp", "gcp_firewall_rule")
            if cfg.get("is_open_to_internet") and cfg.get("direction", "INGRESS") == "INGRESS":
                for a in cfg.get("allowed", []):
                    ports = a.get("ports") or []
                    if not ports or a.get("protocol") == "all":
                        fw.add("open_to_internet", rid, "all")
                        continue
                    for p in ports:
                        lo, _, hi = str(p).partition("-")
                        for wp in _port_set(int(lo), int(hi or lo), a.get("protocol")):
                            fw.add("open_to_internet", rid, wp)

        elif rtype == "Cloud Storage":
            fw.add("resource", rid, "gcp", "gcs_bucket")
            if cfg.get("is_public"):
                fw.add("public_bucket", rid)
            if _is_sensitive(cfg.get("labels", {})):
                fw.add("sensitive", rid)

        elif rtype == "IAM" and cfg.get("subtype") == "service_account":
            fw.add("resource", rid, "gcp", "gcp_service_account")

        elif rtype == "IAM" and cfg.get("subtype") == "project_iam_policy":
            for b in cfg.get("bindings", []):
                for m in b.get("members", []):
                    pid = member_id(m)
                    if not pid:
                        continue
                    if b["role"] in GCP_ROLE_LEVEL:            # project level = every bucket
                        fw.add("allows", pid, GCP_ROLE_LEVEL[b["role"]], "*")
                    if b["role"] in GCP_IMPERSONATE:
                        for sa in sa_by_email.values():
                            if sa != pid:
                                fw.add("can_assume", pid, sa)


# ------------------------------------------------------------------- OCI
OCI_VERB_LEVEL = {"manage": "admin", "use": "write", "read": "read", "inspect": None}


def export_oci(scan: dict, fw: FactWriter):
    res = scan["resources"]
    subnets = {r["provider_resource_id"]: r["configuration"].get("raw_data", {}) for r in res
               if r["resource_type"] == "Subnet"}
    for r in res:
        rid, rtype, cfg = r["provider_resource_id"], r["resource_type"], r.get("configuration", {})
        raw = cfg.get("raw_data", {})
        fw.add("label", rid, r["name"])

        if rtype == "Compute":
            fw.add("resource", rid, "oci", "oci_instance")
            for v in raw.get("vnics", []):
                if v.get("public_ip"):
                    for sl in subnets.get(v.get("subnet_id"), {}).get("security_list_ids", []):
                        fw.add("uses_network_rule", rid, sl)
            # instance principals (dynamic groups) are not collected -> no instance_identity

        elif rtype == "SecurityList":
            fw.add("resource", rid, "oci", "oci_security_list")
            for rule in raw.get("ingress_security_rules", []):
                if rule.get("source") not in INTERNET:
                    continue
                rng = (rule.get("tcp_options") or {}).get("destination_port_range")
                if rule.get("protocol") == "all" or not rng:
                    fw.add("open_to_internet", rid, "all")
                else:
                    for p in _port_set(rng.get("min"), rng.get("max"), "tcp"):
                        fw.add("open_to_internet", rid, p)

        elif rtype == "ObjectStorage":
            fw.add("resource", rid, "oci", "oci_bucket")
            if raw.get("public_access_type", "NoPublicAccess") != "NoPublicAccess":
                fw.add("public_bucket", rid)
            if _is_sensitive(raw.get("freeform_tags") or {}):
                fw.add("sensitive", rid)

        elif rtype == "IAM_Users":
            fw.add("resource", rid, "oci", "oci_user")
            if (raw.get("capabilities") or {}).get("can_use_console_password"):   # kept by T2.5
                fw.add("console_login", rid)
            if raw.get("is_mfa_activated"):
                fw.add("mfa_enabled", rid)
            # group membership is not collected, so policy statements
            # ("Allow group X to ...") cannot be linked to users yet (5.2)


EXPORTERS = {"aws": export_aws, "gcp": export_gcp, "oci": export_oci}


def export_scan(scan_id: str, provider: str, scan: dict, out_dir: str = "facts") -> Path:
    fw = FactWriter()
    EXPORTERS[provider.lower()](scan, fw)
    by_client_id = {r["id"]: r["provider_resource_id"] for r in scan["resources"]}
    for f in scan.get("findings", []):                         # T2.4
        target = by_client_id.get(f["resource_id"])
        if target:
            sev = str(f.get("details", {}).get("severity", "INFO")).lower()
            fw.add("finding", f["rule_id"], target, sev)
    os.makedirs(out_dir, exist_ok=True)
    path = Path(out_dir) / f"{scan_id}.pl"
    header = (f"% facts for scan {scan_id} ({provider.upper()}) -- generated by exporter.py\n"
              f"% {len(fw.facts)} facts")
    path.write_text(fw.render(header), encoding="utf-8")
    return path


if __name__ == "__main__":
    # python exporter.py <scan_result.json> <provider> <scan_id>
    src, provider, scan_id = sys.argv[1:4]
    p = export_scan(scan_id, provider, json.loads(Path(src).read_text()))
    print(f"wrote {p}")
