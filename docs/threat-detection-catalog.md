# Platform Metrics & Threat Detection Catalog

## 1. High-Level Platform Statistics

| Dimension | Measured Value | Business Significance |
|---|:---:|---|
| **Microservice Architecture** | **5** Decoupled Layers | Scalable, resilient execution via Redis workers and private internal networks |
| **Supported Cloud Providers** | **3** Cloud Providers | Provider-agnostic unified security visibility (AWS, GCP, OCI) in a single pane of glass |
| **Supported Cloud Services** | **14** Distinct Services | Comprehensive coverage across Compute, Storage, IAM, and Networking |
| **Scannable Cloud Resource Types** | **16** Distinct Types | Deep asset discovery across virtual machines, object buckets, and access policies |
| **Resources Discovered** | **50+** Cloud Resources | Actively discovered across documented historical scans |
| **Unique Configurations Flagged** | **60+** Unique Configurations Flagged | Inspects hundreds of JSON configuration keys across 16 resource types |
| **Security Rules Evaluated** | **25+** Rules Evaluated | The engine actively implements and evaluates 55 distinct security rules |
| **NCA CCC Baseline Standard Scope** | **175** Total Controls (55 Top + 120 Sub) | Grounded in the official Saudi National Cybersecurity Authority framework |
| **Active NCA CCC Subcontrols Covered** | **23** (17 CSP, 6 CST) | Automated compliance evidence for core cloud defense controls |
| **Supported Classification Levels** | **4** (Top Secret, Secret, Confidential, Public) | Tailored audit granularity matching organizational sensitivity tiers |

---

## 2. Cloud Coverage & Discovery Scope

Sahaba interfaces directly with native cloud APIs to discover, extract, and normalize infrastructure configurations into a unified schema for risk analysis.

### Provider & Service Matrix

| Cloud Provider | Cloud Services Covered | Discovered Resource Types | Extracted Security Properties |
|---|---|---|---|
| **Amazon Web Services (AWS)** | • Amazon EC2<br>• Amazon VPC<br>• Amazon S3<br>• AWS IAM<br>• AWS STS | `EC2`<br>`Security Groups`<br>`S3`<br>`IAM` (Users + Root)<br>`IAM Role` | Ingress/egress CIDRs, open management ports (22, 3389, DBs), S3 public access blocks, bucket policies, KMS encryption at rest, root MFA status, credential rotation age, IAM trust policies, inline vs managed policies, administrator privilege wildcards. |
| **Google Cloud Platform (GCP)** | • Google Compute Engine<br>• Google Cloud Storage<br>• Google Cloud IAM<br>• VPC Networks & Firewalls<br>• Cloud Resource Manager | `Compute Engine`<br>`Cloud Storage`<br>`IAM` (Service Accounts)<br>`IAM` (Project IAM Policy)<br>`Firewall Rules` | External IP assignment, Shielded VM Secure Boot integrity, serial port interactive access, IP forwarding, bucket public IAM bindings (`allUsers`), Public Access Prevention (PAP), Uniform Bucket-Level Access (UBLA), bucket logging & versioning, primitive roles (`roles/owner`), user-managed service account key lifecycles. |
| **Oracle Cloud Infrastructure (OCI)** | • OCI Compute<br>• OCI Core Networking<br>• OCI Object Storage<br>• OCI Identity & Access Management (IAM) | `Compute`<br>`VCN`<br>`Subnet`<br>`SecurityList`<br>`ObjectStorage`<br>`IAM_Users`<br>`IAM_Policies` | VNIC public IP assignment, subnet public IP routing rules, Security List ingress rules for ports 22 and 3389, Object Storage public read access type, Customer-Managed KMS Key (CMEK) encryption, user MFA enrollment, API key inventory, IAM policy statements (`manage all-resources`). |

$$\mathbf{3\text{ Cloud Providers}} \times \mathbf{14\text{ Cloud Services}} \times \mathbf{16\text{ Resource Types}} = \text{Comprehensive Multi-Cloud Surface}$$

---

## 3. Threat Detection Catalog & Rule Engine (55 Rules)

The detection engine evaluates normalized infrastructure configurations against a 55-rule catalog.

### Severity & Domain Distribution

```
Rule Severity Breakdown:
  • CRITICAL : 17 rules  (30.9%)  — Direct perimeter exposure & root privilege compromise
  • HIGH     : 14 rules  (25.5%)  — Overly permissive IAM, missing MFA, sensitive port exposure
  • MEDIUM   : 17 rules  (30.9%)  — Weak credential lifecycle, unencrypted storage, missing baseline flags
  • LOW/INFO :  7 rules  (12.7%)  — Architectural hygiene, unattached security groups, public HTTP/S info
  Total      : 55 rules (100.0%)

Risk Domain Categorization:
  • Identity & Access Management (IAM): 23 rules (41.8%)
  • Network & Perimeter Security      : 21 rules (38.2%)
  • Storage Security & Data Protection :  9 rules (16.4%)
  • Compute & Workload Integrity      :  2 rules  (3.6%)
```

