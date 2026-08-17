import React from 'react';
import { Box } from '@radix-ui/themes';

import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import AboutSection from '../components/home/AboutSection';
import ProvidersSection from '../components/home/ProvidersSection';
import SponsorsSection from '../components/home/SponsorsSection';
import Footer from '../components/common/Footer';

export default function Home() {
    return (
        <Box>
            <HeroSection />
            <FeaturesSection />
            <AboutSection />
            <ProvidersSection />
            
            <Box style={{ backgroundColor: 'var(--gray-2)', padding: '60px 0' }}>
                <SponsorsSection />
            </Box>

            <Footer />
        </Box>
    );
}
