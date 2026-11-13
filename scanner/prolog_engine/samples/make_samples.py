"""Builds sample scan results in the exact shape of ScanRunner.execute_scan()."""
import json

ACC = "123456789012"   # AWS documentation placeholder, not a real account
def role_arn(n): return f"arn:aws:iam::{ACC}:role/{n}"
ADMIN = {"PolicyName": "AdministratorAccess", "PolicyArn": "arn:aws:iam::aws:policy/AdministratorAccess",
         "PolicyDocument": {"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]}}
def inline(name, actions, resources):
    return {"PolicyName": name, "PolicyDocument": {"Statement": [{"Effect": "Allow", "Action": actions, "Resource": resources}]}}
def trust(*principals):
    return {"Statement": [{"Effect": "Allow", "Principal": {"AWS": [role_arn(p) for p in principals]}, "Action": "sts:AssumeRole"}]}
def sg(gid, name, perms): return {"GroupId": gid, "GroupName": name, "IpPermissions": perms}
SSH_OPEN = [{"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "0.0.0.0/0"}], "Ipv6Ranges": []}]
PRIVATE = [{"IpProtocol": "tcp", "FromPort": 5432, "ToPort": 5432, "IpRanges": [{"CidrIp": "10.0.0.0/16"}], "Ipv6Ranges": []}]
PAB_ON = {"BlockPublicAcls": True, "IgnorePublicAcls": True, "BlockPublicPolicy": True, "RestrictPublicBuckets": True}

aws = [
 ("EC2", "i-0a1b2c3d4e5f60001", "web-server", {"security_groups": [sg("sg-0web", "web-sg", SSH_OPEN)],
        "public_ssh": True, "iam_roles": ["WebAppRole"],
        "raw_data": {"IamInstanceProfile": {"Arn": f"arn:aws:iam::{ACC}:instance-profile/web-profile"}}}),
 ("EC2", "i-0a1b2c3d4e5f60002", "batch-worker", {"security_groups": [sg("sg-0db", "internal-sg", PRIVATE)],
        "public_ssh": False, "iam_roles": ["BatchRole"]}),
 ("Security Groups", "sg-0web", "web-sg", {"raw_data": sg("sg-0web", "web-sg", SSH_OPEN), "public_ssh": True}),
 ("Security Groups", "sg-0db", "internal-sg", {"raw_data": sg("sg-0db", "internal-sg", PRIVATE), "public_ssh": False}),
 ("S3", "customer-data", "customer-data", {"bucket_name": "customer-data", "public_access_block": PAB_ON,
        "tags": {"data-classification": "sensitive"}, "policy": {"error": "NoSuchBucketPolicy"}}),
 ("S3", "finance-reports", "finance-reports", {"bucket_name": "finance-reports", "public_access_block": PAB_ON,
        "tags": {"data-classification": "sensitive"}, "policy": {"error": "NoSuchBucketPolicy"}}),
 ("S3", "app-logs", "app-logs", {"bucket_name": "app-logs", "public_access_block": PAB_ON, "tags": {},
        "policy": {"error": "NoSuchBucketPolicy"}}),
 ("S3", "public-assets", "public-assets", {"bucket_name": "public-assets", "public_access_block": {}, "tags": {},
        "policy": json.dumps({"Statement": [{"Effect": "Allow", "Principal": "*", "Action": "s3:GetObject",
                                             "Resource": "arn:aws:s3:::public-assets/*"}]})}),
 ("IAM", "AIDAVNQVX32OINTERN01", "intern", {"is_root": False, "mfa_devices": [], "attached_policies": [],
        "inline_policies": [inline("read-logs", ["s3:GetObject", "s3:ListBucket"], ["arn:aws:s3:::app-logs", "arn:aws:s3:::app-logs/*"])],
        "credential_report_row": {"user": "intern", "password_enabled": "true", "mfa_active": "false"}}),
 ("IAM", "AIDAVNQVX32OADMIN001", "cloud-admin", {"is_root": False, "attached_policies": [ADMIN], "inline_policies": [],
        "mfa_devices": [{"SerialNumber": f"arn:aws:iam::{ACC}:mfa/cloud-admin"}],
        "credential_report_row": {"user": "cloud-admin", "password_enabled": "true", "mfa_active": "true"}}),
 ("IAM", "<root_account>", "<root_account>", {"is_root": True, "credential_report_row": {"mfa_active": "true"}}),
 ("IAM Role", "AROAVNQVX32OWEBAPP01", "WebAppRole", {"is_role": True, "attached_policies": [],
        "inline_policies": [inline("logs", ["s3:PutObject"], ["arn:aws:s3:::app-logs/*"])],
        "raw_data": {"RoleName": "WebAppRole", "AssumeRolePolicyDocument": {"Statement": [
            {"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]}}}),
 ("IAM Role", "AROAVNQVX32ODEPLOY01", "DeployRole", {"is_role": True, "attached_policies": [ADMIN], "inline_policies": [],
        "raw_data": {"RoleName": "DeployRole", "AssumeRolePolicyDocument": trust("WebAppRole", "BatchRole")}}),
 ("IAM Role", "AROAVNQVX32OBATCH001", "BatchRole", {"is_role": True, "attached_policies": [],
        "inline_policies": [inline("read-customers", ["s3:GetObject"], ["arn:aws:s3:::customer-data/*"])],
        "raw_data": {"RoleName": "BatchRole", "AssumeRolePolicyDocument": trust("DeployRole")}}),
]
aws_findings = [
 ("i-0a1b2c3d4e5f60001", "AWS-EC2-001", "Critical", "Instance allows SSH (22) from 0.0.0.0/0."),
 ("sg-0web", "AWS-EC2-001", "Critical", "Security Group allows SSH (22) from 0.0.0.0/0."),
 ("public-assets", "AWS-S3-001", "High", "S3 bucket allows public access."),
 ("AIDAVNQVX32OINTERN01", "IAM-007", "High", "IAM user has console login without MFA."),
 ("AIDAVNQVX32OADMIN001", "AWS-IAM-003", "Critical", "IAM User has AdministratorAccess policy directly attached."),
 ("AROAVNQVX32ODEPLOY01", "IAM-004", "Critical", "Role has AdministratorAccess."),
]

gcp = [
 ("Compute Engine", "7781234500001", "ci-runner", {"type": "Compute Engine", "name": "ci-runner", "has_external_ip": True,
        "network_interfaces": [{"network": "default", "internal_ip": "10.128.0.2", "external_ips": ["34.70.1.9"]}],
        "service_accounts": [{"email": "runner-sa@sahaba-demo.iam.gserviceaccount.com", "scopes": ["https://www.googleapis.com/auth/cloud-platform"]}]}),
 ("Firewall Rules", "4410000000001", "allow-ssh", {"type": "Firewall Rules", "name": "allow-ssh", "network": "default",
        "direction": "INGRESS", "disabled": False, "source_ranges": ["0.0.0.0/0"], "target_tags": [],
        "is_open_to_internet": True, "allowed": [{"protocol": "tcp", "ports": ["22"]}], "risky_open_ports": ["22"]}),
 ("Cloud Storage", "patient-records", "patient-records", {"type": "Cloud Storage", "name": "patient-records", "is_public": False,
        "labels": {"data-classification": "confidential"}}),
 ("IAM", "1090000000000001", "runner-sa@sahaba-demo.iam.gserviceaccount.com", {"type": "IAM", "subtype": "service_account",
        "name": "runner-sa@sahaba-demo.iam.gserviceaccount.com"}),
 ("IAM", "projects/sahaba-demo", "sahaba-demo", {"type": "IAM", "subtype": "project_iam_policy", "bindings": [
        {"role": "roles/storage.objectViewer", "members": ["serviceAccount:runner-sa@sahaba-demo.iam.gserviceaccount.com"]}]}),
]
gcp_findings = [("4410000000001", "GCP-FW-001", "HIGH", "Firewall rule allows SSH from the internet."),
                ("7781234500001", "GCP-VM-003", "HIGH", "Instance has an external IP.")]

def build(rows, findings):
    res = [{"id": f"res-{i}", "provider_resource_id": rid, "resource_type": t, "name": n, "region": "us-east-1",
            "configuration": c} for i, (t, rid, n, c) in enumerate(rows, 1)]
    cid = {r["provider_resource_id"]: r["id"] for r in res}
    fnd = [{"resource_id": cid[r], "rule_id": rule, "status": "FAIL",
            "details": {"reason": d, "severity": s, "recommendation": "-"}} for r, rule, s, d in findings]
    return {"resources": res, "findings": fnd}

json.dump(build(aws, aws_findings), open("samples/scan_aws_demo.json", "w"), indent=1)
json.dump(build(gcp, gcp_findings), open("samples/scan_gcp_demo.json", "w"), indent=1)
print("ok")
