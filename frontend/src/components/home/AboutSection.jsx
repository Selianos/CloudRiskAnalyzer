import React from 'react';
import { Box, Flex, Heading, Text, Container } from '@radix-ui/themes';

const steps = [
    { id: 1, title: 'Create', desc: 'Connect your AWS, GCP, or OCI cloud account in seconds.' },
    { id: 2, title: 'Scan', desc: 'We scan every resource against NCA CCC rules and flag what is at risk.' },
    { id: 3, title: 'Fix', desc: 'Follow clear, step-by-step remediation guidance to close every gap.' },
];

export default function AboutSection() {
    return (
        <Box style={{ paddingTop: '100px', paddingBottom: '100px', backgroundColor: 'var(--gray-2)' }}>
            <Container size="4">
                <Heading size="7" align="center" mb="8">How It Works</Heading>
                <Box style={{ backgroundColor: '#f5f0e8', padding: '40px', border: '3px solid #000' }}>
                    <Flex direction="column" gap="0">
                        {steps.map((step, idx) => (
                            <Box
                                key={step.id}
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: '3px solid #000',
                                    borderBottom: idx < steps.length - 1 ? 'none' : '3px solid #000',
                                    padding: '32px 40px',
                                    position: 'relative',
                                }}
                            >
                                {/* Offset hard shadow block */}
                                <Box style={{
                                    position: 'absolute',
                                    top: '6px',
                                    left: '6px',
                                    right: '-6px',
                                    bottom: '-6px',
                                    backgroundColor: '#000',
                                    zIndex: -1,
                                }} />

                                <Flex align="flex-start" gap="6">
                                    <Text 
                                        className="text-[48px] md:text-[80px]"
                                        style={{
                                        fontWeight: '900',
                                        lineHeight: 1,
                                        color: '#000',
                                        flexShrink: 0,
                                        fontFamily: 'monospace',
                                        opacity: 0.1,
                                        userSelect: 'none',
                                    }}>
                                        {String(step.id).padStart(2, '0')}
                                    </Text>

                                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                                        <Text size="1" weight="bold" style={{
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            color: '#000',
                                            opacity: 0.45,
                                        }}>
                                            Step {step.id}
                                        </Text>
                                        <Heading size="7" style={{
                                            color: '#000',
                                            fontWeight: '900',
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1.1,
                                        }}>
                                            {step.title}
                                        </Heading>
                                        <Text size="3" style={{ color: '#000', opacity: 0.65, lineHeight: 1.6, marginTop: '6px' }}>
                                            {step.desc}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </Flex>
                </Box>
            </Container>
        </Box>
    );
}
