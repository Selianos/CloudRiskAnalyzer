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

import { nodeTypes } from '../components/graph/CustomNodes';
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel';
import { getScanResults, getScanById, createScan } from '../api/scan';
import { transformFindingsToGraph, summarizeFindings } from '../lib/graphTransformer';

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

function GraphController({ scanId, selectedNode }) {
  const { fitView, setCenter, getNodes } = useReactFlow();

  useEffect(() => {
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
  }, [scanId, fitView]);

  useEffect(() => {
    if (selectedNode) {
      const node = getNodes().find(n => n.id === selectedNode.id);
      if (node?.position) {
        setCenter(node.position.x + 70, node.position.y + 70, { zoom: 1.5, duration: 800 });
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

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ reason, navigate }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: '100%', gap: '16px', backgroundColor: 'var(--gray-1)' }}
    >
      <ShieldAlert size={48} color="var(--gray-8)" />
      <Text size="5" weight="bold" style={{ color: 'var(--gray-11)' }}>
        {reason === 'no-scan' ? 'No scan selected' : 'No results available'}
      </Text>
      <Text color="gray" size="3" style={{ maxWidth: 400, textAlign: 'center' }}>
        {reason === 'no-scan'
          ? 'Select a scan from the dropdown above or start a new one to see your cloud security graph.'
          : 'This scan has not completed yet, or returned no findings. Check back after the scan finishes.'}
      </Text>
      <Button variant="solid" onClick={() => navigate('/app/scans/new')} style={{ cursor: 'pointer', marginTop: '8px' }}>
        + New Scan
      </Button>
    </Flex>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AppPage() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const selectedScan = context?.selectedScan || null;

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [scanJob, setScanJob] = useState(null);
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pollTimer, setPollTimer] = useState(null);

  // ── Load scan results when selectedScan changes ───────────────────────────
  useEffect(() => {
    // Clear any existing poll timer
    if (pollTimer) {
      clearInterval(pollTimer);
      setPollTimer(null);
    }

    if (!selectedScan?.id) {
      setNodes([]);
      setEdges([]);
      setScanJob(null);
      setSummary({ total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 });
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedNode(null);

        // Fetch scan job status
        const job = await getScanById(selectedScan.id);
        setScanJob(job);

        if (job.status === 'COMPLETED') {
          // Fetch findings
          const findings = await getScanResults(selectedScan.id);
          const { nodes: gNodes, edges: gEdges } = transformFindingsToGraph(findings);
          setNodes(gNodes);
          setEdges(gEdges);
          setSummary(summarizeFindings(findings));
        } else if (job.status === 'PENDING' || job.status === 'RUNNING') {
          // Poll every 5 seconds until done
          setNodes([]);
          setEdges([]);
          setSummary({ total: 0, critical: 0, high: 0, medium: 0, low: 0, pass: 0 });

          const timer = setInterval(async () => {
            try {
              const updatedJob = await getScanById(selectedScan.id);
              setScanJob(updatedJob);
              if (updatedJob.status === 'COMPLETED') {
                clearInterval(timer);
                setPollTimer(null);
                const findings = await getScanResults(selectedScan.id);
                const { nodes: gNodes, edges: gEdges } = transformFindingsToGraph(findings);
                setNodes(gNodes);
                setEdges(gEdges);
                setSummary(summarizeFindings(findings));
              } else if (updatedJob.status === 'FAILED') {
                clearInterval(timer);
                setPollTimer(null);
              }
            } catch (pollErr) {
              console.error('Poll error:', pollErr);
            }
          }, 5000);
          setPollTimer(timer);
        } else {
          // FAILED or unknown
          setNodes([]);
          setEdges([]);
        }
      } catch (err) {
        console.error('Failed to load scan results:', err);
        setError(err.message || 'Failed to load scan results.');
      } finally {
        setLoading(false);
      }
    };

    loadResults();

    // Cleanup on unmount / next effect
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScan?.id]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = (_event, node) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  // ── Render ────────────────────────────────────────────────────────────────
  const isPending = scanJob?.status === 'PENDING' || scanJob?.status === 'RUNNING';
  const isFailed = scanJob?.status === 'FAILED';

  const handleRescan = async () => {
    if (!selectedScan || !selectedScan.connection_id) {
      setError('Cannot rescan: Missing connection details. Please select a scan from the dropdown again.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await createScan({ connection_id: selectedScan.connection_id });
      if (context?.refreshScans) {
        context.refreshScans();
      }
    } catch (err) {
      console.error('Failed to trigger rescan:', err);
      setError(err.message || 'Failed to trigger a new scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" style={{ height: '100%', backgroundColor: 'var(--gray-1)' }}>
      {/* Summary bar */}
      <ScanSummaryBar summary={summary} scanJob={scanJob} />

      {/* Error callout */}
      {error && (
        <Box px="4" pt="3" style={{ flexShrink: 0 }}>
          <Callout.Root color="red" role="alert">
            <Callout.Icon><Info size={16} /></Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        </Box>
      )}

      {/* Main content area */}
      <Flex style={{ flexGrow: 1, overflow: 'hidden' }}>

        {/* Canvas or state screens */}
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          {loading ? (
            <Flex align="center" justify="center" style={{ height: '100%' }} gap="3" direction="column">
              <Spinner size="3" />
              <Text color="gray" size="3">Loading scan results…</Text>
            </Flex>
          ) : !selectedScan ? (
            <EmptyState reason="no-scan" navigate={navigate} />
          ) : isPending ? (
            <Flex align="center" justify="center" style={{ height: '100%' }} gap="3" direction="column">
              <Spinner size="3" />
              <Text size="4" weight="bold" style={{ color: 'var(--gray-11)' }}>Scan in Progress…</Text>
              <Text color="gray" size="2">Your cloud infrastructure is being analyzed. This page will update automatically.</Text>
            </Flex>
          ) : isFailed ? (
            <Flex align="center" justify="center" style={{ height: '100%' }} gap="3" direction="column">
              <ShieldAlert size={48} color="#ef4444" />
              <Text size="4" weight="bold" style={{ color: '#ef4444' }}>Scan Failed</Text>
              <Text color="gray" size="2" style={{ maxWidth: 400, textAlign: 'center' }}>
                {scanJob?.error_message || 'The scan encountered an error. Please check your credentials and try again.'}
              </Text>
              <Button variant="solid" onClick={() => navigate('/app/scans/new')} style={{ cursor: 'pointer', marginTop: '8px' }}>
                Try a New Scan
              </Button>
            </Flex>
          ) : nodes.length === 0 ? (
            <EmptyState reason="no-results" navigate={navigate} />
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
              <GraphController scanId={selectedScan?.id} selectedNode={selectedNode} />
            </ReactFlow>
          )}
        </Box>

        {/* Right sidebar – node details */}
        <NodeDetailsPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
      </Flex>
    </Flex>
  );
}
