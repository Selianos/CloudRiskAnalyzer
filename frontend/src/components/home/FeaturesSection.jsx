import React from 'react';
import { Box, Heading, Text, Link } from '@radix-ui/themes';
import ncaLogo from '../../assets/sponsors/nca-small.png';
import terraformLogo from '../../assets/landing-logos/terraform.png';
import automatedProcessLogo from '../../assets/landing-logos/automated-process.png';
import codeLogo from '../../assets/landing-logos/code.png';
export default function FeaturesSection() {
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

  return (
    <Box style={{ backgroundColor: '#ffffff', paddingTop: '35vh', paddingBottom: '100px' }}>
      <Box style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Sticky Title Block */}
        <Box style={{ 
          position: 'sticky', 
          top: '100px', 
          zIndex: 10, 
          width: '100%', 
          maxWidth: '450px',
          marginBottom: '40px'
        }}>
          <Heading size={{ initial: '7', md: '9' }} style={{ color: 'var(--gray-12)' }}>Our Features</Heading>
          <Text size="5" style={{ color: 'var(--gray-11)', marginTop: '16px', display: 'block' }}>
            Powerful tools to secure your cloud infrastructure.
          </Text>
        </Box>

        {/* Scrolling Cards Block */}
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
                background: '#ffffff',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 -15px 40px rgba(0,0,0,0.1)',
                zIndex: i,
                border: '1px solid var(--gray-5)',
                overflow: 'hidden'
              }}
            >
              {feat.bgImage && (
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${feat.bgImage})`,
                    backgroundSize: 'auto calc(100% - 60px)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'calc(100% - 30px) center',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                    zIndex: 0,
                    opacity: 0.8
                  }}
                />
              )}
              <Box style={{ position: 'relative', zIndex: 1, textAlign: 'left', marginRight: 'auto', maxWidth: '350px' }}>
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
          ))}
        </Box>

      </Box>
    </Box>
  );
}
