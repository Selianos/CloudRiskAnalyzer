import React from 'react';
import { Box, Flex, Heading, Text, Container, Button } from '@radix-ui/themes';
import { useNavigate } from 'react-router';
import SponsorsSection from '../components/home/SponsorsSection';

export default function Home() {
    const navigate = useNavigate();

    return (
        <Box>
            {/* Hero Section */}
            <Container size="3" p="6" style={{ textAlign: 'center', marginTop: '80px', marginBottom: '80px' }}>
                <Heading size="9" mb="4" weight="bold">
                    Secure Your Cloud Infrastructure with <span style={{ color: 'var(--accent-9)' }}>Sahaba</span>
                </Heading>
                <Text size="5" color="gray" mb="6" style={{ maxWidth: '600px', margin: '0 auto', display: 'block', lineHeight: '1.6' }}>
                    Automatically discover misconfigurations, evaluate security rules, and protect your AWS, GCP, and Oracle Cloud environments from critical vulnerabilities.
                </Text>
                <Flex gap="4" justify="center">
                    <Button size="4" onClick={() => navigate('/signup')}>Get Started Free</Button>
                    <Button size="4" variant="soft" onClick={() => navigate('/login')}>Sign In</Button>
                </Flex>
            </Container>

            {/* Trusted By Section */}
            <SponsorsSection />
        </Box>
    );
}