# Threat Detection & Security Rules Catalog

This document is the authoritative reference for the **55 security rules** implemented in the Sahaba scanning engine and the **25 standardized finding categories** used for risk classification and NCA CCC-2:2024 compliance mapping.

---

## 1. High-Level Platform Statistics

| Dimension | Measured Value | Technical & Operational Significance |
| :--- | :---: | :--- |
| **Microservice Architecture** | **5** Decoupled Layers | Scalable, resilient execution via Redis task queues and isolated internal networks. |
| **Supported Cloud Providers** | **3** Cloud Providers | Provider-agnostic security visibility across AWS, GCP, and OCI in a unified pane of glass. |
| **Supported Cloud Services** | **14** Distinct Services | Comprehensive coverage across Compute, Storage, IAM, and Networking APIs. |
| **Scannable Resource Types** | **16** Distinct Types | Asset discovery across virtual machines, object storage buckets, firewall rules, and IAM policies. |
| **Security Rules Evaluated** | **55** Active Rules | Live rule evaluation engine across AWS (32), GCP (14), and OCI (9). |
| **Canonical Finding Types** | **25** Standard Categories | Normalized taxonomy linking vendor-specific rules to regulatory compliance frameworks. |
| **NCA CCC Standard Scope** | **175** Total Controls | Mapped against the official Saudi National Cybersecurity Authority framework (55 Top + 120 Sub). |
| **Supported Classification Levels** | **4** Sensitivity Levels | Annex A audit granularity (Level 1: Top Secret, Level 2: Secret, Level 3: Confidential, Level 4: Public). |

---

## 2. Engine Capabilities & Severity Distribution

```
Total Active Rules: 55 Rules
  ├── Amazon Web Services (AWS) : 32 Rules
  ├── Google Cloud Platform (GCP): 14 Rules
  └── Oracle Cloud Infrastructure:  9 Rules

Canonical Finding Types: 25 Standardized Categories
Severity Breakdown:
  • CRITICAL : 17 Rules (Direct perimeter exposure, root compromise, public wildcards)
  • HIGH     : 14 Rules (Missing MFA on console users, sensitive ports, public buckets)
  • WARNING  :  6 Rules (Key/password rotation, permissive egress)
  • MEDIUM   : 11 Rules (Unencrypted storage, shielded VM integrity, primitive roles)
  • INFO     :  7 Rules (Informational checks, unattached security groups, public HTTP)
```

---

## 3. Standardized Finding Types (25 Canonical Slugs)

Each technical rule maps to one of 25 vendor-neutral `finding_type` slugs. These slugs form the bridge between cloud-specific configurations and NCA CCC-2:2024 controls:

| Category | `finding_type` Slug | Description |
| :--- | :--- | :--- |
| **Network** | `ssh_open_to_internet` | Management port 22 (SSH) open to `0.0.0.0/0` or `::/0`. |
| **Network** | `rdp_open_to_internet` | Remote Desktop port 3389 open to `0.0.0.0/0` or `::/0`. |
| **Network** | `security_group_allow_all_inbound` | Security group or firewall rule allows unrestricted traffic or open database ports. |
| **IAM** | `root_account_used_directly` | Active access keys on the root/administrative account. |
| **IAM** | `no_mfa_privileged_account` | Multi-Factor Authentication (MFA) disabled on root or console user accounts. |
| **IAM** | `overly_permissive_iam_policy` | IAM policy grants administrator wildcards (`*`), privilege escalation, or primitive roles. |
| **IAM** | `weak_password_policy` | Passwords or access keys older than 90 days, or inactive accounts without credential rotation. |
| **Storage** | `storage_bucket_public_read` | Object storage bucket permits anonymous or public read/list access. |
| **Storage** | `storage_unencrypted_at_rest` | Storage resource lacks server-side or customer-managed KMS encryption. |
| **Storage** | `backup_not_configured` | Object versioning or automated backups disabled on storage buckets. |
| **Logging** | `no_logging_enabled` | Access logging or audit trail logging disabled on storage resources. |
| **Compute** | `unpatched_vulnerability` | Shielded VM Secure Boot or integrity monitoring disabled. |
| **Compute** | `remote_access_not_terminable` | Interactive serial port console access enabled on virtual machines. |

---

## 4. Comprehensive 55-Rule Inventory

### 3.1 Amazon Web Services (AWS) — 32 Rules