---

### Comprehensive 55-Rule Inventory

#### AWS Security Rules (32 Rules)

| Rule ID | Rule Name | Risk Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
|---|---|---|:---:|---|---|
| `SEC-001` | Public SSH (IPv4) Access | Network | Critical | `ssh_open_to_internet` | Security Group allows port 22 inbound from `0.0.0.0/0` |
| `SEC-002` | Public SSH (IPv6) Access | Network | Critical | `ssh_open_to_internet` | Security Group allows port 22 inbound from `::/0` |
| `SEC-003` | Public RDP (IPv4) Access | Network | Critical | `rdp_open_to_internet` | Security Group allows port 3389 inbound from `0.0.0.0/0` |
| `SEC-004` | Public RDP (IPv6) Access | Network | Critical | `rdp_open_to_internet` | Security Group allows port 3389 inbound from `::/0` |
| `SEC-005` | Public Database Access | Network | Critical | `security_group_allow_all_inbound` | Database ports (3306, 5432, 1433, 27017, 6379, 9200) open to internet |
| `SEC-006` | All TCP Ports Open to Internet | Network | Critical | `security_group_allow_all_inbound` | Unrestricted TCP range (0–65535 or wildcard) open to `0.0.0.0/0` |
| `SEC-007` | All Protocols Open to Internet | Network | Critical | `security_group_allow_all_inbound` | Protocol `-1` (all traffic) allowed from `0.0.0.0/0` or `::/0` |
| `SEC-008` | Public HTTP Access | Network | Info | `security_group_allow_all_inbound` | Inbound HTTP (port 80) open to internet (informational check) |
| `SEC-009` | Public HTTPS Access | Network | Info | `security_group_allow_all_inbound` | Inbound HTTPS (port 443) open to internet (informational check) |
| `SEC-010` | Public Sensitive Ports Access | Network | High | `security_group_allow_all_inbound` | Management ports (FTP, Telnet, SMTP, DNS, TFTP, LDAP, SMB) open |
| `SEC-011` | Too Many Inbound Rules | Network | Medium | `security_group_allow_all_inbound` | Security Group contains >20 inbound rule definitions |
| `SEC-012` | All Outbound Traffic Allowed | Network | Warning | `security_group_allow_all_inbound` | Egress rule allows protocol `-1` to `0.0.0.0/0` or `::/0` |
| `SEC-013` | Unattached Security Group | Network | Info | `security_group_allow_all_inbound` | Security Group is not attached to any active network interface |
| `IAM-001` | Root Account Access Keys Active | IAM | Critical | `root_account_used_directly` | Root account has active access key 1 or 2 |
| `IAM-002` | Root Account MFA Disabled | IAM | Critical | `no_mfa_privileged_account` | Root account Multi-Factor Authentication is inactive |
| `IAM-003` | User Direct Administrator Access | IAM | Critical | `overly_permissive_iam_policy` | Non-root IAM user has `AdministratorAccess` policy attached |
| `IAM-004` | Role has AdministratorAccess | IAM | Critical | `overly_permissive_iam_policy` | IAM Role has `AdministratorAccess` policy attached |
| `IAM-005` | IAM Policy Allows Full Admin Wildcards | IAM | Critical | `overly_permissive_iam_policy` | IAM Policy grants `Action: "*"` and `Resource: "*"` |
| `IAM-006` | IAM Policy Allows Privilege Escalation | IAM | Critical | `overly_permissive_iam_policy` | Policy contains escalation actions (`iam:PassRole`, `iam:CreatePolicyVersion`, etc.) |
| `IAM-007` | IAM User Console Login without MFA | IAM | High | `no_mfa_privileged_account` | IAM User has console password active without MFA enabled |
| `IAM-008` | IAM Access Key Older than 90 Days | IAM | Warning | `weak_password_policy` | Access key last rotated >90 days ago |
| `IAM-009` | Unused IAM Access Key (>90 Days) | IAM | Warning | `weak_password_policy` | Active access key has not been used in >90 days |
| `IAM-010` | Inactive IAM User (>90 Days) | IAM | Warning | `weak_password_policy` | User password and access keys inactive for >90 days |
| `IAM-011` | IAM Password Never Rotated | IAM | Warning | `weak_password_policy` | Active password with no recorded password rotation timestamp |
| `IAM-012` | Programmatic User Has Console Login | IAM | High | `weak_password_policy` | User possesses both active API access keys and console password |
| `IAM-013` | IAM Policy Wildcard Service Permissions | IAM | High | `overly_permissive_iam_policy` | Policy allows service-level wildcards (e.g. `ec2:*`, `s3:*`) |
| `IAM-014` | Wildcard Principal in Role Trust | IAM | Critical | `overly_permissive_iam_policy` | AssumeRole trust policy specifies Principal `*` |
| `IAM-015` | IAM Role Trusts External AWS Account | IAM | High | `overly_permissive_iam_policy` | Role trust policy delegates access to an external AWS account ID |
| `IAM-016` | IAM User Inline Policy Attached | IAM | Medium | `overly_permissive_iam_policy` | Inline policy attached directly to user instead of managed group |
| `IAM-017` | Multiple Active Access Keys | IAM | Warning | `weak_password_policy` | User has 2 active access keys simultaneously |
| `S3-001` | Public Bucket | Storage | High | `storage_bucket_public_read` | S3 bucket configuration permits public access |
| `S3-002` | Encryption Disabled | Storage | Medium | `storage_unencrypted_at_rest` | S3 server-side encryption at rest is disabled |

