import { Table } from '@radix-ui/themes';
import ConnectionRow from './ConnectionRow';

export default function ConnectionTable({ connections, onNavigateToWorkspace, onScanTrigger }) {
  return (
    <Table.Root variant="ghost">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Cloud Provider</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Connection Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Connected Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Last Scan Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {connections.map((conn, index) => (
          <ConnectionRow
            key={conn.id}
            index={index + 1}
            conn={conn}
            onNavigateToWorkspace={() => onNavigateToWorkspace(conn)}
            onScanTrigger={() => onScanTrigger(conn)}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
