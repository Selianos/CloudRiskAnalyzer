import React from 'react';
import { Box, Container, Heading, Text, Flex, Grid, Card, Badge, Section } from '@radix-ui/themes';
import { Link, Scan, Wrench, Terminal as TerminalIcon, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Create Connection',
    desc: 'Link your cloud environments securely and easily.',
    icon: Link,
    color: 'var(--blue-9)',
    bg: 'var(--blue-3)',
  },
  {
    id: 2,
    title: 'Scan',
    desc: 'Automatically detect misconfigurations and risks.',
    icon: Scan,
    color: 'var(--orange-9)',
    bg: 'var(--orange-3)',
  },
  {
    id: 3,
    title: 'Fix',
    desc: 'Apply remediation steps instantly and safely.',
    icon: Wrench,
    color: 'var(--green-9)',
    bg: 'var(--green-3)',
  }
];

const SectionHeader = ({ title, description }) => (
  <Box mb="6" style={{ textAlign: 'center' }}>
    <Badge size="2" color="blue" radius="full" mb="3">Style Gallery</Badge>
    <Heading size="8" mb="2">{title}</Heading>
    <Text size="4" color="gray">{description}</Text>
  </Box>
);

// 1. Classic Zig Zag
const StyleZigZag = () => (
  <Box>
    {steps.map((step, idx) => {
      const isEven = idx % 2 === 0;
      return (
        <Flex key={step.id} direction={{ initial: 'column', md: isEven ? 'row' : 'row-reverse' }} align="center" gap="8" mb="8">
          <Box style={{ flex: 1, textAlign: isEven ? 'left' : 'right' }}>
            <Badge size="3" radius="full" mb="4" color="gray">Step {step.id}</Badge>
            <Heading size="7" mb="3">{step.title}</Heading>
            <Text size="5" color="gray">{step.desc}</Text>
          </Box>
          <Box style={{ flex: 1, width: '100%' }}>
            <Flex align="center" justify="center" style={{ aspectRatio: '4/3', backgroundColor: step.bg, borderRadius: 'var(--radius-4)' }}>
              <step.icon size={80} color={step.color} />
            </Flex>
          </Box>
        </Flex>
      );
    })}
  </Box>
);

// 2. Vertical Timeline
const StyleTimeline = () => (
  <Box style={{ position: 'relative', paddingLeft: '40px', maxWidth: '600px', margin: '0 auto' }}>
    <Box style={{ position: 'absolute', left: '19px', top: '0', bottom: '0', width: '2px', backgroundColor: 'var(--gray-5)' }} />
    <Flex direction="column" gap="8">
      {steps.map((step) => (
        <Box key={step.id} style={{ position: 'relative' }}>
          <Box style={{ position: 'absolute', left: '-40px', top: '24px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)', border: '4px solid var(--color-background)', zIndex: 1 }}>
            <step.icon size={18} color="white" />
          </Box>
          <Card size="3" style={{ backgroundColor: 'var(--gray-2)' }}>
            <Heading size="5" mb="2">{step.title}</Heading>
            <Text size="3" color="gray">{step.desc}</Text>
          </Card>
        </Box>
      ))}
    </Flex>
  </Box>
);

// 3. Bento Grid
const StyleBentoGrid = () => (
  <Grid columns={{ initial: '1', md: '3' }} rows={{ initial: 'auto', md: '2' }} gap="4">
    {steps.map((step, idx) => (
      <Card key={step.id} size="4" style={{
        gridColumn: idx === 0 ? '1 / -1' : 'auto',
        gridRow: idx === 0 ? '1 / 2' : '2 / 3',
        backgroundColor: step.bg,
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: idx === 0 ? '250px' : '200px'
      }}>
        <step.icon size={48} color={step.color} style={{ marginBottom: '24px' }} />
        <Heading size="6" mb="2" style={{ color: step.color }}>{step.title}</Heading>
        <Text size="4" style={{ color: step.color, opacity: 0.8 }}>{step.desc}</Text>
      </Card>
    ))}
  </Grid>
);

