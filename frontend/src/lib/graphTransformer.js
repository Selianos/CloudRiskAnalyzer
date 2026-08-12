/**
 * graphTransformer.js
 *
 * Transforms the flat findings[] array from the backend (each finding has
 * `.resources` and `.rules` included via Prisma) into ReactFlow nodes + edges.
 *
 * Backend shape per finding:
 * {
 *   id, scan_job_id, resource_id, rule_id, status, details, created_at,
 *   resources: { id, resource_type, provider_resource_id, name, region, configuration },
 *   rules:     { id, provider, name, severity, description, recommendation }
 * }
 */

// ── Resource-type → icon URL map ─────────────────────────────────────────────
const ICON_MAP = {
  // AWS
  'aws_ec2_instance':        '/assets/aws/ec2.png',
  'aws_s3_bucket':           '/assets/aws/s3.png',
  'aws_iam_user':            '/assets/aws/iam.png',
  'aws_iam_role':            '/assets/aws/iam.png',
  'aws_rds_instance':        '/assets/aws/rds.png',
  'aws_elb':                 '/assets/aws/elb.png',
  'aws_waf':                 '/assets/aws/waf.png',
  // OCI
  'oci_compute_instance':    '/assets/oci/compute.png',
  'oci_vcn':                 '/assets/oci/vcn.png',
  'oci_security_list':       '/assets/oci/security-list.png',
  'oci_object_storage':      '/assets/oci/storage.png',
  'oci_iam_user':            '/assets/oci/iam.png',
  'oci_autonomous_db':       '/assets/oci/adw.png',
  // GCP
  'gcp_compute_instance':    '/assets/gcp/compute.png',
  'gcp_storage_bucket':      '/assets/gcp/storage.png',
  'gcp_iam_binding':         '/assets/gcp/iam.png',
  'gcp_firewall_rule':       '/assets/gcp/firewall.png',
  'gcp_sql_instance':        '/assets/gcp/sql.png',
};

const FALLBACK_ICON = 'https://api.dicebear.com/9.x/icons/svg?icon=server&seed=resource';
const INTERNET_ICON = 'https://api.dicebear.com/9.x/icons/svg?icon=globe&seed=net';

const SEVERITY_RISK_LABEL = {
  CRITICAL: 'Critical',
  HIGH:     'High',
  MEDIUM:   'Medium',
  LOW:      'Low',
  INFO:     'Info',
};

const SEVERITY_COLOR = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#10b981',
  INFO:     '#6b7280',
};

/**
 * Returns the worst severity from a list of findings for a resource.
 */
function worstSeverity(findingsList) {
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  for (const sev of order) {
    if (findingsList.some(f => f.rules?.severity === sev)) return sev;
  }
  return 'INFO';
}

/**
 * Auto-layout: arrange nodes in a grid, 4 per row.
 */
function gridLayout(items, startX = 100, startY = 100, colW = 220, rowH = 220) {
  const COLS = 4;
  return items.map((item, i) => ({
    ...item,
    position: {
      x: startX + (i % COLS) * colW,
      y: startY + Math.floor(i / COLS) * rowH,
    },
  }));
}

/**
 * Main transformer: findings[] → { nodes, edges }
 */
export function transformFindingsToGraph(findings) {
  if (!findings || findings.length === 0) {
    return { nodes: [], edges: [] };
  }

  // ── 1. Deduplicate resources ──────────────────────────────────────────────
  const resourceMap = new Map(); // resource_id → { resource, findings[] }
  for (const finding of findings) {
    const res = finding.resources;
    if (!res) continue;
    if (!resourceMap.has(res.id)) {
      resourceMap.set(res.id, { resource: res, findings: [] });
    }
    resourceMap.get(res.id).findings.push(finding);
  }

  // ── 2. Build Internet anchor node ─────────────────────────────────────────
  const internetNode = {
    id: 'internet',
    type: 'cloudNode',
    position: { x: 500, y: -120 },
    data: {
      label: 'Public Internet',
      logoUrl: INTERNET_ICON,
      details: { ip: '0.0.0.0/0', status: 'External', risk: 'Info' },
    },
  };

  // ── 3. Build resource nodes ───────────────────────────────────────────────
  const rawNodes = [];
  const edges = [];

  for (const [resourceId, { resource, findings: rFindings }] of resourceMap) {
    const failFindings = rFindings.filter(f => f.status === 'FAIL');
    const hasFail = failFindings.length > 0;
    const passFindings = rFindings.filter(f => f.status === 'PASS');

    const severity = hasFail ? worstSeverity(failFindings) : 'LOW';
    const riskLabel = SEVERITY_RISK_LABEL[severity] || 'Low';
    const iconUrl = ICON_MAP[resource.resource_type] || FALLBACK_ICON;

    // Build a details description from the worst failing rule
    const worstFinding = failFindings.find(f => f.rules?.severity === severity) || failFindings[0];
    const description = hasFail
      ? `${worstFinding?.rules?.name || 'Issue'}: ${worstFinding?.rules?.description || ''}`
      : passFindings[0]?.rules?.recommendation || 'No issues detected.';

    // Configuration fields for details panel
    const cfg = resource.configuration || {};

    rawNodes.push({
      id: resourceId,
      type: 'cloudNode',
      data: {
        label: resource.name || resource.provider_resource_id,
        logoUrl: iconUrl,
        isFailed: hasFail,
        isSafe: !hasFail,
        resourceType: resource.resource_type,
        region: resource.region,
        providerResourceId: resource.provider_resource_id,
        // Full findings for detail panel
        findings: rFindings,
        details: {
          ip: cfg.public_ip || cfg.endpoint || cfg.private_ip || resource.provider_resource_id,
          status: hasFail ? `${failFindings.length} issue(s) found` : 'Compliant',
          risk: riskLabel,
          description: hasFail ? description : null,
        },
      },
    });

    // Draw an edge from internet → this node if it has public exposure findings
    const publicExposure = rFindings.some(f =>
      f.rules?.name?.toLowerCase().includes('public') ||
      f.rules?.name?.toLowerCase().includes('open') ||
      f.rules?.name?.toLowerCase().includes('exposed') ||
      cfg.public_access === true ||
      cfg.publicly_accessible === true
    );
    if (publicExposure && hasFail) {
      edges.push({
        id: `e-inet-${resourceId}`,
        source: 'internet',
        target: resourceId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: SEVERITY_COLOR[severity] || '#ef4444', strokeWidth: 2 },
      });
    }
  }

  // ── 4. Layout nodes in a grid ─────────────────────────────────────────────
  const layoutedNodes = gridLayout(rawNodes);

  return {
    nodes: [internetNode, ...layoutedNodes],
    edges,
  };
}

/**
 * Summarize scan results for header stats.
 * Returns { total, critical, high, medium, low, pass }
 */
export function summarizeFindings(findings) {
  if (!findings || findings.length === 0) {
    return { total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 };
  }

  const fails = findings.filter(f => f.status === 'FAIL');
  return {
    total:    findings.length,
    critical: fails.filter(f => f.rules?.severity === 'CRITICAL').length,
    high:     fails.filter(f => f.rules?.severity === 'HIGH').length,
    medium:   fails.filter(f => f.rules?.severity === 'MEDIUM').length,
    low:      fails.filter(f => f.rules?.severity === 'LOW').length,
    pass:     findings.filter(f => f.status === 'PASS').length,
  };
}
