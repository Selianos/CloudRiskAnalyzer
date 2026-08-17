import React from 'react';
import { Box, Flex, Heading, Text, Container } from '@radix-ui/themes';
import { Link } from 'react-router';

export default function Footer() {
    return (
        <Box style={{ padding: '60px 0 40px', borderTop: '1px solid var(--gray-5)' }}>
            <Container size="4" px={{ initial: '4', sm: '6' }}>
                <Flex
                    justify="between"
                    align="start"
                    wrap="wrap"
                    gap="6"
                    direction={{ initial: 'column', sm: 'row' }}
                >
                    <Box style={{ maxWidth: '280px' }}>
                        <Heading size="6" mb="2">Sahaba</Heading>
                        <Text color="gray" size="2" style={{ display: 'block', lineHeight: 1.6 }}>
                            Advanced Cloud Risk Analyzer for modern infrastructure.
                        </Text>
                    </Box>
                    <Flex gap="8" wrap="wrap">
                        <Flex direction="column" gap="3">
                            <Heading size="3" mb="1" color="gray">Platform</Heading>
                            <Link to="/login" style={{ color: 'var(--gray-11)', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
                            <Link to="/signup" style={{ color: 'var(--gray-11)', textDecoration: 'none', fontSize: '14px' }}>Create Account</Link>
                            <Link to="/demo" style={{ color: 'var(--gray-11)', textDecoration: 'none', fontSize: '14px' }}>Demo</Link>
                        </Flex>
                    </Flex>
                </Flex>
                <Flex justify={{ initial: 'center', sm: 'end' }} align="center" mt="8" pt="4" style={{ borderTop: '1px solid var(--gray-5)' }}>
                    <Text size="2" color="gray">© {new Date().getFullYear()} Sahaba. All rights reserved.</Text>
                </Flex>
            </Container>
        </Box>
    );
}
