import { Table, Card } from '@radix-ui/themes';
import ConnectionRow from './ConnectionRow';

export default function ConnectionTable({ connections, onNavigateToWorkspace, onScanTrigger }) {
  return (
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
            <ConnectionRow
              key={conn.id}
              conn={conn}
              onNavigateToWorkspace={() => onNavigateToWorkspace(conn)}
              onScanTrigger={() => onScanTrigger(conn)}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
}