#### GCP Security Rules (14 Rules)

| Rule ID | Rule Name | Risk Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
|---|---|---|:---:|---|---|
| `GCP-VM-001` | External IP Assigned | Network | Medium | `security_group_allow_all_inbound` | Compute Engine VM has an ephemeral or static external IP |
| `GCP-VM-002` | Shielded VM Secure Boot Disabled | Compute | Medium | `unpatched_vulnerability` | VM instance has `enable_secure_boot == False` |
| `GCP-VM-003` | Serial Port Enabled | Compute | High | `remote_access_not_terminable` | VM metadata has `serial-port-enable == true` |
| `GCP-VM-004` | IP Forwarding Enabled | Network | Medium | `security_group_allow_all_inbound` | VM instance has `can_ip_forward == True` |
| `GCP-FW-001` | Sensitive Ports Exposed to Internet | Network | High | `ssh_open_to_internet` | Firewall ingress permits ports 22, 3389, or DB ports from `0.0.0.0/0` |
| `GCP-FW-002` | Allow-All Firewall Rule | Network | Critical | `security_group_allow_all_inbound` | Firewall ingress allows all protocols/ports from `0.0.0.0/0` |
| `GCP-IAM-001` | Primitive IAM Roles Assigned | IAM | Medium | `overly_permissive_iam_policy` | Project IAM policy contains Owner, Editor, or Viewer bindings |
| `GCP-IAM-002` | Public IAM Bindings | IAM | Critical | `overly_permissive_iam_policy` | Project IAM policy grants permissions to `allUsers` / `allAuthenticatedUsers` |
| `GCP-IAM-003` | User-Managed SA Keys Exist | IAM | Medium | `weak_password_policy` | Service Account has active user-managed cryptographic keys |
| `GCP-STORAGE-001` | Public Bucket | Storage | Critical | `storage_bucket_public_read` | Bucket IAM policy grants access to `allUsers` or `allAuthenticatedUsers` |
| `GCP-STORAGE-002` | Public Access Prevention Disabled | Storage | High | `storage_bucket_public_read` | Cloud Storage bucket has `public_access_prevention != "enforced"` |
| `GCP-STORAGE-003` | Uniform Bucket-Level Access Disabled | Storage | Medium | `overly_permissive_iam_policy` | Bucket does not enforce Uniform Bucket-Level Access (legacy ACLs active) |
| `GCP-STORAGE-004` | Versioning Disabled | Storage | Low | `backup_not_configured` | Object versioning is disabled on Cloud Storage bucket |
| `GCP-STORAGE-005` | Bucket Logging Disabled | Storage | Low | `no_logging_enabled` | Access/audit logging is disabled on Cloud Storage bucket |

#### OCI Security Rules (9 Rules)

| Rule ID | Rule Name | Risk Domain | Severity | Assigned `finding_type` | Detected Insecure Condition |
|---|---|---|:---:|---|---|
| `OCI-COMPUTE-001` | Instance with Public IP | Network | Medium | `security_group_allow_all_inbound` | Compute VNIC has an active public IP address |
| `OCI-NET-001` | Public Subnet Enabled | Network | Low | `security_group_allow_all_inbound` | VCN Subnet allows public IP assignment on VNICs |
| `OCI-NET-002` | Public SSH Access Allowed | Network | High | `ssh_open_to_internet` | Security List ingress rule allows port 22 from `0.0.0.0/0` |
| `OCI-NET-003` | Public RDP Access Allowed | Network | High | `rdp_open_to_internet` | Security List ingress rule allows port 3389 from `0.0.0.0/0` |
| `OCI-STORAGE-001` | Public Object Storage Bucket | Storage | High | `storage_bucket_public_read` | Bucket public access type is set to `ObjectRead` or `ObjectReadWithoutList` |
| `OCI-STORAGE-002` | Bucket CMEK Encryption Disabled | Storage | Medium | `storage_unencrypted_at_rest` | Object Storage bucket is not encrypted with a Customer-Managed Key (KMS) |
| `OCI-IAM-001` | MFA Not Enabled for User | IAM | High | `no_mfa_privileged_account` | IAM User does not have Multi-Factor Authentication enabled |
| `OCI-IAM-002` | Too Many Active API Keys | IAM | Low | `weak_password_policy` | IAM User possesses more than 1 active API signing key |
| `OCI-IAM-003` | Overly Permissive Policy | IAM | High | `overly_permissive_iam_policy` | Policy statement contains unrestricted `"manage all-resources"` grant |