| Rule ID | Database ID | Rule Name | Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `SEC-001` | `AWS-EC2-001` | Public SSH (IPv4) Access | Network | CRITICAL | `ssh_open_to_internet` | Security Group allows port 22 inbound from `0.0.0.0/0` |
| `SEC-002` | `AWS-EC2-002` | Public SSH (IPv6) Access | Network | CRITICAL | `ssh_open_to_internet` | Security Group allows port 22 inbound from `::/0` |
| `SEC-003` | `AWS-EC2-003` | Public RDP (IPv4) Access | Network | CRITICAL | `rdp_open_to_internet` | Security Group allows port 3389 inbound from `0.0.0.0/0` |
| `SEC-004` | `AWS-EC2-004` | Public RDP (IPv6) Access | Network | CRITICAL | `rdp_open_to_internet` | Security Group allows port 3389 inbound from `::/0` |
| `SEC-005` | `SEC-005` | Public Database Access | Network | CRITICAL | `security_group_allow_all_inbound` | Database ports (3306, 5432, 1433, 27017, 6379, 9200) open to internet |
| `SEC-006` | `SEC-006` | All TCP Ports Open to Internet | Network | CRITICAL | `security_group_allow_all_inbound` | Unrestricted TCP range (0–65535 or wildcard) open to `0.0.0.0/0` |
| `SEC-007` | `SEC-007` | All Protocols Open to Internet | Network | CRITICAL | `security_group_allow_all_inbound` | Protocol `-1` (all traffic) allowed from `0.0.0.0/0` or `::/0` |
| `SEC-008` | `SEC-008` | Public HTTP Access | Network | INFO | `security_group_allow_all_inbound` | Inbound HTTP (port 80) open to internet (informational check) |
| `SEC-009` | `SEC-009` | Public HTTPS Access | Network | INFO | `security_group_allow_all_inbound` | Inbound HTTPS (port 443) open to internet (informational check) |
| `SEC-010` | `SEC-010` | Public Sensitive Ports Access | Network | HIGH | `security_group_allow_all_inbound` | Management ports (FTP, Telnet, SMTP, DNS, TFTP, LDAP, SMB) open |
| `SEC-011` | `SEC-011` | Too Many Inbound Rules | Network | MEDIUM | `security_group_allow_all_inbound` | Security Group contains >20 inbound rule definitions |
| `SEC-012` | `SEC-012` | All Outbound Traffic Allowed | Network | WARNING | `security_group_allow_all_inbound` | Egress rule allows protocol `-1` to `0.0.0.0/0` or `::/0` |
| `SEC-013` | `SEC-013` | Unattached Security Group | Network | INFO | `security_group_allow_all_inbound` | Security Group is not attached to any active network interface |
| `IAM-001` | `AWS-IAM-002` | Root Account Access Keys Active | IAM | CRITICAL | `root_account_used_directly` | Root account has active API access keys |
| `IAM-002` | `AWS-IAM-001` | Root Account MFA Disabled | IAM | CRITICAL | `no_mfa_privileged_account` | Root account Multi-Factor Authentication is inactive |
| `IAM-003` | `AWS-IAM-003` | User Direct Administrator Access | IAM | CRITICAL | `overly_permissive_iam_policy` | Non-root IAM user has `AdministratorAccess` policy attached |
| `IAM-004` | `IAM-004` | Role has AdministratorAccess | IAM | CRITICAL | `overly_permissive_iam_policy` | IAM Role has `AdministratorAccess` policy attached |
| `IAM-005` | `IAM-005` | Full Admin Wildcards Policy | IAM | CRITICAL | `overly_permissive_iam_policy` | IAM Policy grants `Action: "*"` and `Resource: "*"` |
| `IAM-006` | `IAM-006` | Policy Allows Privilege Escalation | IAM | CRITICAL | `overly_permissive_iam_policy` | Policy contains escalation actions (`iam:PassRole`, `iam:CreatePolicyVersion`) |
| `IAM-007` | `IAM-007` | User Console Login without MFA | IAM | HIGH | `no_mfa_privileged_account` | IAM User has console password active without MFA enabled |
| `IAM-008` | `IAM-008` | Access Key Older than 90 Days | IAM | WARNING | `weak_password_policy` | Access key last rotated >90 days ago |
| `IAM-009` | `IAM-009` | Unused Access Key (>90 Days) | IAM | WARNING | `weak_password_policy` | Active access key has not been used in >90 days |
| `IAM-010` | `IAM-010` | Inactive User (>90 Days) | IAM | WARNING | `weak_password_policy` | User password and access keys inactive for >90 days |
| `IAM-011` | `IAM-011` | Password Never Rotated | IAM | WARNING | `weak_password_policy` | Active password with no recorded password rotation timestamp |
| `IAM-012` | `IAM-012` | Programmatic User Has Console Login | IAM | HIGH | `weak_password_policy` | User possesses both active API access keys and console password |
| `IAM-013` | `IAM-013` | Service Wildcard Permissions | IAM | HIGH | `overly_permissive_iam_policy` | Policy allows service-level wildcards (e.g. `ec2:*`, `s3:*`) |
| `IAM-014` | `IAM-014` | Wildcard Principal in Role Trust | IAM | CRITICAL | `overly_permissive_iam_policy` | AssumeRole trust policy specifies Principal `*` |
| `IAM-015` | `IAM-015` | Role Trusts External AWS Account | IAM | HIGH | `overly_permissive_iam_policy` | Role trust policy delegates access to an external AWS account ID |
| `IAM-016` | `IAM-016` | User Inline Policy Attached | IAM | MEDIUM | `overly_permissive_iam_policy` | Inline policy attached directly to user instead of managed group |
| `IAM-017` | `IAM-017` | Multiple Active Access Keys | IAM | WARNING | `weak_password_policy` | User has 2 active access keys simultaneously |
| `S3-001` | `AWS-S3-001` | Public S3 Bucket | Storage | HIGH | `storage_bucket_public_read` | S3 bucket configuration permits public access |
| `S3-002` | `AWS-S3-002` | S3 Encryption Disabled | Storage | MEDIUM | `storage_unencrypted_at_rest` | S3 server-side encryption at rest is disabled |