// 4. Glassmorphism
const StyleGlassmorphism = () => (
  <Box style={{ position: 'relative', overflow: 'hidden', padding: '60px 40px', borderRadius: 'var(--radius-5)', background: 'linear-gradient(135deg, var(--blue-3) 0%, var(--plum-3) 100%)' }}>
    <Box style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'var(--blue-5)', filter: 'blur(100px)', borderRadius: '50%' }} />
    <Box style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--plum-5)', filter: 'blur(100px)', borderRadius: '50%' }} />
    
    <Grid columns={{ initial: '1', md: '3' }} gap="6" style={{ position: 'relative', zIndex: 1 }}>
      {steps.map(step => (
        <Card key={step.id} style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
        }}>
          <Flex align="center" justify="center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            <step.icon size={32} color={step.color} />
          </Flex>
          <Heading size="5" mb="2">{step.title}</Heading>
          <Text size="3" color="gray">{step.desc}</Text>
        </Card>
      ))}
    </Grid>
  </Box>
);

// 5. Developer Terminal
const StyleTerminal = () => (
  <Box style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1a1b26', borderRadius: '12px', overflow: 'hidden', color: '#a9b1d6', fontFamily: 'monospace', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
    <Flex align="center" gap="2" style={{ backgroundColor: '#16161e', padding: '12px 16px', borderBottom: '1px solid #292e42' }}>
      <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f7768e' }} />
      <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e0af68' }} />
      <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#9ece6a' }} />
      <Flex align="center" gap="2" style={{ marginLeft: '16px', color: '#565f89' }}>
        <TerminalIcon size={14} />
        <Text size="2">bash - sahaba-cli</Text>
      </Flex>
    </Flex>
    <Box p="6">
      {steps.map((step, idx) => (
        <Box key={step.id} mb="4">
          <Flex align="center" gap="2" mb="2">
            <Text style={{ color: '#7aa2f7' }}>~</Text>
            <Text style={{ color: '#bb9af7' }}>❯</Text>
            <Text style={{ color: '#e0af68' }}>sahaba</Text>
            <Text style={{ color: '#c0caf5' }}>{step.title.toLowerCase().replace(' ', '-')}</Text>
          </Flex>
          <Flex align="center" gap="3" style={{ paddingLeft: '16px' }}>
            <CheckCircle2 size={16} color="#9ece6a" />
            <Text style={{ color: '#9ece6a' }}>[SUCCESS]</Text>
            <Text style={{ color: '#a9b1d6' }}>{step.desc}</Text>
          </Flex>
        </Box>
      ))}
      <Flex align="center" gap="2">
        <Text style={{ color: '#7aa2f7' }}>~</Text>
        <Text style={{ color: '#bb9af7' }}>❯</Text>
        <Box style={{ width: '8px', height: '16px', backgroundColor: '#c0caf5', animation: 'pulse 1.5s infinite' }} />
      </Flex>
    </Box>
  </Box>
);

// 6. Sticky Steps
const StyleSticky = () => (
  <Flex direction={{ initial: 'column', md: 'row' }} gap="8" style={{ alignItems: 'flex-start' }}>
    <Box style={{ flex: '0 0 35%', position: 'sticky', top: '100px' }}>
      <Badge color="ruby" mb="2" radius="full">Process Overview</Badge>
      <Heading size="8" mb="4">How Sahaba Works</Heading>
      <Text size="4" color="gray">Three simple steps to secure your cloud infrastructure. No complex setup required.</Text>
    </Box>
    <Flex direction="column" gap="6" style={{ flex: 1, width: '100%' }}>
      {steps.map(step => (
        <Card key={step.id} size="4" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <step.icon size={32} color={step.color} />
          </Box>
          <Heading size="7" mb="3">{step.id}. {step.title}</Heading>
          <Text size="5" color="gray">{step.desc}</Text>
        </Card>
      ))}
    </Flex>
  </Flex>
);

