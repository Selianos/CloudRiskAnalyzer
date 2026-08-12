import React from 'react';
import { Box, Flex, Heading, Text, Container } from '@radix-ui/themes';
import { Link } from 'react-router';

export default function Footer() {
    return (
        <Box style={{ padding: '60px 0 40px', borderTop: '1px solid var(--gray-5)' }}>
            <Container size="4">
                <Flex justify="between" align="start" wrap="wrap" gap="6">
                    <Box>
                        <Heading size="6" mb="2">Sahaba</Heading>
                        <Text color="gray" size="2" style={{ maxWidth: '250px', display: 'block' }}>
                            Advanced Cloud Risk Analyzer for modern infrastructure.
                        </Text>
                    </Box>
                    <Flex gap="8" wrap="wrap">
                        <Flex direction="column" gap="3">
                            <Heading size="3" mb="1" color="gray">Platform</Heading>
                            <Link to="/login" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>Login</Link>
                            <Link to="/signup" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>Create Account</Link>
                        </Flex>
                        <Flex direction="column" gap="3">
                            <Heading size="3" mb="1" color="gray">Resources</Heading>
                            <Link to="#" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>FAQ</Link>
                            <Link to="#" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>How it works</Link>
                        </Flex>
                        <Flex direction="column" gap="3">
                            <Heading size="3" mb="1" color="gray">Legal</Heading>
                            <Link to="#" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>Privacy Policy</Link>
                            <Link to="#" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>Terms & Conditions</Link>
                        </Flex>
                    </Flex>
                </Flex>
                <Flex justify="end" align="center" mt="8" pt="4" style={{ borderTop: '1px solid var(--gray-5)' }}>
                    <Text size="2" color="gray">© {new Date().getFullYear()} Sahaba. All rights reserved.</Text>
                </Flex>
            </Container>
        </Box>
    );
}
