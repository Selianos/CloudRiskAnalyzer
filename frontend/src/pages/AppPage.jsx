import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Heading, Text, Flex, Box, Card, Badge, IconButton } from '@radix-ui/themes';
import { ReactFlow, Background, Controls, Panel, applyNodeChanges, applyEdgeChanges, addEdge, MiniMap, useReactFlow, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../components/graph/CustomNodes';
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel';
import wafLogo from '../assets/aws/waf.png';
import rdsLogo from '../assets/aws/rds.png';
import iamLogo from '../assets/aws/iam.png';
import ec2Logo from '../assets/aws/ec2.png';
import s3Logo from '../assets/aws/s3.png';
import elbLogo from '../assets/aws/elb.png';

const iconInternet = 'https://api.dicebear.com/9.x/icons/svg?icon=globe&seed=net';

const awsNodes = [
  // THE OUTSIDE WORLD
  { id: 'internet', type: 'cloudNode', position: { x: 500, y: -100 }, data: { label: 'Public Internet', logoUrl: iconInternet, details: { ip: '0.0.0.0/0', status: 'External', risk: 'Info' } } },

  // VPC 1: PRODUCTION ENVIRONMENT
  { id: 'vpc-prod', type: 'networkGroup', position: { x: 30, y: 50 }, style: { width: 700, height: 650, zIndex: -2 }, data: { label: 'VPC: Production (10.0.0.0/16)', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.05)' } },
  
  // Prod Public Subnet
  { id: 'sub-prod-pub', type: 'networkGroup', parentId: 'vpc-prod', position: { x: 20, y: 40 }, style: { width: 660, height: 200, zIndex: -1 }, data: { label: 'Public Subnet (10.0.1.0/24)', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.05)' } },
  { id: 'waf-prod', type: 'cloudNode', parentId: 'sub-prod-pub', position: { x: 40, y: 30 }, data: { label: 'AWS WAF', logoUrl: wafLogo, isSafe: true, details: { ip: 'Protected', status: 'Active', risk: 'Low' } } },
  { id: 'alb-prod', type: 'cloudNode', parentId: 'sub-prod-pub', position: { x: 250, y: 30 }, data: { label: 'Load Balancer', logoUrl: elbLogo, isSafe: true, details: { ip: 'ALB-DNS', status: 'Routing Traffic', risk: 'Low' } } },
  { id: 'bastion', type: 'cloudNode', parentId: 'sub-prod-pub', position: { x: 480, y: 30 }, data: { label: 'Bastion Host', logoUrl: ec2Logo, isSafe: true, details: { ip: '10.0.1.99', status: 'Strict SSH Only', risk: 'Low' } } },

  // Prod Private Subnet
  { id: 'sub-prod-priv', type: 'networkGroup', parentId: 'vpc-prod', position: { x: 20, y: 280 }, style: { width: 660, height: 350, zIndex: -1 }, data: { label: 'Private Subnet (10.0.2.0/24)', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.05)' } },
  { id: 'ec2-prod-1', type: 'cloudNode', parentId: 'sub-prod-priv', position: { x: 40, y: 30 }, data: { label: 'App Server 1', logoUrl: ec2Logo, isSafe: true, details: { ip: '10.0.2.15', status: 'Running', risk: 'Low' } } },
  { id: 'ec2-prod-2', type: 'cloudNode', parentId: 'sub-prod-priv', position: { x: 250, y: 30 }, data: { label: 'App Server 2', logoUrl: ec2Logo, isSafe: true, details: { ip: '10.0.2.16', status: 'Running', risk: 'Low' } } },
  { id: 'rds-prod', type: 'cloudNode', parentId: 'sub-prod-priv', position: { x: 480, y: 30 }, data: { label: 'Primary RDS', logoUrl: rdsLogo, isSafe: true, details: { ip: '10.0.2.200', status: 'Encrypted', risk: 'Low' } } },
  { id: 'iam-prod', type: 'cloudNode', parentId: 'sub-prod-priv', position: { x: 150, y: 190 }, data: { label: 'App IAM Role', logoUrl: iamLogo, isSafe: true, details: { ip: 'N/A', status: 'Least Privilege', risk: 'Low' } } },

  // VPC 2: EMPTY NETWORK
  { id: 'vpc-empty', type: 'networkGroup', position: { x: 800, y: 50 }, style: { width: 350, height: 200, zIndex: -2 }, data: { label: 'VPC: Unused (10.1.0.0/16)', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.05)' } },
  { id: 'empty-msg', type: 'default', parentId: 'vpc-empty', position: { x: 90, y: 80 }, data: { label: 'No Resources Detected' }, style: { background: 'transparent', border: 'none', color: '#9ca3af', fontWeight: 'bold' } },

  // VPC 3: LEGACY ENVIRONMENT
  { id: 'vpc-legacy', type: 'networkGroup', position: { x: 800, y: 300 }, style: { width: 500, height: 400, zIndex: -2 }, data: { label: 'VPC: Legacy Dev (10.2.0.0/16)', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.05)' } },
  { id: 'sub-legacy-pub', type: 'networkGroup', parentId: 'vpc-legacy', position: { x: 20, y: 40 }, style: { width: 450, height: 340, zIndex: -1 }, data: { label: 'Public Subnet - OVEREXPOSED', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' } },
  
  { id: 'ec2-legacy', type: 'cloudNode', parentId: 'sub-legacy-pub', position: { x: 40, y: 30 }, data: { label: 'Dev Server', logoUrl: ec2Logo, isFailed: true, details: { ip: '3.14.15.92', status: 'SSH Exposed', risk: 'Critical', description: 'Port 22 open to 0.0.0.0/0.' } } },
  { id: 'iam-legacy', type: 'cloudNode', parentId: 'sub-legacy-pub', position: { x: 280, y: 30 }, data: { label: 'Admin IAM', logoUrl: iamLogo, isFailed: true, details: { ip: 'N/A', status: 'Overprivileged', risk: 'High', description: 'Server has AdministratorAccess attached!' } } },
  { id: 's3-legacy', type: 'cloudNode', parentId: 'sub-legacy-pub', position: { x: 160, y: 180 }, data: { label: 'Customer Data S3', logoUrl: s3Logo, isFailed: true, details: { ip: 's3.amazonaws.com', status: 'Public Read', risk: 'Critical', description: 'Bucket contains PII but lacks Block Public Access.' } } },
];

const awsEdges = [
  // Type: 'smoothstep' routes edges squarely around nodes instead of cutting through diagonally
  { id: 'e-in-waf', source: 'internet', target: 'waf-prod', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e-waf-alb', source: 'waf-prod', target: 'alb-prod', type: 'smoothstep', animated: true, style: { stroke: '#10b981' } },
  { id: 'e-alb-ec21', source: 'alb-prod', target: 'ec2-prod-1', type: 'smoothstep', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-alb-ec22', source: 'alb-prod', target: 'ec2-prod-2', type: 'smoothstep', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-ec21-rds', source: 'ec2-prod-1', target: 'rds-prod', type: 'smoothstep', sourceHandle: 'right', targetHandle: 'left', style: { stroke: '#8b5cf6' } },
  { id: 'e-ec22-rds', source: 'ec2-prod-2', target: 'rds-prod', type: 'smoothstep', sourceHandle: 'right', targetHandle: 'left', style: { stroke: '#8b5cf6' } },
  { id: 'e-iam-ec21', source: 'iam-prod', target: 'ec2-prod-1', type: 'smoothstep', sourceHandle: 'left', targetHandle: 'bottom', style: { stroke: '#9ca3af', strokeDasharray: '5,5' } },
  { id: 'e-iam-ec22', source: 'iam-prod', target: 'ec2-prod-2', type: 'smoothstep', sourceHandle: 'right', targetHandle: 'bottom', style: { stroke: '#9ca3af', strokeDasharray: '5,5' } },
  { id: 'e-in-bastion', source: 'internet', target: 'bastion', type: 'smoothstep', style: { stroke: '#9ca3af' } },
  { id: 'e-bas-rds', source: 'bastion', target: 'rds-prod', type: 'smoothstep', sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: '#9ca3af' } },

  // Compromised Connections
  { id: 'e-in-leg', source: 'internet', target: 'ec2-legacy', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 3 } },
  { id: 'e-in-s3', source: 'internet', target: 's3-legacy', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 3 } },
  { id: 'e-leg-iam', source: 'iam-legacy', target: 'ec2-legacy', type: 'smoothstep', sourceHandle: 'left', targetHandle: 'right', style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e-leg-s3', source: 'ec2-legacy', target: 's3-legacy', type: 'smoothstep', sourceHandle: 'bottom', targetHandle: 'left', animated: true, style: { stroke: '#ef4444' } },
];

const ociNodes = [
  { id: 'internet', type: 'cloudNode', position: { x: 300, y: -100 }, data: { label: 'Public Internet', logoUrl: iconInternet, details: { ip: '0.0.0.0/0', status: 'External', risk: 'Info' } } },
  { id: 'vcn-prod', type: 'networkGroup', position: { x: 100, y: 100 }, style: { width: 500, height: 400, zIndex: -2 }, data: { label: 'OCI VCN', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.05)' } },
  { id: 'sub-pub', type: 'networkGroup', parentId: 'vcn-prod', position: { x: 20, y: 40 }, style: { width: 460, height: 160, zIndex: -1 }, data: { label: 'Public Subnet', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' } },
  { id: 'compute-oci', type: 'cloudNode', parentId: 'sub-pub', position: { x: 40, y: 10 }, data: { label: 'Compute Instance', logoUrl: iconInternet, isSafe: true, details: { ip: 'Public IP', status: 'Running', risk: 'Low' } } },
  { id: 'sub-priv', type: 'networkGroup', parentId: 'vcn-prod', position: { x: 20, y: 220 }, style: { width: 460, height: 160, zIndex: -1 }, data: { label: 'Private Subnet', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.05)' } },
  { id: 'adw-oci', type: 'cloudNode', parentId: 'sub-priv', position: { x: 250, y: 10 }, data: { label: 'Autonomous DB', logoUrl: iconInternet, isFailed: true, details: { ip: 'Internal', status: 'Exposed Backups', risk: 'High', description: 'Database backup lacks encryption.' } } }
];

const ociEdges = [
  { id: 'e-oci-int', source: 'internet', target: 'compute-oci', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b' } },
  { id: 'e-oci-db', source: 'compute-oci', target: 'adw-oci', type: 'smoothstep', style: { stroke: '#f59e0b' } }
];

const gcpNodes = [
  { id: 'internet', type: 'cloudNode', position: { x: 300, y: -100 }, data: { label: 'Public Internet', logoUrl: iconInternet, details: { ip: '0.0.0.0/0', status: 'External', risk: 'Info' } } },
  { id: 'vpc-gcp', type: 'networkGroup', position: { x: 100, y: 100 }, style: { width: 500, height: 400, zIndex: -2 }, data: { label: 'GCP VPC Network', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.05)' } },
  { id: 'sub-gcp', type: 'networkGroup', parentId: 'vpc-gcp', position: { x: 20, y: 40 }, style: { width: 460, height: 340, zIndex: -1 }, data: { label: 'us-central1 Subnet', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' } },
  { id: 'compute-gcp', type: 'cloudNode', parentId: 'sub-gcp', position: { x: 40, y: 30 }, data: { label: 'Compute Engine', logoUrl: iconInternet, isSafe: true, details: { ip: '10.128.0.2', status: 'Running', risk: 'Low' } } },
  { id: 'sql-gcp', type: 'cloudNode', parentId: 'sub-gcp', position: { x: 250, y: 180 }, data: { label: 'Cloud SQL', logoUrl: iconInternet, isSafe: true, details: { ip: 'Internal', status: 'Secure', risk: 'Low' } } }
];

const gcpEdges = [
  { id: 'e-gcp-int', source: 'internet', target: 'compute-gcp', type: 'smoothstep', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-gcp-sql', source: 'compute-gcp', target: 'sql-gcp', type: 'smoothstep', style: { stroke: '#3b82f6' } }
];

function CenterViewButton() {
  const { fitView } = useReactFlow();
  return (
    <Panel position="top-right">
      <Button variant="solid" color="gray" onClick={() => fitView({ duration: 800, padding: 0.2 })} style={{ cursor: 'pointer' }}>
        Center View
      </Button>
    </Panel>
  );
}

function GraphController({ selectedScan, selectedNode }) {
  const { fitView, setCenter, getNodes } = useReactFlow();

  // Center view when switching scans
  useEffect(() => {
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  }, [selectedScan, fitView]);

  // Zoom into selected node, or zoom out if deselected
  useEffect(() => {
    if (selectedNode) {
      const node = getNodes().find(n => n.id === selectedNode.id);
      if (node && node.position) {
        // Approximate center of our nodes (which are ~140px wide)
        const x = node.position.x + 70;
        const y = node.position.y + 70;
        setCenter(x, y, { zoom: 1.5, duration: 800 });
      }
    } else {
      // Zoom back out when sidebar is closed
      fitView({ duration: 800, padding: 0.2 });
    }
  }, [selectedNode, setCenter, getNodes, fitView]);

  return null;
}

export default function AppPage() {
  const { user, logout } = useAuth();
  const userName = user?.user_metadata?.fullname || 'User';
  
  const context = useOutletContext();
  const selectedScan = context?.selectedScan || 'AWS';

  const [nodes, setNodes] = useState(awsNodes);
  const [edges, setEdges] = useState(awsEdges);
  const [selectedNode, setSelectedNode] = useState(null); // Track clicked node

  // Swap graphs dynamically when dropdown changes
  useEffect(() => {
    if (selectedScan === 'AWS') { setNodes(awsNodes); setEdges(awsEdges); }
    else if (selectedScan === 'OCI') { setNodes(ociNodes); setEdges(ociEdges); }
    else if (selectedScan === 'GCP') { setNodes(gcpNodes); setEdges(gcpEdges); }
    setSelectedNode(null); // Deselect on swap
  }, [selectedScan]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Capture clicks on nodes
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  // Click outside to deselect
  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <Flex direction="column" style={{ height: '100%', backgroundColor: 'var(--gray-1)' }}>
      {/* Main Content Area (Canvas + Structural Sidebar) */}
      <Flex style={{ flexGrow: 1, overflow: 'hidden' }}>
        
        {/* React Flow Infinite Canvas */}
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick} // Trigger when user clicks node
            onPaneClick={onPaneClick} // Trigger when user clicks empty space
            fitView
            nodesDraggable={false} // Still keep dragging disabled
            nodesConnectable={false}
            elementsSelectable={true} // Allow selection for clicking!
          >
            <Background variant="dots" gap={20} size={1} color="#a1a1aa" />
            <Controls />
            <MiniMap zoomable pannable />
            <CenterViewButton />
            <GraphController selectedScan={selectedScan} selectedNode={selectedNode} />
          </ReactFlow>
        </Box>

        {/* Beautifully Designed Right Side Bar */}
        <NodeDetailsPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
      </Flex>
    </Flex>
  );
}
