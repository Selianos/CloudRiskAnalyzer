import { Table, Flex, Box, Text, Button, Avatar, Badge } from '@radix-ui/themes';
import { Shield, RefreshCw, Calendar } from 'lucide-react';

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

export default function ConnectionRow({ conn, onNavigateToWorkspace, onScanTrigger }) {
  return (
    <Table.Row align="center">
      {/* ID */}
      <Table.Cell>
        <Text size="2" weight="medium" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
          {conn.id}
        </Text>
      </Table.Cell>

      {/* Provider Logo + Name */}
      <Table.Cell>
        <Flex align="center" gap="3">
          <img
            src={conn.logo}
            alt={conn.provider}
            style={{ 
              height: '36px', 
              width: '36px',
              objectFit: 'contain' 
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
        <Text size="2">
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
            onClick={onNavigateToWorkspace}
          >
            <Shield size={12} />
            Workspace
          </Button>
          <Button 
            size="1" 
            variant="ghost" 
            color="gray"
            style={{ cursor: 'pointer' }}
            onClick={onScanTrigger}
          >
            <RefreshCw size={12} />
          </Button>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}
