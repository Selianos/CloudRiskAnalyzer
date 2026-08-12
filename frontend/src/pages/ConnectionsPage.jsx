import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Flex, Box, Heading, Text, Button, Callout, Spinner } from '@radix-ui/themes';
import { Plus, Info } from 'lucide-react';
import ConnectionTable from '../components/connections/ConnectionTable';
import { getConnections } from '../api/connection';
import { createScan } from '../api/scan';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci_small.png';
import gcpLogo from '../assets/providers/gcp_small.png';

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const onSelectScan = context?.onSelectScan;
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchConnections = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);
      const data = await getConnections();
      const mapped = mapConnections(data);
      setConnections(mapped);
      
      // If any connection is scanning, poll again in 5 seconds
      const isScanning = mapped.some(c => c.lastScanStatus === 'PENDING' || c.lastScanStatus === 'RUNNING');
      if (isScanning) {
        setTimeout(() => fetchConnections(true), 5000);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
      if (!isPolling) setError(err.message || 'Failed to load connections');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // Cleanup timeout on unmount is handled implicitly since state update on unmounted component is benign or we can leave it simple
  }, []);

  const mapConnections = (rawList) => {
    return rawList.map((conn) => {
      const latestJob = conn.scan_jobs?.[0] || null;

      // Determine provider name and logo
      let providerName = '';
      let logo = null;
      if (conn.provider === 'aws') {
        providerName = 'Amazon Web Services';
        logo = awsLogo;
      } else if (conn.provider === 'oci') {
        providerName = 'Oracle Cloud Infrastructure';
        logo = ociLogo;
      } else if (conn.provider === 'gcp') {
        providerName = 'Google Cloud Platform';
        logo = gcpLogo;
      }

      // Format connected date (created_at)
      const connectedAt = conn.created_at ? new Date(conn.created_at).toLocaleDateString() : '';

      // Format last scan date/time
      const lastScanAt = latestJob && latestJob.completed_at
        ? new Date(latestJob.completed_at).toLocaleString()
        : null;

      // Determine scan status and findings count
      let lastScanStatus = 'never';
      let findingsCount = 0;

      if (latestJob) {
        if (latestJob.status === 'COMPLETED') {
          // Count failing findings
          const failedFindings = latestJob.findings?.filter(f => f.status === 'FAIL') || [];
          findingsCount = failedFindings.length;

          if (findingsCount > 0) {
            // Classify severity: if there is any critical/high finding -> critical, else warning
            const hasCriticalOrHigh = failedFindings.some(f =>
              f.rules?.severity === 'CRITICAL' || f.rules?.severity === 'HIGH'
            );
            lastScanStatus = hasCriticalOrHigh ? 'critical' : 'warning';
          } else {
            lastScanStatus = 'secure';
          }
        } else if (latestJob.status === 'FAILED') {
          lastScanStatus = 'failed';
        } else {
          lastScanStatus = 'running'; // PENDING or RUNNING
        }
      }

      return {
        id: conn.id,
        name: conn.name,
        provider: conn.provider,
        providerName,
        logo,
        connectedAt,
        lastScanAt,
        lastScanStatus,
        findingsCount,
        latestScanId: latestJob?.id || null,
        latestScanCreatedAt: latestJob?.created_at || null,
      };
    });
  };

  const handleNavigateToWorkspace = (conn) => {
    // conn.latestScanId is set in mapConnections
    if (conn.latestScanId && onSelectScan) {
      // Build a minimal scan object so AppLayout can select it
      onSelectScan({ 
        id: conn.latestScanId, 
        created_at: conn.latestScanCreatedAt, 
        connection_id: conn.id,
        connections: { name: conn.name } 
      });
    } else {
      navigate('/app');
    }
  };

  const handleScanTrigger = async (conn) => {
    try {
      setActionError(null);
      await createScan({ connection_id: conn.id });
      // Refresh list to show the new scanning status
      fetchConnections();
    } catch (err) {
      console.error('Error triggering scan:', err);
      setActionError(err.message || `Failed to trigger scan for ${conn.name}`);
    }
  };

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header Section */}
        <Flex justify="between" align="center" mb="6" wrap="wrap" gap="4">
          <Box>
            <Heading size="6" mb="1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Cloud Connections
            </Heading>
            <Text color="gray" size="2">
              Manage your connected cloud accounts and monitor their latest scan reports.
            </Text>
          </Box>
          <Button
            variant="solid"
            size="3"
            onClick={() => navigate('/app/scans/new')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            Create Connection
          </Button>
        </Flex>

        {/* Error Callouts */}
        {error && (
          <Callout.Root color="red" role="alert" mb="4">
            <Callout.Icon>
              <Info size={16} />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {actionError && (
          <Callout.Root color="red" role="alert" mb="4">
            <Callout.Icon>
              <Info size={16} />
            </Callout.Icon>
            <Callout.Text>{actionError}</Callout.Text>
          </Callout.Root>
        )}

        {/* Loading Spinner or Connections Table */}
        {loading ? (
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Spinner size="3" />
          </Flex>
        ) : connections.length === 0 ? (
          <Flex direction="column" align="center" justify="center" style={{ height: '200px', border: '1px dashed var(--gray-5)', borderRadius: '8px' }} p="4">
            <Text color="gray" mb="4">No cloud connections configured yet.</Text>
            <Button variant="soft" onClick={() => navigate('/app/scans/new')}>Connect your first account</Button>
          </Flex>
        ) : (
          <ConnectionTable
            connections={connections}
            onNavigateToWorkspace={handleNavigateToWorkspace}
            onScanTrigger={handleScanTrigger}
          />
        )}

      </Box>
    </Box>
  );
}
