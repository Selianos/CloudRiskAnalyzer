import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Container, Link } from '@radix-ui/themes';

const faqs = [
    {
        q: 'How do you decide what is a vulnerability and what the fix should be?',
        a: <>
            Every finding is evaluated against the <Link href="https://nca.gov.sa/en/regulatory-documents/controls-list/ccc/" target="_blank" rel="noreferrer" weight="bold">Cloud Cybersecurity Controls (CCC) framework by the Saudi National Cybersecurity Authority (NCA)</Link>. Each control defines a clear risk threshold and a precise remediation path, so nothing is ambiguous — if your infrastructure violates a control, we flag it and tell you exactly how to fix it.
        </>
    },
    {
        q: 'Which cloud providers do you support?',
        a: 'We currently support Amazon Web Services (AWS), Google Cloud Platform (GCP), and Oracle Cloud Infrastructure (OCI), with more providers on the roadmap.'
    },
    {
        q: 'Do you store my cloud credentials?',
        a: 'Yes — your credentials are stored securely using industry-standard encryption at rest and in transit. We treat them with the same care as a bank treats your PIN. You can revoke access at any time from your settings.'
    },
    {
        q: 'How long does a scan take?',
        a: 'Most scans complete in under 30 seconds. As your infrastructure grows, scan time increases proportionally to ensure a deeper and more accurate analysis of every resource — no shortcuts, no sampling.'
    },
    {
        q: 'Can I run scans automatically on a schedule?',
        a: 'Yes. You can configure periodic scans to run daily, weekly, or after any detected change in your cloud environment, and receive instant alerts via Email or Webhook.'
    },
];

export default function FaqSection() {
    const [open, setOpen] = useState(0);

    return (
        <Box style={{ padding: '80px 0', backgroundColor: '#ffffff' }}>
            <Container size="3" px={{ initial: '4', sm: '6' }}>
                <Heading size={{ initial: '6', sm: '7' }} mb="2">Frequently Asked Questions</Heading>
                <Text size="3" style={{ color: 'var(--gray-10)', display: 'block', marginBottom: '40px' }}>
                    Everything you need to know before you start.
                </Text>

                <Flex direction="column" gap="0">
                    {faqs.map((faq, i) => (
                        <Box
                            key={i}
                            style={{
                                borderTop: '1px solid var(--gray-4)',
                                borderBottom: i === faqs.length - 1 ? '1px solid var(--gray-4)' : 'none',
                            }}
                        >
                            <Flex
                                align="center"
                                justify="between"
                                style={{ padding: '20px 0', cursor: 'pointer', userSelect: 'none', gap: '16px' }}
                                onClick={() => setOpen(open === i ? null : i)}
                            >
                                <Text size={{ initial: '2', sm: '3' }} weight="medium" style={{ color: 'var(--gray-12)', flex: 1 }}>
                                    {faq.q}
                                </Text>
                                <Box style={{
                                    width: '24px',
                                    height: '24px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.25s ease',
                                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </Box>
                            </Flex>

                            <Box style={{
                                overflow: 'hidden',
                                maxHeight: open === i ? '400px' : '0',
                                transition: 'max-height 0.35s ease',
                            }}>
                                <Text size={{ initial: '2', sm: '3' }} style={{ color: 'var(--gray-11)', lineHeight: 1.7, display: 'block', paddingBottom: '20px' }}>
                                    {faq.a}
                                </Text>
                            </Box>
                        </Box>
                    ))}
                </Flex>
            </Container>
        </Box>
    );
}
