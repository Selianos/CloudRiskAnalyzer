import { useState } from 'react';
import { Flex, Box, Card, Heading, Text, Button, TextField, Select, RadioCards, Badge, Checkbox, TextArea } from '@radix-ui/themes';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci.png';
import gcpLogo from '../assets/providers/gcp.png';

export default function CreateScanPage() {
  const [provider, setProvider] = useState('aws');
  const [scanType, setScanType] = useState('simple');
  const [scanName, setScanName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Heading size="6" mb="2">Create New Scan</Heading>
        <Text color="gray" mb="6" as="div">Configure a new cloud environment security scan.</Text>

        <Card size="4">
          <Flex direction="column" gap="5">
            
            {/* 1. Cloud Provider */}
            <Box>
              <Text as="div" size="3" weight="bold" mb="3">1. Cloud Provider</Text>
              <RadioCards.Root value={provider} onValueChange={setProvider} columns={{ initial: '1', sm: '3' }}>
                <RadioCards.Item value="aws" style={{ cursor: 'pointer', height: '100px' }}>
                  <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <img src={awsLogo} alt="AWS" style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="oci" style={{ cursor: 'pointer', height: '100px' }}>
                  <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <img src={ociLogo} alt="OCI" style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="gcp" style={{ cursor: 'pointer', height: '100px', position: 'relative' }}>
                  <Badge color="amber" variant="solid" size="1" style={{ position: 'absolute', top: 8, right: 8 }}>Beta</Badge>
                  <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <img src={gcpLogo} alt="GCP" style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                  </Flex>
                </RadioCards.Item>
              </RadioCards.Root>
            </Box>

            {/* 2. Scan Type */}
            <Box>
              <Text as="div" size="3" weight="bold" mb="3">2. Scan Type</Text>
              <RadioCards.Root value={scanType} onValueChange={(val) => { if(val === 'simple') setScanType(val) }} columns={{ initial: '1', sm: '2' }}>
                <RadioCards.Item value="simple" style={{ cursor: 'pointer' }}>
                  <Flex direction="column" gap="1">
                    <Text weight="bold">Simple Scan</Text>
                    <Text size="2" color="gray">Standard security baseline checks.</Text>
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="advanced" disabled style={{ opacity: 0.6 }}>
                  <Flex direction="column" gap="1">
                    <Flex justify="between" align="center">
                      <Text weight="bold">Advanced Scan</Text>
                      <Badge color="gray">Coming Soon</Badge>
                    </Flex>
                    <Text size="2" color="gray">Deep compliance & vulnerability analysis.</Text>
                  </Flex>
                </RadioCards.Item>
              </RadioCards.Root>
            </Box>

            {/* 3. Scan Name */}
            <Box>
              <Text as="div" size="3" weight="bold" mb="2">3. Scan Name</Text>
              <TextField.Root placeholder="e.g. Production Network Weekly Audit" value={scanName} onChange={(e) => setScanName(e.target.value)} />
            </Box>

            {/* 4. Provider Credentials */}
            <Box>
              <Text as="div" size="3" weight="bold" mb="3">4. {provider.toUpperCase()} Credentials</Text>
              <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
                {provider === 'aws' && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">AWS Access Key ID</Text>
                      <TextField.Root placeholder="AKIA..." />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">AWS Secret Access Key</Text>
                      <TextField.Root type="password" placeholder="••••••••••••••••" />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Default Region (Optional)</Text>
                      <TextField.Root placeholder="us-east-1" />
                    </Box>
                  </Flex>
                )}

                {provider === 'oci' && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Tenancy OCID</Text>
                      <TextField.Root placeholder="ocid1.tenancy.oc1..." />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">User OCID</Text>
                      <TextField.Root placeholder="ocid1.user.oc1..." />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Fingerprint</Text>
                      <TextField.Root placeholder="00:11:22:33:44:55:66:77..." />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Private Key (PEM format)</Text>
                      <TextArea placeholder="-----BEGIN PRIVATE KEY-----..." resize="vertical" rows={4} />
                    </Box>
                  </Flex>
                )}

                {provider === 'gcp' && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Service Account JSON</Text>
                      <TextArea placeholder='{"type": "service_account", "project_id": "..."}' resize="vertical" rows={5} />
                    </Box>
                    <Text size="1" color="amber">Note: GCP Scanning is currently in Beta. Some resources may not be fully mapped.</Text>
                  </Flex>
                )}
              </Card>
            </Box>

            {/* 5. Advanced Settings */}
            <Box>
              <Flex align="center" gap="2" mb="3">
                <Checkbox checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                <Text size="2" weight="medium" style={{ cursor: 'pointer' }} onClick={() => setShowAdvanced(!showAdvanced)}>Show Advanced Settings</Text>
              </Flex>
              
              {showAdvanced && (
                <Card variant="surface" style={{ backgroundColor: 'var(--gray-2)' }}>
                  <Flex direction="column" gap="3" style={{ opacity: 0.6 }}>
                    <Flex justify="between" align="center">
                      <Text weight="bold">Advanced Settings</Text>
                      <Badge color="gray">Coming Soon</Badge>
                    </Flex>
                    <Text size="2">Custom IAM role assumption, cross-account scanning, and specific compliance framework targeting (CIS, HIPAA, etc.) are currently disabled while in development.</Text>
                    
                    <Box mt="2">
                      <Text as="div" size="2" mb="1" weight="medium">Assume IAM Role ARN</Text>
                      <TextField.Root disabled placeholder="arn:aws:iam::123456789012:role/SecurityAudit" />
                    </Box>
                  </Flex>
                </Card>
              )}
            </Box>

            {/* Actions */}
            <Box mt="2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button variant="soft" color="gray" size="3" style={{ cursor: 'pointer' }}>Save Connection Only</Button>
                <Button variant="solid" size="3" style={{ cursor: 'pointer' }}>Save & Start Scan</Button>
              </div>
            </Box>

          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
