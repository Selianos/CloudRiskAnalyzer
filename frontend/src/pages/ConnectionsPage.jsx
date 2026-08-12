import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Flex, Box, Heading, Text, Button, Table, Badge, Card, Avatar } from '@radix-ui/themes';
import { Plus, Shield, RefreshCw, Calendar, Link2 } from 'lucide-react';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci.png';
import gcpLogo from '../assets/providers/gcp.png';

export default function ConnectionsPage() {
  const navigate = useNavigate();

  // Fake demo data for connections
  const [connections] = useState([
    {
      id: 'conn_aws_prod_01',
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
      id: 'conn_oci_core_02',
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
      id: 'conn_gcp_dev_03',
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
      id: 'conn_aws_test_04',
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

  const getStatusBadge = (status, count) => {
    switch (status) {
      case 'secure':
        return <Badge color="green" size="2">Secure ({count} alerts)</Badge>;
      case 'warning':
        return <Badge color="amber" size="2">Warning ({count} alerts)</Badge>;
      case 'critical':
        return <Badge color="red" size="2">Critical ({count} alerts)</Badge>;
      case 'never':
      default:
        return <Badge color="gray" size="2">Never Scanned</Badge>;
    }
  };

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <Flex justify="between" align="center" mb="6" wrap="wrap" gap="4">
          <Box>
            <Heading size="6" mb="1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={24} style={{ color: 'var(--primary-color)' }} />
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

        {/* Connections Table Card */}
        <Card size="3" style={{ overflow: 'hidden' }}>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Connection ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Cloud Provider</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Connection Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Connected Date</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Scan Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {connections.map((conn) => (
                <Table.Row key={conn.id} align="center">
                  {/* ID */}
                  <Table.Cell>
                    <Text size="2" weight="medium" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                      {conn.id}
                    </Text>
                  </Table.Cell>

                  {/* Provider Logo + Name */}
                  <Table.Cell>
                    <Flex align="center" gap="3">
                      <Avatar
                        src={conn.logo}
                        fallback={conn.provider.toUpperCase()}
                        size="1"
                        radius="medium"
                        style={{ 
                          objectFit: 'contain', 
                          backgroundColor: 'var(--gray-2)', 
                          padding: '4px' 
                        }}
                      />
                      <Box>
                        <Text size="2" weight="bold" as="div">
                          {conn.provider.toUpperCase()}
                        </Text>
                        <Text size="1" color="gray" as="div">
                          {conn.providerName}
                        </Text>
                      </Box>
                    </Flex>
                  </Table.Cell>

                  {/* Name */}
                  <Table.Cell>
                    <Text size="2" weight="bold">
                      {conn.name}
                    </Text>
                  </Table.Cell>

                  {/* Connected Date */}
                  <Table.Cell>
                    <Flex align="center" gap="2" style={{ color: 'var(--gray-11)' }}>
                      <Calendar size={14} />
                      <Text size="2">{conn.connectedAt}</Text>
                    </Flex>
                  </Table.Cell>

                  {/* Last Scan Status */}
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      {getStatusBadge(conn.lastScanStatus, conn.findingsCount)}
                      {conn.lastScanAt && (
                        <Text size="1" color="gray">
                          at {conn.lastScanAt}
                        </Text>
                      )}
                    </Flex>
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell justify="end">
                    <Flex gap="2" justify="end">
                      <Button 
                        size="1" 
                        variant="soft" 
                        color="indigo" 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => navigate('/app')}
                      >
                        <Shield size={12} />
                        Workspace
                      </Button>
                      <Button 
                        size="1" 
                        variant="ghost" 
                        color="gray"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {}}
                      >
                        <RefreshCw size={12} />
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card>

      </Box>
    </Box>
  );
}
