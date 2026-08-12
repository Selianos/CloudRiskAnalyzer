import React from 'react';
import { Box, Text, Container } from '@radix-ui/themes';
import Marquee from '../common/Marquee';

// Sponsor Logos
import kaustLogo from '../../assets/sponsors/kaust.png';
import ncaLogo from '../../assets/sponsors/nca.png';
import siteLogo from '../../assets/sponsors/site.png';
import uofgLogo from '../../assets/sponsors/uofg.png';
import kkuLogo from '../../assets/sponsors/kku.png';
import kaustAcademyLogo from '../../assets/sponsors/kaust-academy.png';

// Create an array of sponsors to make the marquee look full and less repetitive
const BASE_SPONSORS = [kaustLogo, ncaLogo, siteLogo, uofgLogo, kkuLogo, kaustAcademyLogo];
const SPONSORS = [
  ...BASE_SPONSORS,
  ...BASE_SPONSORS,
  ...BASE_SPONSORS
];

export default function SponsorsSection() {
  return (
    <Box style={{ borderTop: '1px solid var(--gray-4)', padding: '60px 0', backgroundColor: 'var(--gray-2)' }}>
      <Text size="2" color="gray" weight="medium" align="center" mb="6" style={{ textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>
        Proudly Supported By Our Sponsors
      </Text>

      {/* Shortened Width using Container */}
      <Container size="3">
        <Box className="faded-edges">
          <Marquee pauseOnHover={true} repeat={4} duration="40s" gap="4rem">
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
  );
}
