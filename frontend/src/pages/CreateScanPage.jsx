import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Flex, Box, Card, Heading, Text, Button, TextField, RadioCards, Badge, TextArea, Callout, Spinner } from '@radix-ui/themes';
import { ArrowLeft, Info } from 'lucide-react';
import { createConnection } from '../api/connection';
import { createScan } from '../api/scan';

import awsLogo from '../assets/providers/aws.png';
import ociLogo from '../assets/providers/oci.png';
import gcpLogo from '../assets/providers/gcp.png';

export default function CreateScanPage() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const refreshScans = context?.refreshScans;
  const [provider, setProvider] = useState('aws');
  const [scanType, setScanType] = useState('simple');
  const [scanName, setScanName] = useState('');


  // AWS credentials state
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('');

  // OCI credentials state
  const [ociTenancyOcid, setOciTenancyOcid] = useState('');
  const [ociUserOcid, setOciUserOcid] = useState('');
  const [ociFingerprint, setOciFingerprint] = useState('');
  const [ociPrivateKey, setOciPrivateKey] = useState('');
  const [ociRegion, setOciRegion] = useState('');

  // GCP credentials state
  const [gcpServiceAccountJson, setGcpServiceAccountJson] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (startScanAfterSave) => {
    if (!scanName.trim()) {
      setError('Please provide a scan / connection name.');
      return;
    }

    let credentials = {};
    if (provider === 'aws') {
      if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim()) {
        setError('AWS Access Key ID and Secret Access Key are required.');
        return;
      }
      credentials = {
        aws_access_key_id: awsAccessKeyId.trim(),
        aws_secret_access_key: awsSecretAccessKey.trim(),
        aws_region: awsRegion.trim() || 'us-east-1'
      };
    } else if (provider === 'oci') {
      if (!ociTenancyOcid.trim() || !ociUserOcid.trim() || !ociFingerprint.trim() || !ociPrivateKey.trim()) {
        setError('All OCI credential fields (except Region) are required.');
        return;
      }
      credentials = {
        tenancy: ociTenancyOcid.trim(),
        user: ociUserOcid.trim(),
        fingerprint: ociFingerprint.trim(),
        key_file: ociPrivateKey.trim(),
        region: ociRegion.trim() || 'us-ashburn-1'
      };
    } else if (provider === 'gcp') {
      if (!gcpServiceAccountJson.trim()) {
        setError('GCP Service Account JSON is required.');
        return;
      }
      try {
        credentials = JSON.parse(gcpServiceAccountJson.trim());
      } catch (err) {
        setError('GCP Service Account credentials must be valid JSON format.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create the cloud connection
      const connection = await createConnection({
        name: scanName.trim(),
        provider: provider,
        credentials
      });

      // 2. Trigger the scan if requested
      if (startScanAfterSave) {
        await createScan({ connection_id: connection.id });
        // Refresh the scan list in the layout and go to workspace
        if (refreshScans) refreshScans();
        navigate('/app');
      } else {
        navigate('/app/connections');
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.message || 'An error occurred while saving the connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Flex align="center" gap="2" mb="4">
          <Button variant="ghost" color="gray" onClick={() => navigate('/app/connections')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back to Scans
          </Button>
        </Flex>

        <Heading size="6" mb="2">Create New Scan</Heading>
        <Text color="gray" mb="6" as="div">Configure a new cloud environment security scan.</Text>

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

                {provider === 'oci' && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Tenancy OCID</Text>
                      <TextField.Root placeholder="ocid1.tenancy.oc1..." value={ociTenancyOcid} onChange={(e) => setOciTenancyOcid(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">User OCID</Text>
                      <TextField.Root placeholder="ocid1.user.oc1..." value={ociUserOcid} onChange={(e) => setOciUserOcid(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Fingerprint</Text>
                      <TextField.Root placeholder="00:11:22:33:44:55:66:77..." value={ociFingerprint} onChange={(e) => setOciFingerprint(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Private Key (PEM format)</Text>
                      <TextArea placeholder="-----BEGIN PRIVATE KEY-----..." resize="vertical" rows={4} value={ociPrivateKey} onChange={(e) => setOciPrivateKey(e.target.value)} />
                    </Box>
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Region (Optional)</Text>
                      <TextField.Root placeholder="us-ashburn-1" value={ociRegion} onChange={(e) => setOciRegion(e.target.value)} />
                    </Box>
                  </Flex>
                )}

                {provider === 'gcp' && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="div" size="2" mb="1" weight="medium">Service Account JSON</Text>
                      <TextArea placeholder='{"type": "service_account", "project_id": "..."}' resize="vertical" rows={5} value={gcpServiceAccountJson} onChange={(e) => setGcpServiceAccountJson(e.target.value)} />
                    </Box>
                    <Text size="1" color="amber">Note: GCP Scanning is currently in Beta. Some resources may not be fully mapped.</Text>
                  </Flex>
                )}
              </Card>
            </Box>



            {/* Actions */}
            <Box mt="2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button 
                  variant="soft" 
                  color="gray" 
                  size="3" 
                  disabled={loading}
                  onClick={() => handleSubmit(false)} 
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? <Spinner size="1" /> : 'Save Connection Only'}
                </Button>
                <Button 
                  variant="solid" 
                  size="3" 
                  disabled={loading}
                  onClick={() => handleSubmit(true)} 
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? <Spinner size="1" /> : 'Save & Start Scan'}
                </Button>
              </div>
              <Flex justify="center" mt="4">
                <Button variant="ghost" color="gray" onClick={() => navigate('/demo')} style={{ cursor: 'pointer' }}>
                  Or try a Mock Demo Scan
                </Button>
              </Flex>
            </Box>

          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
