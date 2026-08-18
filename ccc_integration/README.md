# CCC-2:2024 starter kit for your cloud scanner

Two data files, meant to be loaded by your app as a versioned "ruleset" — not hardcoded into scan logic, since NCA revises CCC periodically (this is already CCC-2, replacing CCC-1:2020).

## Files

**`ccc_controls.json`** — the full CCC-2:2024 control taxonomy: 4 domains → 24 subdomains → 55 top-level controls (37 CSP + 18 CST) → 120 subcontrols (94 CSP + 26 CST). Each control has:
- `applies_to`: `"CSP"` or `"CST"`
- `ecc_reference`: the Essential Cybersecurity Controls (ECC-1:2018) control/subdomain it extends, where the document cites one
- `level_mandatory`: whether the control is mandatory at each of the 4 data-classification levels (1=Top Secret … 4=Public), per Annex A
- `level_exceptions`: free-text notes where a *specific subcontrol* (not the whole control) is optional/N-A at some level — see caveat below
- `subcontrols[]`: the granular clauses, each with its own `id` and `text`

**`finding_to_ccc_mapping.json`** — 25 common CSPM-style finding types (open SSH, public buckets, missing MFA, unencrypted storage, etc.), each pre-tagged with the CCC control IDs it maps to, separately for CSP-side and CST-side scans, plus a suggested default severity.

## ⚠️ One caveat before you rely on this for formal compliance reporting

Annex A's level-applicability tables (Tables 2 & 3) mark most controls as mandatory across all 4 levels, but a handful carry a footnote saying one specific *subcontrol* is optional or not-applicable at one specific level (e.g. "subcontrols 2-2-P-1-9 and 2-2-P-1-10 are optional"). The footnote text is accurate (pulled verbatim from the PDF), but which exact level column each footnote binds to was ambiguous in the source table's layout — I've flagged these in `level_exceptions` rather than guessing. Before you use a control to hard-fail a report, cross-check `level_exceptions != null` entries against the original PDF (Annex A) or NCA's official CCC-2:2024 Assessment and Compliance Tool.

## Suggested integration

```python
import json

controls = json.load(open("ccc_controls.json"))
mapping = json.load(open("finding_to_ccc_mapping.json"))

# flat lookup: control_id -> control object (with subdomain/domain context)
control_by_id = {}
for domain in controls["domains"]:
    for sub in domain["subdomains"]:
        for ctrl in sub["controls"]:
            control_by_id[ctrl["id"]] = {**ctrl, "domain": domain["name"], "subdomain": sub["name"]}

finding_rules = {f["finding_type"]: f for f in mapping["findings"]}

def tag_finding(finding_type: str, target_type: str, customer_level: int):
    """target_type: 'CSP' or 'CST'. customer_level: 1-4 from Annex A."""
    rule = finding_rules[finding_type]
    ids = rule["ccc_controls_csp"] if target_type == "CSP" else rule["ccc_controls_cst"]
    tagged = []
    for cid in ids:
        ctrl = control_by_id[cid]
        mandatory = ctrl["level_mandatory"][f"level_{customer_level}"]
        tagged.append({
            "control_id": cid,
            "domain": ctrl["domain"],
            "subdomain": ctrl["subdomain"],
            "mandatory_at_customer_level": mandatory,
        })
    return tagged
```

## Suggested next steps in your app

1. Add a `ccc_applicability` (CSP/CST) and `data_classification_level` (1–4) field to each customer/tenant record — this drives whether a finding is a hard fail or just a recommendation.
2. Extend your scanner's existing finding schema with a `finding_type` slug that matches the keys in `finding_to_ccc_mapping.json` (or keep your own taxonomy and add a translation table).
3. At report time, roll findings up by `domain` → `subdomain` → `control_id` to get a per-subdomain compliance percentage, mirroring the CCC's own structure so it reads naturally against NCA's tables.
4. Treat this JSON as a ruleset you version and diff over time — when NCA ships CCC-3, you update these files rather than hunting through code for hardcoded control text.