// 7. Horizontal Process with Arrows
const StyleHorizontal = () => (
  <Flex direction={{ initial: 'column', md: 'row' }} gap="4" align="center">
    {steps.map((step, idx) => (
      <React.Fragment key={step.id}>
        <Card style={{ flex: 1, width: '100%', textAlign: 'center', padding: '32px' }}>
          <Box style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: step.bg, marginBottom: '24px' }}>
            <step.icon size={40} color={step.color} />
          </Box>
          <Heading size="5" mb="2">{step.title}</Heading>
          <Text size="3" color="gray">{step.desc}</Text>
        </Card>
        {idx < steps.length - 1 && (
          <Box display={{ initial: 'none', md: 'block' }}>
            <ArrowRight size={32} color="var(--gray-8)" />
          </Box>
        )}
      </React.Fragment>
    ))}
  </Flex>
);

// 8. Neo-Brutalism
const StyleBrutalism = () => (
  <Grid columns={{ initial: '1', md: '3' }} gap="6">
    {steps.map(step => (
      <Box key={step.id} style={{
        backgroundColor: 'var(--color-panel-solid)',
        border: '4px solid var(--gray-12)',
        borderRadius: '0',
        padding: '32px',
        boxShadow: '8px 8px 0px 0px var(--gray-12)',
      }}>
        <Box mb="4">
          <Heading size="9" style={{ fontFamily: 'monospace', WebkitTextStroke: '2px var(--gray-12)', color: 'transparent', fontSize: '4rem' }}>0{step.id}</Heading>
        </Box>
        <Heading size="6" mb="2" style={{ fontWeight: 900, textTransform: 'uppercase', color: 'var(--gray-12)' }}>{step.title}</Heading>
        <Text size="4" style={{ fontWeight: 500, color: 'var(--gray-11)' }}>{step.desc}</Text>
      </Box>
    ))}
  </Grid>
);

// 9. Cyberpunk Glow
const StyleCyberpunk = () => (
  <Box style={{ backgroundColor: '#09090b', padding: '48px', borderRadius: '16px' }}>
    <Grid columns={{ initial: '1', md: '3' }} gap="6">
      {steps.map(step => (
        <Box key={step.id} style={{
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 20px -10px ${step.color}`
        }}>
          <Box style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', backgroundColor: step.color, boxShadow: `0 0 15px ${step.color}` }} />
          <step.icon size={36} color={step.color} style={{ filter: `drop-shadow(0 0 8px ${step.color})`, marginBottom: '24px' }} />
          <Heading size="5" mb="2" style={{ color: '#fafafa' }}>{step.title}</Heading>
          <Text size="3" style={{ color: '#a1a1aa' }}>{step.desc}</Text>
        </Box>
      ))}
    </Grid>
  </Box>
);

// 10. Neo-Brutalism Stacked
const StyleNeoBrut = () => (
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
            <Text style={{
              fontSize: '80px',
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
);

const stylesList = [
  { name: '1. Classic Zig Zag', Component: StyleZigZag },
  { name: '2. Vertical Timeline', Component: StyleTimeline },
  { name: '3. Bento Grid', Component: StyleBentoGrid },
  { name: '4. Glassmorphism', Component: StyleGlassmorphism },
  { name: '5. Developer Terminal', Component: StyleTerminal },
  { name: '6. Sticky Scroll', Component: StyleSticky },
  { name: '7. Horizontal Process', Component: StyleHorizontal },
  { name: '8. Neo-Brutalism', Component: StyleBrutalism },
  { name: '9. Cyberpunk Glow', Component: StyleCyberpunk },
  { name: '10. Neo-Brutalism Stacked', Component: StyleNeoBrut },
];

export default function DevHowItWorks() {
  return (
    <Box style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '64px 0' }}>
      <Container size="4">
        <Box mb="9" style={{ textAlign: 'center' }}>
          <Badge color="blue" size="3" radius="full" mb="4">UI/UX Concepts</Badge>
          <Heading size="9" mb="4">How It Works - Gallery</Heading>
          <Text size="5" color="gray">10 distinct, cutting-edge styles for visualizing our core process.</Text>
        </Box>

        <Flex direction="column" gap="9">
          {stylesList.map((style, index) => (
            <Section key={index} size="3" style={{ borderTop: index > 0 ? '1px solid var(--gray-5)' : 'none' }}>
              <SectionHeader title={style.name} description="A unique approach to visualizing the core process." />
              <Box mt="6">
                <style.Component />
              </Box>
            </Section>
          ))}
        </Flex>
      </Container>
    </Box>
  );
}
