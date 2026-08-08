import React from 'react';
import { Box, Flex, Heading, Text, Container, Button } from '@radix-ui/themes';
import { useNavigate } from 'react-router';
import Marquee from '../components/Marquee';

// Sponsor Logos
import kaustLogo from '../assets/sponsors/kaust.png';
import ncaLogo from '../assets/sponsors/nca.png';
import siteLogo from '../assets/sponsors/site.png';
import uofgLogo from '../assets/sponsors/uofg.png';
import kkuLogo from '../assets/sponsors/kku.png';
import kaustAcademyLogo from '../assets/sponsors/kaust-academy.png';

// Create an array of 12 sponsors to make the marquee look full and less repetitive
const BASE_SPONSORS = [kaustLogo, ncaLogo, siteLogo, uofgLogo, kkuLogo, kaustAcademyLogo];
const SPONSORS = [...BASE_SPONSORS, ...BASE_SPONSORS, ...BASE_SPONSORS];

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

            {/* Trusted By Section (Using Reusable Marquee Component) */}
            <Box style={{ borderTop: '1px solid var(--gray-4)', padding: '60px 0', backgroundColor: 'var(--gray-2)' }}>
                <Text size="2" color="gray" weight="medium" align="center" mb="6" style={{ textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>
                    PROUDLY SUPPORTED BY OUR SPONSORS
                </Text>

                {/* Shortened Width using Container */}
                <Container size="3">
                    <Box className="faded-edges">
                        <Marquee pauseOnHover={true} repeat={6} duration="15s" gap="4rem">
                            {SPONSORS.map((logo, i) => (
                                <img
                                    key={`sponsor-${i}`}
                                    src={logo}
                                    alt="Sponsor Logo"
                                    className="sponsor-item"
                                />
                            ))}
                        </Marquee>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}