# About Sahaba (سحابة)

**Sahaba** is a modern, modular Cloud Security Posture Management (CSPM) and risk analysis platform. It is designed to automatically discover cloud resources, evaluate them against critical security rules, and provide actionable findings to help engineering and security teams secure their infrastructure.

## ⚠️ The Problem

As organizations adopt multi-cloud environments (AWS, GCP, OCI), tracking the security posture of thousands of resources becomes virtually impossible to do manually. 

Security teams constantly struggle with:
1. **Misconfigurations**: S3 buckets left public, databases exposed to the internet, and overly permissive IAM roles.
2. **Lack of Visibility**: It is difficult to get a unified view of security risks across different cloud providers in a single dashboard.
3. **Delayed Detection**: Manual audits are slow. A misconfigured security group can be exploited in minutes, long before a manual audit detects it.
4. **Tool Fragmentation**: Teams often have to piece together disparate scripts and vendor-locked tools to get a complete picture of their security posture.

## 💡 The Solution

**Sahaba** acts as a unified, automated shield for your cloud infrastructure. By seamlessly connecting to your cloud accounts, Sahaba performs headless, non-intrusive scans to collect resource configurations. 

It runs these configurations through a robust rule engine to instantly detect vulnerabilities, outputting a clear, prioritized list of findings on a beautiful, responsive dashboard.

## ✨ Key Features

- **Multi-Cloud Support**: Architected from the ground up to be provider-agnostic. Sahaba currently supports Amazon Web Services (AWS), Google Cloud Platform (GCP), and Oracle Cloud Infrastructure (OCI).
- **Headless Scanner Workers**: Scanning operations are decoupled from the Web API. Sahaba uses Python daemon workers connected to a Redis message queue, ensuring that heavy cloud API scraping never slows down the frontend experience.
- **Dynamic Rule Engine**: Easily extensible security rules (e.g., checking for open SSH ports, public storage buckets) that map directly to industry standards.
- **Secure Architecture**: Cloud credentials are encrypted before hitting the PostgreSQL database. The Internal Backend and Scanner Workers live in an isolated private Docker network, shielded from the public internet.
- **Modern User Experience**: A premium, responsive React dashboard built with Vite and Radix UI Themes, ensuring that security analysts have a fluid, fast, and intuitive interface.

## 🚀 The Benefits

- **Reduced Cloud Risk**: Instantly identify and remediate critical vulnerabilities like public databases and open ports before they can be exploited.
- **Unified Visibility**: See all of your AWS, GCP, and OCI security risks in one centralized, easy-to-read dashboard.
- **Zero-Friction Audits**: No need to run complex CLI commands locally. Simply connect your cloud account in the web app, click "Start Scan," and let Sahaba do the heavy lifting in the background.
- **Scalable by Design**: Because the scanning engine uses Redis queues and Docker, you can easily spin up hundreds of scanner workers to audit massive cloud environments in parallel.