---

### 3.2 Google Cloud Platform (GCP) — 14 Rules

| Rule ID | Rule Name | Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GCP-VM-001` | External IP Assigned | Compute | MEDIUM | `security_group_allow_all_inbound` | Compute Engine instance has public IP interface attached |
| `GCP-VM-002` | Shielded VM Secure Boot Disabled | Compute | MEDIUM | `unpatched_vulnerability` | Compute Engine instance has Secure Boot disabled |
| `GCP-VM-003` | Serial Port Enabled | Compute | HIGH | `remote_access_not_terminable` | Instance metadata enables interactive serial port access |
| `GCP-VM-004` | IP Forwarding Enabled | Compute | MEDIUM | `security_group_allow_all_inbound` | Instance configuration permits IP forwarding |
| `GCP-FW-001` | Sensitive Ports Open to Internet | Network | HIGH | `ssh_open_to_internet` | Firewall allows ingress to ports 22, 3389, or DB ports from `0.0.0.0/0` |
| `GCP-FW-002` | Allow-All Firewall Rule | Network | CRITICAL | `security_group_allow_all_inbound` | Firewall rule allows all protocols and ports from `0.0.0.0/0` |
| `GCP-IAM-001` | Primitive IAM Roles Assigned | IAM | MEDIUM | `overly_permissive_iam_policy` | Project IAM policy assigns `roles/owner`, `roles/editor`, `roles/viewer` |
| `GCP-IAM-002` | Public IAM Bindings | IAM | CRITICAL | `overly_permissive_iam_policy` | Project policy grants roles to `allUsers` or `allAuthenticatedUsers` |
| `GCP-IAM-003` | User-Managed SA Keys Exist | IAM | MEDIUM | `weak_password_policy` | Service account has user-managed credential keys active |
| `GCP-STORAGE-001` | Public Cloud Storage Bucket | Storage | CRITICAL | `storage_bucket_public_read` | Bucket grants permissions to `allUsers` or `allAuthenticatedUsers` |
| `GCP-STORAGE-002` | Public Access Prevention Disabled | Storage | HIGH | `storage_bucket_public_read` | Bucket Public Access Prevention (PAP) is not enforced |
| `GCP-STORAGE-003` | Uniform Bucket-Level Access Disabled | Storage | MEDIUM | `overly_permissive_iam_policy` | Uniform Bucket-Level Access (UBLA) is disabled |
| `GCP-STORAGE-004` | Bucket Versioning Disabled | Storage | INFO | `backup_not_configured` | Object versioning is disabled on the bucket |
| `GCP-STORAGE-005` | Bucket Logging Disabled | Storage | INFO | `no_logging_enabled` | Usage and audit logging disabled on the bucket |

---

### 3.3 Oracle Cloud Infrastructure (OCI) — 9 Rules

| Rule ID | Rule Name | Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `OCI-COMPUTE-001` | Instance with Public IP | Compute | MEDIUM | `security_group_allow_all_inbound` | Compute instance VNIC possesses a public IP address |
| `OCI-NET-001` | Public Subnet Enabled | Network | INFO | `security_group_allow_all_inbound` | VCN Subnet is configured with `prohibit_public_ip_on_vnic=False` |
| `OCI-NET-002` | Public SSH Access Allowed | Network | HIGH | `ssh_open_to_internet` | Security List ingress rule permits port 22 from `0.0.0.0/0` |
| `OCI-NET-003` | Public RDP Access Allowed | Network | HIGH | `rdp_open_to_internet` | Security List ingress rule permits port 3389 from `0.0.0.0/0` |
| `OCI-STORAGE-001` | Public Object Storage Bucket | Storage | HIGH | `storage_bucket_public_read` | Object Storage bucket public access type is not `NoPublicAccess` |
| `OCI-STORAGE-002` | Bucket CMEK Encryption Disabled | Storage | MEDIUM | `storage_unencrypted_at_rest` | Object Storage bucket uses Oracle-managed keys instead of KMS CMEK |
| `OCI-IAM-001` | MFA Not Enabled for User | IAM | HIGH | `no_mfa_privileged_account` | IAM User does not have Multi-Factor Authentication enabled |
| `OCI-IAM-002` | Multiple Active API Keys | IAM | INFO | `weak_password_policy` | IAM User possesses more than 1 active API key |
| `OCI-IAM-003` | Overly Permissive Policy | IAM | HIGH | `overly_permissive_iam_policy` | Policy statement grants `manage all-resources in tenancy` |
