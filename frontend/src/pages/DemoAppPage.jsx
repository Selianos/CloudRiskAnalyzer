import { useState, useCallback, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { Button, Flex, Box, Text, Badge, Spinner, Callout } from '@radix-ui/themes';
import {
  ReactFlow, Background, Controls, Panel,
  applyNodeChanges, applyEdgeChanges, addEdge,
  MiniMap, useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Info, ShieldAlert, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { useDemoTip } from '../contexts/DemoTipContext';
import DemoContextBar from '../components/common/DemoContextBar';
import DemoGuide from '../components/common/DemoGuide';

import { nodeTypes } from '../components/graph/CustomNodes';
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockSummary = {
  total: 7,
  critical: 2,
  high: 2,
  medium: 2,
  low: 0,
  pass: 1
};

const mockFindings = [
  {
    id: "f1",
    status: "FAIL",
    resources: {
      id: "ec2_ssh",
      resource_type: "aws_ec2_instance",
      name: "Public-Bastion-EC2",
      provider_resource_id: "i-0abcd1234efgh5678",
      region: "us-east-1",
      configuration: { public_ip: "54.12.34.56" }
    },
    rules: {
      name: "AWS-EC2-001",
      severity: "CRITICAL",
      description: "EC2 instance has SSH port 22 open to the internet.",
      recommendation: "RISK: An EC2 instance with SSH open to the internet is highly vulnerable to brute-force attacks. Attackers can exploit this to gain unauthorized access to the server, install malware, or pivot into the internal network.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'EC2' > 'Instances'.\n2. Select the offending instance and view its Security Groups.\n3. Edit the inbound rules of the attached Security Group.\n4. Remove the rule allowing port 22 from 0.0.0.0/0.\n5. Click 'Save rules'."
    },
    ccc_metadata: [
      {id: '2-4-T-1-1', text: 'The CST shall ensure that network access controls restrict inbound/outbound traffic to only necessary ports and protocols.'},
      {id: '2-4-P-1-1', text: 'The CSP shall implement network segmentation and access controls between cloud services and external networks.'}
    ]
  },
  {
    id: "f2",
    status: "FAIL",
    resources: {
      id: "db_public",
      resource_type: "aws_rds_instance",
      name: "Customer-DB-Primary",
      provider_resource_id: "db-ABCDEF123456",
      region: "us-east-1",
      configuration: { public_access: true }
    },
    rules: {
      name: "AWS-RDS-001",
      severity: "CRITICAL",
      description: "RDS Database instance is publicly accessible to the internet.",
      recommendation: "RISK: A database with public access allows anyone on the internet to attempt to connect. Attackers can exploit this to leak sensitive data, distribute malware, or drop tables.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'RDS' > 'Databases'.\n2. Select the offending database and click 'Modify'.\n3. Under 'Connectivity', expand 'Additional configuration'.\n4. Change 'Public access' to 'Not publicly accessible'.\n5. Continue and apply the changes immediately."
    },
    ccc_metadata: [
      {id: '2-2-T-1-1', text: 'The CST shall ensure that cloud service access is restricted to authorized users and systems only.'},
      {id: '2-6-P-1-4', text: 'The CSP shall implement controls to prevent unauthorized access to customer data.'}
    ]
  },
  {
    id: "f3",
    status: "PASS",
    resources: {
      id: "web_safe",
      resource_type: "aws_ec2_instance",
      name: "Corporate-Web-Server",
      provider_resource_id: "i-0987654321fedcba",
      region: "us-east-1",
      configuration: { public_ip: "54.98.76.54" }
    },
    rules: {
      name: "AWS-EC2-002",
      severity: "INFO",
      description: "EC2 instance web server is properly configured.",
      recommendation: "No issues detected. The web server security groups only allow HTTP/HTTPS traffic."
    },
    ccc_metadata: []
  },
  {
    id: "f4",
    status: "FAIL",
    resources: {
      id: "iam_full",
      resource_type: "aws_iam_role",
      name: "Web-Server-Admin-Role",
      provider_resource_id: "role/Web-Server-Admin-Role",
      region: "global",
      configuration: {}
    },
    rules: {
      name: "AWS-IAM-001",
      severity: "HIGH",
      description: "IAM Role attached to server has full administrative privileges.",
      recommendation: "RISK: An IAM role with overly permissive policies (like AdministratorAccess) attached to an EC2 instance allows any application on that instance full control over your AWS account. If the instance is compromised, the attacker gains full account takeover capabilities.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'IAM' > 'Roles'.\n2. Select the offending role.\n3. Review attached policies and remove 'AdministratorAccess'.\n4. Create and attach a custom policy with least-privilege permissions needed for the application.\n5. Click 'Save'."
    },
    ccc_metadata: [
      {id: '2-2-T-1-1', text: 'The CST shall ensure that cloud service access is restricted to authorized users and systems only.'},
      {id: '2-2-P-1-7', text: 'The CSP shall implement role-based access control (RBAC) and enforce least-privilege principles.'}
    ]
  },
  {
    id: "f5",
    status: "FAIL",
    resources: {
      id: "rds_medium",
      resource_type: "aws_rds_instance",
      name: "Internal-Analytics-DB",
      provider_resource_id: "db-FEDCBA654321",
      region: "us-east-1",
      configuration: { encrypted: false }
    },
    rules: {
      name: "AWS-RDS-002",
      severity: "MEDIUM",
      description: "RDS Database storage is not encrypted at rest.",
      recommendation: "RISK: Unencrypted database storage poses a risk of data exposure if underlying storage media are compromised or improperly disposed of.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'RDS' > 'Databases'.\n2. Take a snapshot of the unencrypted database.\n3. Copy the snapshot and choose to encrypt the copy with a KMS key.\n4. Restore a new database instance from the encrypted snapshot.\n5. Update application connection strings to point to the new instance.\n6. Delete the old unencrypted instance."
    },
    ccc_metadata: [
      {id: '2-7-T-1-1', text: 'The CST shall ensure that data stored in the cloud is encrypted using strong cryptographic algorithms.'},
      {id: '2-7-P-1-1', text: 'The CSP shall provide and enforce encryption mechanisms for data stored on cloud infrastructure.'}
    ]
  },
  {
    id: "f6",
    status: "FAIL",
    resources: {
      id: "s3_public",
      resource_type: "aws_s3_bucket",
      name: "Public-Assets-Bucket",
      provider_resource_id: "arn:aws:s3:::public-assets-bucket",
      region: "us-east-1",
      configuration: { public_access: true, encrypted: false }
    },
    rules: {
      name: "AWS-S3-001",
      severity: "HIGH",
      description: "S3 Bucket allows public read/write access.",
      recommendation: "RISK: A bucket with public access allows anyone on the internet to read or write objects depending on the specific public access type. Attackers can exploit this to leak sensitive data, distribute malware, or incur massive bandwidth charges.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'S3'.\n2. Select the offending bucket and click 'Permissions'.\n3. Under 'Block public access (bucket settings)', click 'Edit'.\n4. Select 'Block all public access' and click 'Save changes'."
    },
    ccc_metadata: [
      {id: '2-2-T-1-1', text: 'The CST shall ensure that cloud service access is restricted to authorized users and systems only.'},
      {id: '2-3-P-1-2', text: 'The CSP shall implement data classification and access restrictions to prevent unauthorized data exposure.'}
    ]
  },
  {
    id: "f7",
    status: "FAIL",
    resources: {
      id: "s3_public",
      resource_type: "aws_s3_bucket",
      name: "Public-Assets-Bucket",
      provider_resource_id: "arn:aws:s3:::public-assets-bucket",
      region: "us-east-1",
      configuration: { public_access: true, encrypted: false }
    },
    rules: {
      name: "AWS-S3-002",
      severity: "MEDIUM",
      description: "S3 Bucket is not encrypted at rest.",
      recommendation: "RISK: Unencrypted data at rest in S3 can lead to data exposure if physical drives are compromised.\n\nACTION STEPS:\n1. Go to the AWS Console and navigate to 'S3'.\n2. Select the offending bucket and click 'Properties'.\n3. Under 'Default encryption', click 'Edit'.\n4. Enable Server-side encryption and click 'Save changes'."
    },
    ccc_metadata: [
      {id: '2-7-T-1-1', text: 'The CST shall ensure that data stored in the cloud is encrypted using strong cryptographic algorithms.'}
    ]
  }
];

const mockNodes = [
  {
    id: 'internet',
    type: 'cloudNode',
    position: { x: 400, y: -150 },
    data: {
      label: 'Public Internet',
      logoUrl: 'https://api.dicebear.com/9.x/icons/svg?icon=globe&seed=net',
      details: { ip: '0.0.0.0/0', status: 'External', risk: 'Info' },
    },
  },
  {
    id: 'vpc_public',
    type: 'networkGroup',
    position: { x: 50, y: 50 },
    style: { width: 750, height: 220 },
    data: { label: 'Public Subnet (10.0.1.0/24)', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.05)' },
  },
  {
    id: 'vpc_private',
    type: 'networkGroup',
    position: { x: 50, y: 320 },
    style: { width: 750, height: 220 },
    data: { label: 'Private Subnet (10.0.2.0/24)', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.05)' },
  },
  {
    id: 'ec2_ssh',
    parentId: 'vpc_public',
    extent: 'parent',
    type: 'cloudNode',
    position: { x: 50, y: 40 },
    data: {
      label: 'Public-Bastion-EC2',
      logoUrl: '/src/assets/aws/ec2.png',
      isFailed: true,
      isSafe: false,
      resourceType: 'aws_ec2_instance',
      findings: [mockFindings[0]],
      details: { ip: '54.12.34.56', status: '1 issue(s) found', risk: 'Critical', description: 'AWS-EC2-001: EC2 instance has SSH port 22 open to the internet.' },
    },
  },
  {
    id: 'db_public',
    parentId: 'vpc_public',
    extent: 'parent',
    type: 'cloudNode',
    position: { x: 300, y: 40 },
    data: {
      label: 'Customer-DB-Primary',
      logoUrl: '/src/assets/aws/rds.png',
      isFailed: true,
      isSafe: false,
      resourceType: 'aws_rds_instance',
      findings: [mockFindings[1]],
      details: { ip: 'db-ABCDEF123456', status: '1 issue(s) found', risk: 'Critical', description: 'AWS-RDS-001: RDS Database instance is publicly accessible to the internet.' },
    },
  },
  {
    id: 'web_safe',
    parentId: 'vpc_public',
    extent: 'parent',
    type: 'cloudNode',
    position: { x: 550, y: 40 },
    data: {
      label: 'Corporate-Web-Server',
      logoUrl: '/src/assets/aws/ec2.png',
      isFailed: false,
      isSafe: true,
      resourceType: 'aws_ec2_instance',
      findings: [mockFindings[2]],
      details: { ip: '54.98.76.54', status: 'Compliant', risk: 'Low', description: 'No issues detected.' },
    },
  },
  {
    id: 'rds_medium',
    parentId: 'vpc_private',
    extent: 'parent',
    type: 'cloudNode',
    position: { x: 300, y: 40 },
    data: {
      label: 'Internal-Analytics-DB',
      logoUrl: '/src/assets/aws/rds.png',
      isFailed: true,
      isSafe: false,
      resourceType: 'aws_rds_instance',
      findings: [mockFindings[4]],
      details: { ip: 'db-FEDCBA654321', status: '1 issue(s) found', risk: 'Medium', description: 'AWS-RDS-002: RDS Database storage is not encrypted at rest.' },
    },
  },
  {
    id: 'iam_full',
    type: 'cloudNode',
    position: { x: 850, y: 150 },
    data: {
      label: 'Web-Server-Admin-Role',
      logoUrl: '/src/assets/aws/iam.png',
      isFailed: true,
      isSafe: false,
      resourceType: 'aws_iam_role',
      findings: [mockFindings[3]],
      details: { ip: 'role/Web-Server-Admin-Role', status: '1 issue(s) found', risk: 'High', description: 'AWS-IAM-001: IAM Role attached to server has full administrative privileges.' },
    },
  },
  {
    id: 's3_public',
    type: 'cloudNode',
    position: { x: 850, y: -50 },
    data: {
      label: 'Public-Assets-Bucket',
      logoUrl: '/src/assets/aws/s3.png',
      isFailed: true,
      isSafe: false,
      resourceType: 'aws_s3_bucket',
      findings: [mockFindings[5], mockFindings[6]],
      details: { ip: 's3://public-assets-bucket', status: '2 issue(s) found', risk: 'High', description: 'AWS-S3-001: S3 Bucket allows public read/write access.' },
    },
  }
];

const mockEdges = [
  { id: 'e-inet-ec2', source: 'internet', target: 'ec2_ssh', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e-inet-db', source: 'internet', target: 'db_public', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e-inet-s3', source: 'internet', target: 's3_public', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-iam-ec2', source: 'iam_full', target: 'ec2_ssh', type: 'smoothstep', animated: false, style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' } },
  { id: 'e-web-rds', source: 'web_safe', target: 'rds_medium', type: 'smoothstep', animated: false, style: { stroke: '#9ca3af', strokeWidth: 1 } },
];


// ── Helper Components ─────────────────────────────────────────────────────────

function TopRightControls({ onRescan, isScanning }) {
  const { fitView } = useReactFlow();
  return (
    <Panel position="top-right" style={{ display: 'flex', gap: '8px' }}>
      <Button variant="solid" onClick={onRescan} disabled={isScanning} style={{ cursor: 'pointer' }}>
        {isScanning ? <Spinner size="1" /> : '+ Rescan Workspace'}
      </Button>
      <Button variant="soft" color="gray" onClick={() => fitView({ duration: 800, padding: 0.2 })} style={{ cursor: 'pointer' }}>
        Center View
      </Button>
    </Panel>
  );
}

function GraphController({ selectedNode }) {
  const { fitView, setCenter, getNodes } = useReactFlow();

  useEffect(() => {
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
  }, [fitView]);

  useEffect(() => {
    if (selectedNode) {
      const node = getNodes().find(n => n.id === selectedNode.id);
      if (node?.position) {
        // Approximate center calculation for nested nodes
        let x = node.position.x;
        let y = node.position.y;
        if (node.parentId) {
          const parent = getNodes().find(n => n.id === node.parentId);
          if (parent) {
            x += parent.position.x;
            y += parent.position.y;
          }
        }
        setCenter(x + 70, y + 70, { zoom: 1.5, duration: 800 });
      }
    } else {
      fitView({ duration: 800, padding: 0.2 });
    }
  }, [selectedNode, setCenter, getNodes, fitView]);

  return null;
}

function ScanSummaryBar({ summary, scanJob }) {
  const statusColor = !scanJob ? 'gray'
    : scanJob.status === 'COMPLETED' ? 'green'
    : scanJob.status === 'FAILED' ? 'red'
    : 'orange';

  const statusLabel = !scanJob ? 'No Scan'
    : scanJob.status === 'COMPLETED' ? 'Completed'
    : scanJob.status === 'FAILED' ? 'Failed'
    : 'Running…';

  return (
    <Flex
      align="center"
      gap="4"
      px="5"
      py="2"
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--gray-4)',
        flexShrink: 0,
        flexWrap: 'wrap',
        minHeight: '48px',
      }}
    >
      <Flex align="center" gap="2">
        <Badge color={statusColor} variant="solid" size="2">{statusLabel}</Badge>
        {scanJob?.created_at && (
          <Text size="1" color="gray">
            {new Date(scanJob.created_at).toLocaleString()}
          </Text>
        )}
      </Flex>

      <Box style={{ height: '16px', width: '1px', backgroundColor: 'var(--gray-5)' }} />

      <Flex align="center" gap="3" style={{ flexWrap: 'wrap' }}>
        {summary.critical > 0 && (
          <Flex align="center" gap="1">
            <Zap size={13} color="#ef4444" />
            <Text size="2" style={{ color: '#ef4444', fontWeight: 600 }}>{summary.critical} Critical</Text>
          </Flex>
        )}
        {summary.high > 0 && (
          <Flex align="center" gap="1">
            <ShieldAlert size={13} color="#f97316" />
            <Text size="2" style={{ color: '#f97316', fontWeight: 600 }}>{summary.high} High</Text>
          </Flex>
        )}
        {summary.medium > 0 && (
          <Flex align="center" gap="1">
            <AlertTriangle size={13} color="#f59e0b" />
            <Text size="2" style={{ color: '#f59e0b', fontWeight: 600 }}>{summary.medium} Medium</Text>
          </Flex>
        )}
        {summary.low > 0 && (
          <Flex align="center" gap="1">
            <Info size={13} color="#6b7280" />
            <Text size="2" style={{ color: '#6b7280', fontWeight: 600 }}>{summary.low} Low</Text>
          </Flex>
        )}
        {summary.pass > 0 && (
          <Flex align="center" gap="1">
            <ShieldCheck size={13} color="#10b981" />
            <Text size="2" style={{ color: '#10b981', fontWeight: 600 }}>{summary.pass} Passed</Text>
          </Flex>
        )}
        {summary.total === 0 && (
          <Text size="2" color="gray">No findings</Text>
        )}
      </Flex>
    </Flex>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DemoAppPage() {
  const navigate = useNavigate();
  const { setPage, setSelectedNode: setTipNode } = useDemoTip();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Mock job state
  const [scanJob, setScanJob] = useState({ status: 'PENDING', created_at: new Date().toISOString() });
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 });

  useEffect(() => {
    setPage('workspace');
  }, [setPage]);

  useEffect(() => {
    // Simulate loading for 3 seconds
    const timer = setTimeout(() => {
      setScanJob(prev => ({ ...prev, status: 'COMPLETED' }));
      setNodes(mockNodes);
      setEdges(mockEdges);
      setSummary(mockSummary);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = (_event, node) => {
    setSelectedNode(node);
    setTipNode(node);
  };
  const onPaneClick = () => {
    setSelectedNode(null);
    setTipNode(null);
  };

  const isPending = scanJob?.status === 'PENDING';

  const handleRescan = () => {
    setScanJob({ status: 'PENDING', created_at: new Date().toISOString() });
    setNodes([]);
    setEdges([]);
    setSummary({ total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 });
    setTimeout(() => {
      setScanJob(prev => ({ ...prev, status: 'COMPLETED' }));
      setNodes(mockNodes);
      setEdges(mockEdges);
      setSummary(mockSummary);
    }, 3000);
  };

  return (
    <Flex direction="column" style={{ height: '100%', backgroundColor: 'var(--gray-1)' }}>
      <DemoContextBar />
      {/* Summary bar */}
      <ScanSummaryBar summary={summary} scanJob={scanJob} />

      {/* Main content area */}
      <Flex style={{ flexGrow: 1, overflow: 'hidden' }}>

        {/* Canvas or state screens */}
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          {isPending ? (
            <Flex align="center" justify="center" style={{ height: '100%' }} gap="3" direction="column">
              <Spinner size="3" />
              <Text size="4" weight="bold" style={{ color: 'var(--gray-11)' }}>Scan in Progress…</Text>
              <Text color="gray" size="2">Your cloud infrastructure is being analyzed. This page will update automatically.</Text>
            </Flex>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
            >
              <Background variant="dots" gap={20} size={1} color="#a1a1aa" />
              <Controls />
              <MiniMap zoomable pannable />
              <TopRightControls onRescan={handleRescan} isScanning={isPending} />
              <GraphController selectedNode={selectedNode} />
            </ReactFlow>
          )}
        </Box>

        {/* Right sidebar – node details */}
        <NodeDetailsPanel selectedNode={selectedNode} onClose={() => { setSelectedNode(null); setTipNode(null); }} />
      </Flex>
      <DemoGuide />
    </Flex>
  );
}
