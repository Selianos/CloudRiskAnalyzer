import React from 'react';
import { Box, Flex, Heading, Container } from '@radix-ui/themes';

export default function ProvidersSection() {
    return (
        <Box style={{ padding: '100px 0' }}>
            <Container size="3">
                <Heading size="7" align="center" mb="8">Supported Providers</Heading>
                <Flex justify="center" align="center" gap="9" wrap="wrap">
                    <Heading size="8" style={{ color: 'var(--gray-8)', letterSpacing: '-0.05em' }}>AWS</Heading>
                    <Heading size="8" style={{ color: 'var(--gray-8)', letterSpacing: '-0.05em' }}>GCP</Heading>
                    <Heading size="8" style={{ color: 'var(--gray-8)', letterSpacing: '-0.05em' }}>OCI</Heading>
                </Flex>
            </Container>
        </Box>
    );
}
