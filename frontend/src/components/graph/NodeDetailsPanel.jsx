import { Box, Flex, Heading, IconButton, Text, Badge, Card, Button } from '@radix-ui/themes';

export default function NodeDetailsPanel({ selectedNode, onClose }) {
  if (!selectedNode) return null;

  return (
    <Box 
      style={{ 
        width: '380px', 
        backgroundColor: 'white', 
        borderLeft: '1px solid var(--gray-4)',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.03)',
        overflowY: 'auto',
        flexShrink: 0
      }}
    >
      <Flex direction="column" p="5" gap="5">
        <Flex justify="between" align="center" mb="2">
          <Flex align="center" gap="3">
            {selectedNode.data.logoUrl && (
              <img src={selectedNode.data.logoUrl} alt="icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            )}
            <Heading size="5" style={{ color: 'var(--gray-12)' }}>{selectedNode.data.label}</Heading>
          </Flex>
          <IconButton variant="ghost" color="gray" onClick={onClose} style={{ cursor: 'pointer' }}>
            <Text size="4" weight="bold">✕</Text>
          </IconButton>
        </Flex>
        
        <Box style={{ height: '1px', backgroundColor: 'var(--gray-4)', width: '100%' }} />

        {selectedNode.data.details ? (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" color="gray" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resource Type</Text>
              <Text as="div" size="3" mt="1">{selectedNode.type === 'cloudNode' ? 'Cloud Service' : selectedNode.type}</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>IP / Endpoint</Text>
              <Text as="div" size="3" mt="1" style={{ fontFamily: 'monospace', backgroundColor: 'var(--gray-2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                {selectedNode.data.details.ip}
              </Text>
            </Box>

            <Box>
              <Text size="2" color="gray" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Status</Text>
              <Text as="div" size="3" mt="1">{selectedNode.data.details.status}</Text>
            </Box>

            <Box>
              <Text size="2" color="gray" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Risk Level</Text>
              <Box mt="2">
                <Badge size="2" color={selectedNode.data.details.risk.includes('Critical') ? 'red' : selectedNode.data.details.risk.includes('High') ? 'orange' : 'green'} variant="soft">
                  {selectedNode.data.details.risk}
                </Badge>
              </Box>
            </Box>

            {selectedNode.data.details.description && (
              <Card style={{ backgroundColor: selectedNode.data.isFailed ? 'var(--red-2)' : 'var(--gray-2)', border: selectedNode.data.isFailed ? '1px solid var(--red-5)' : 'none' }}>
                <Flex gap="2" align="start">
                  {selectedNode.data.isFailed && <Text style={{ fontSize: '18px' }}>⚠️</Text>}
                  <Text size="2" style={{ fontStyle: 'italic', color: selectedNode.data.isFailed ? 'var(--red-11)' : 'var(--gray-11)', lineHeight: '1.5' }}>
                    {selectedNode.data.details.description}
                  </Text>
                </Flex>
              </Card>
            )}
            
            <Box style={{ height: '1px', backgroundColor: 'var(--gray-4)', width: '100%', marginTop: '10px' }} />

            <Flex direction="column" gap="2" mt="2">
              <Button variant="solid" color="blue" size="3" style={{ cursor: 'pointer', width: '100%' }}>View Full Logs & Metrics</Button>
              <Button variant="outline" color="gray" size="3" style={{ cursor: 'pointer', width: '100%' }}>Run Security Scan</Button>
            </Flex>

          </Flex>
        ) : (
          <Text color="gray" style={{ fontStyle: 'italic' }}>No detailed metrics available for this node.</Text>
        )}
      </Flex>
    </Box>
  );
}
