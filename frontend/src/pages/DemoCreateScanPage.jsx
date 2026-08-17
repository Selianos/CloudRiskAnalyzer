import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Flex, Box, Card, Heading, Text, Button, TextField, RadioCards, Badge, TextArea, Callout, Spinner } from '@radix-ui/themes';
import { ArrowLeft, Info } from 'lucide-react';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci.png';
import gcpLogo from '../assets/providers/gcp.png';

export default function DemoCreateScanPage() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState('aws');
  const [scanType, setScanType] = useState('simple');
  const [scanName, setScanName] = useState('AWS Demo Scan');

  // AWS credentials state
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('AKIAIOSFODNN7EXAMPLE');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  const [awsRegion, setAwsRegion] = useState('us-east-1');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (startScanAfterSave) => {
    if (!scanName.trim()) {
      setError('Please provide a scan / connection name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock creating the connection and starting the scan
      setTimeout(() => {
        if (startScanAfterSave) {
          navigate('/demo/results');
        } else {
          navigate('/demo/results');
        }
      }, 1500);

    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.message || 'An error occurred while saving the connection.');
    }
  };

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Flex align="center" gap="2" mb="4">
          <Button variant="ghost" color="gray" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </Flex>

        <Heading size="6" mb="2">Create Demo Scan</Heading>
        <Text color="gray" mb="6" as="div">Configure a mock cloud environment security scan.</Text>

        {error && (
          <Callout.Root color="red" role="alert" mb="4">
            <Callout.Icon>
              <Info size={16} />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Card size="4">
          <Flex direction="column" gap="5">
            
            {/* 1. Cloud Provider */}
            <Box>
              <Text as="div" size="3" weight="bold" mb="3">1. Cloud Provider</Text>
              <RadioCards.Root value={provider} onValueChange={(val) => { setProvider(val); setError(null); }} columns={{ initial: '1', sm: '3' }}>
                <RadioCards.Item value="aws" style={{ cursor: 'pointer', height: '100px' }}>
                  <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <img src={awsLogo} alt="AWS" style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="oci" style={{ cursor: 'pointer', height: '100px' }} disabled style={{ opacity: 0.6 }}>
                  <Flex justify="center" align="center" style={{ height: '100%' }}>
                    <img src={ociLogo} alt="OCI" style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="gcp" style={{ cursor: 'pointer', height: '100px', position: 'relative' }} disabled style={{ opacity: 0.6 }}>
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
                    <Text weight="bold">Security Audit</Text>
                    <Text size="2" color="gray">Audits cloud infrastructure configurations and access control policies for security compliance.</Text>
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="advanced" disabled style={{ opacity: 0.6 }}>
                  <Flex direction="column" gap="1">
                    <Flex justify="between" align="center">
                      <Text weight="bold">Advanced Scan</Text>
                      <Badge color="gray">Coming Soon</Badge>
                    </Flex>
                    <Text size="2" color="gray">Runs a deep scan of your entire cloud infrastructure.</Text>
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
                      <TextField.Root placeholder="AKIA..." value={awsAccessKeyId} onChange={(e) => setAwsAccessKeyId(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">AWS Secret Access Key</Text>
                      <TextField.Root type="password" placeholder="••••••••••••••••" value={awsSecretAccessKey} onChange={(e) => setAwsSecretAccessKey(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Default Region (Optional)</Text>
                      <TextField.Root placeholder="us-east-1" value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} />
                    </Box>
                  </Flex>
                )}
              </Card>
            </Box>

            {/* Actions */}
            <Box mt="2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <Button 
                  variant="solid" 
                  size="3" 
                  disabled={loading}
                  onClick={() => handleSubmit(true)} 
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? <Spinner size="1" /> : 'Start Mock Scan'}
                </Button>
              </div>
            </Box>

          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
