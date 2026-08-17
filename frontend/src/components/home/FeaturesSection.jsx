import React from 'react';
import { Box, Heading, Text, Link } from '@radix-ui/themes';
import ncaLogo from '../../assets/sponsors/nca-small.png';
import terraformLogo from '../../assets/landing-logos/terraform.png';
import automatedProcessLogo from '../../assets/landing-logos/automated-process.png';
import codeLogo from '../../assets/landing-logos/code.png';

const features = [
  {
    id: 1,
    title: "Cloud Infra Scanning",
    desc: "Scan your live cloud infrastructure to detect risks, with strict compliance of ",
    link: { text: "CCC by NCA", url: "https://nca.gov.sa/en/regulatory-documents/controls-list/ccc/" },
    bgImage: ncaLogo
  },
  {
    id: 2,
    title: "IaaC Scanner",
    desc: "Scan Terraform, Kubernetes, and ARM templates for security misconfigurations before they reach production.",
    bgImage: terraformLogo
  },
  {
    id: 3,
    title: "Automated Scanning",
    desc: "Ensure your environment is never exposed by running background checks continuously to detect misconfigurations instantly.",
    bgImage: automatedProcessLogo
  },
  {
    id: 4,
    title: "IaC Visualizer & Builder",
    desc: "Visualize your Infrastructure as Code in a beautiful graph, and intuitively build secure architectures from scratch.",
    bgImage: codeLogo
  }
];

function FeatureCard({ feat }) {
  return (
    <Box
      style={{
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 -15px 40px rgba(0,0,0,0.1)',
        border: '1px solid var(--gray-5)',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
      }}
    >
      {feat.bgImage && (
        <Box
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundImage: `url(${feat.bgImage})`,
            backgroundSize: 'auto calc(100% - 60px)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'calc(100% - 30px) center',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            zIndex: 0,
            opacity: 0.8,
          }}
        />
      )}
      <Box style={{ position: 'relative', zIndex: 1, textAlign: 'left', maxWidth: '350px' }}>
        <Heading size="6" style={{ color: 'var(--gray-12)' }}>{feat.title}</Heading>
        <Text mt="4" style={{ color: 'var(--gray-11)', lineHeight: 1.6, display: 'block' }}>
          {feat.desc}
          {feat.link && (
            <Link href={feat.link.url} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
              {feat.link.text}
            </Link>
          )}
        </Text>
      </Box>
    </Box>
  );
}

export default function FeaturesSection() {
  return (
    <Box style={{ backgroundColor: '#ffffff', paddingTop: 'calc(80vw * 9 / 16 / 2)', paddingBottom: '100px' }}>
      <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        {/* === DESKTOP: sticky scroll layout === */}
        <Box className="features-desktop">
          {/* Sticky Title */}
          <Box style={{ position: 'sticky', top: '100px', zIndex: 10, maxWidth: '450px', marginBottom: '40px' }}>
            <Heading size="9" style={{ color: 'var(--gray-12)' }}>Our Features</Heading>
            <Text size="5" style={{ color: 'var(--gray-11)', marginTop: '16px', display: 'block' }}>
              Powerful tools to secure your cloud infrastructure.
            </Text>
          </Box>

          {/* Scrolling Cards */}
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingBottom: '20vh', marginTop: '-150px' }}>
            {features.map((feat, i) => (
              <Box
                key={feat.id}
                style={{
                  position: 'sticky',
                  top: `calc(50vh - 150px + ${i * 30}px)`,
                  width: '100%',
                  maxWidth: '600px',
                  height: '300px',
                  marginBottom: '40vh',
                  zIndex: i,
                }}
              >
                <FeatureCard feat={feat} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* === MOBILE: simple vertical stack from bottom === */}
        <Box className="features-mobile">
          <Heading size="7" mb="2" style={{ color: 'var(--gray-12)' }}>Our Features</Heading>
          <Text size="4" style={{ color: 'var(--gray-11)', marginBottom: '32px', display: 'block' }}>
            Powerful tools to secure your cloud infrastructure.
          </Text>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map(feat => (
              <Box key={feat.id} style={{ height: '220px' }}>
                <FeatureCard feat={feat} />
              </Box>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
