import React from 'react';
import { Box, Flex, Heading, Text, Container, Card } from '@radix-ui/themes';

const Arrow = () => (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-9)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    </Box>
);

export default function AboutSection() {
    return (
        <Box style={{ paddingTop: '35vh', paddingBottom: '100px', backgroundColor: 'var(--gray-2)' }}>
            <Container size="4">
                <Heading size="7" align="center" mb="8">How It Works</Heading>
                <Flex align="center" justify="center" gap="4" wrap="wrap" direction={{ initial: 'column', md: 'row' }}>
                    <Card size="3" style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: 'var(--space-6)' }}>
                        <Heading size="5" mb="2">1. Create Connection</Heading>
                        <Text color="gray">Link your cloud environments securely and easily.</Text>
                    </Card>
                    <Box display={{ initial: 'none', md: 'block' }}>
                        <Arrow />
                    </Box>
                    <Card size="3" style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: 'var(--space-6)' }}>
                        <Heading size="5" mb="2">2. Scan</Heading>
                        <Text color="gray">Automatically detect misconfigurations and risks.</Text>
                    </Card>
                    <Box display={{ initial: 'none', md: 'block' }}>
                        <Arrow />
                    </Box>
                    <Card size="3" style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: 'var(--space-6)' }}>
                        <Heading size="5" mb="2">3. Fix</Heading>
                        <Text color="gray">Apply remediation steps instantly and safely.</Text>
                    </Card>
                </Flex>
            </Container>
        </Box>
    );
}
