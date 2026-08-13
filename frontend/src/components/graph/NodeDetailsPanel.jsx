import { Box, Flex, Heading, IconButton, Text, Badge, Card, ScrollArea, Code } from '@radix-ui/themes';
import { ShieldAlert, ShieldCheck, Info, MapPin, Tag } from 'lucide-react';

const SEVERITY_COLOR = {
  CRITICAL: 'red',
  HIGH:     'orange',
  MEDIUM:   'amber',
  LOW:      'gray',
  INFO:     'gray',
};

function FindingCard({ finding }) {
  const isFail = finding.status === 'FAIL';
  const severity = finding.rules?.severity || 'INFO';
  const color = SEVERITY_COLOR[severity] || 'gray';

  return (
    <Card
      size="2"
      variant="surface"
      style={{
        backgroundColor: isFail ? `var(--${color}-2)` : 'var(--green-2)',
        borderColor: isFail ? `var(--${color}-6)` : 'var(--green-5)',
        marginBottom: '12px',
      }}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Code color={isFail ? color : 'green'} variant="soft" style={{ fontWeight: 'bold' }}>
            {finding.rule_id || 'UNKNOWN_RULE'}
          </Code>
          <Badge color={isFail ? color : 'green'} size="1" variant="solid" style={{ letterSpacing: '0.5px' }}>
            {isFail ? severity : 'PASS'}
          </Badge>
        </Flex>

        {finding.rules?.name && (
          <Text size="2" weight="bold" style={{ color: `var(--${color}-11)` }}>
            {finding.rules.name}
          </Text>
        )}

        <Text size="1" color="gray" style={{ lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {finding.rules?.description}
        </Text>

        {isFail && finding.rules?.recommendation && (
          <Box mt="2">
            <Text size="1" style={{ color: 'var(--gray-11)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--green-11)' }}>REMEDIATION:</span> {finding.rules.recommendation}
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

export default function NodeDetailsPanel({ selectedNode, onClose }) {
  if (!selectedNode) return null;

  const data = selectedNode.data;
  const findings = data.findings || [];
  const failFindings = findings.filter(f => f.status === 'FAIL');
  const passFindings = findings.filter(f => f.status === 'PASS');

  // Determine panel accent color
  const hasCritical = failFindings.some(f => f.rules?.severity === 'CRITICAL');
  const hasHigh = failFindings.some(f => f.rules?.severity === 'HIGH');
  const accentColor = hasCritical ? '#ef4444' : hasHigh ? '#f97316' : failFindings.length > 0 ? '#f59e0b' : '#10b981';

  return (
    <Box
      style={{
        width: '400px',
        backgroundColor: 'white',
        borderLeft: '1px solid var(--gray-4)',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
        overflowY: 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header stripe */}
      <Box style={{ height: '4px', backgroundColor: accentColor, flexShrink: 0 }} />

      <Flex direction="column" p="4" gap="4" style={{ flexGrow: 1, overflow: 'hidden' }}>

        {/* Node title row */}
        <Flex justify="between" align="start">
          <Flex align="center" gap="3">
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt="icon"
                style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <Box>
              <Heading size="4" style={{ color: 'var(--gray-12)', lineHeight: 1.2 }}>{data.label}</Heading>
              {data.resourceType && (
                <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{data.resourceType}</Text>
              )}
            </Box>
          </Flex>
          <IconButton variant="ghost" color="gray" onClick={onClose} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Text size="3" weight="bold">✕</Text>
          </IconButton>
        </Flex>

        <Box style={{ height: '1px', backgroundColor: 'var(--gray-4)' }} />

        {/* Meta info */}
        <Flex direction="column" gap="2">
          {data.region && (
            <Flex align="start" gap="2">
              <MapPin size={13} color="var(--gray-9)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text size="2" color="gray" style={{ flexShrink: 0, width: '90px' }}>Region:</Text>
              <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{data.region}</Text>
            </Flex>
          )}
          {data.providerResourceId && (
            <Flex align="start" gap="2">
              <Tag size={13} color="var(--gray-9)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text size="2" color="gray" style={{ flexShrink: 0, width: '90px' }}>Resource ID:</Text>
              <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{data.providerResourceId}</Text>
            </Flex>
          )}
          {data.details?.ip && (
            <Flex align="start" gap="2">
              <Info size={13} color="var(--gray-9)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text size="2" color="gray" style={{ flexShrink: 0, width: '90px' }}>IP / Endpoint:</Text>
              <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{data.details.ip}</Text>
            </Flex>
          )}
        </Flex>

        {/* Summary badges */}
        <Flex gap="2" wrap="wrap">
          {failFindings.length > 0 ? (
            <>
              {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => {
                const cnt = failFindings.filter(f => f.rules?.severity === sev).length;
                if (!cnt) return null;
                return (
                  <Badge key={sev} color={SEVERITY_COLOR[sev]} size="2" variant="soft">
                    {cnt} {sev}
                  </Badge>
                );
              })}
            </>
          ) : (
            <Badge color="green" size="2" variant="soft">✓ All checks passed</Badge>
          )}
          {passFindings.length > 0 && (
            <Badge color="green" size="2" variant="outline">{passFindings.length} passed</Badge>
          )}
        </Flex>

        <Box style={{ height: '1px', backgroundColor: 'var(--gray-4)' }} />

        {/* Findings list */}
        <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
          <Text size="2" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
            Findings ({findings.length})
          </Text>
          <ScrollArea style={{ maxHeight: '700px' }}>
            {findings.length === 0 ? (
              <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>No findings recorded.</Text>
            ) : (
              // Show FAIL findings first, then PASS
              [...failFindings, ...passFindings].map(finding => (
                <FindingCard key={finding.id} finding={finding} />
              ))
            )}
          </ScrollArea>
        </Box>
      </Flex>
    </Box>
  );
}
