import React from 'react';
import { Box, Flex, Heading, Text, Container } from '@radix-ui/themes';
import awsLogo from '../../assets/providers/aws.png';
import gcpLogo from '../../assets/providers/gcp.png';
import ociLogo from '../../assets/providers/oci.png';

const providers = [
    { name: 'AWS', logo: awsLogo },
    { name: 'GCP', logo: gcpLogo },
    { name: 'OCI', logo: ociLogo },
];

export default function ProvidersSection() {
    return (
        <Box style={{ padding: '80px 0' }}>
            <Container size="3">
                <Heading size={{ initial: '6', sm: '7' }} align="center" mb="3">Supported Providers</Heading>
                <Text align="center" size="3" style={{ color: 'var(--gray-10)', display: 'block', marginBottom: '48px' }}>
                    One platform. Every major cloud.
                </Text>

                {/* Desktop: one row with dividers */}
                <Flex justify="center" align="center" gap="0" display={{ initial: 'none', sm: 'flex' }}>
                    {providers.map((p, i) => (
                        <React.Fragment key={p.name}>
                            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 48px', height: '80px' }}>
                                <img src={p.logo} alt={p.name} style={{ height: '44px', width: 'auto', objectFit: 'contain', opacity: 0.85 }} />
                            </Box>
                            {i < providers.length - 1 && (
                                <Box style={{ width: '1px', height: '44px', backgroundColor: 'var(--gray-5)', flexShrink: 0 }} />
                            )}
                        </React.Fragment>
                    ))}
                </Flex>

                {/* Mobile: one per row, full width */}
                <Flex direction="column" gap="0" display={{ initial: 'flex', sm: 'none' }}>
                    {providers.map((p, i) => (
                        <Box
                            key={p.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '24px 0',
                                width: '100%',
                                borderTop: '1px solid var(--gray-4)',
                                borderBottom: i === providers.length - 1 ? '1px solid var(--gray-4)' : 'none',
                            }}
                        >
                            <img src={p.logo} alt={p.name} style={{ height: '40px', width: 'auto', objectFit: 'contain', opacity: 0.85 }} />
                        </Box>
                    ))}
                </Flex>
            </Container>
        </Box>
    );
}
