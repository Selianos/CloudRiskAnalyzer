import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Flex, Box, Heading, Text, Button } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import ConnectionTable from '../components/connections/ConnectionTable';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci_small.png';
import gcpLogo from '../assets/providers/gcp_small.png';

export default function ConnectionsPage() {
  const navigate = useNavigate();

  // Fake demo data for connections
  const [connections] = useState([
    {
      id: '1',
      name: 'AWS Production Environment',
      provider: 'aws',
      providerName: 'Amazon Web Services',
      logo: awsLogo,
      connectedAt: '2026-06-15',
      lastScanAt: '2026-08-11 04:32 AM',
      lastScanStatus: 'secure', // secure, warning, critical, never
      findingsCount: 3
    },
    {
      id: '2',
      name: 'Oracle Cloud Core Tenancy',
      provider: 'oci',
      providerName: 'Oracle Cloud Infrastructure',
      logo: ociLogo,
      connectedAt: '2026-07-02',
      lastScanAt: '2026-08-12 10:15 AM',
      lastScanStatus: 'warning',
      findingsCount: 14
    },
    {
      id: '3',
      name: 'GCP Staging & Development',
      provider: 'gcp',
      providerName: 'Google Cloud Platform',
      logo: gcpLogo,
      connectedAt: '2026-08-01',
      lastScanAt: '2026-08-01 02:00 PM',
      lastScanStatus: 'critical',
      findingsCount: 38
    },
    {
      id: '4',
      name: 'AWS Sandboxed Testing Env',
      provider: 'aws',
      providerName: 'Amazon Web Services',
      logo: awsLogo,
      connectedAt: '2026-08-10',
      lastScanAt: null,
      lastScanStatus: 'never',
      findingsCount: 0
    }
  ]);

  const handleNavigateToWorkspace = (conn) => {
    navigate('/app');
  };

  const handleScanTrigger = (conn) => {
    // Demo placeholder
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
            Connect Account
          </Button>
        </Flex>

        {/* Connections Table Component */}
        <ConnectionTable
          connections={connections}
          onNavigateToWorkspace={handleNavigateToWorkspace}
          onScanTrigger={handleScanTrigger}
        />

      </Box>
    </Box>
  );
}
