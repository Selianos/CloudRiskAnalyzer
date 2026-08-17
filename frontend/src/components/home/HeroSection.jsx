import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Flex, Heading, Text, Container, Button } from '@radix-ui/themes';
import { useNavigate } from 'react-router';
import Globe from 'react-globe.gl';
import previewImage from '../../assets/preview.png';

export default function HeroSection() {
    const navigate = useNavigate();
    const globeContainerRef = useRef(null);
    const globeEl = useRef(null);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            if (globeContainerRef.current) {
                setDimensions({
                    width: globeContainerRef.current.offsetWidth,
                    height: globeContainerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial measurement

        // Center the globe and rotate it
        if (globeEl.current) {
            // Lat 0 turns the earth down slightly compared to -10, bringing a bit more of the north into view.
            globeEl.current.pointOfView({ lat: 0, lng: 48, altitude: 1.4 }, 0);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Specific connection arcs with Glow layering
    const arcsData = useMemo(() => {
        const locations = {
            saudia1: { lat: 24.71, lng: 46.67 }, // Riyadh
            saudia2: { lat: 21.48, lng: 39.19 }, // Jeddah
            saudia3: { lat: 26.42, lng: 50.08 }, // Dammam
            saudia4: { lat: 28.38, lng: 36.55 }, // Tabuk
            turkey: { lat: 41.00, lng: 28.97 },  // Istanbul
            iran: { lat: 35.68, lng: 51.38 },    // Tehran
            india: { lat: 19.07, lng: 72.87 },   // Mumbai
            egypt: { lat: 30.04, lng: 31.23 },   // Cairo
            egypt2: { lat: 26.82, lng: 27.00 },  // Middle of Egypt
            nw_africa: { lat: 36.75, lng: 3.05 },// Algiers
            uae: { lat: 25.20, lng: 55.27 }      // Dubai
        };

        const baseRoutes = [
            { start: locations.saudia1, end: locations.egypt },
            { start: locations.saudia1, end: locations.iran },
            { start: locations.saudia3, end: locations.india },
            { start: locations.saudia2, end: locations.uae },
            { start: locations.saudia4, end: locations.turkey },
            { start: locations.egypt, end: locations.nw_africa },
            { start: locations.iran, end: locations.turkey },
            { start: locations.saudia2, end: locations.egypt },
            { start: locations.uae, end: locations.india },
            { start: locations.india, end: locations.iran },
            { start: locations.egypt2, end: locations.egypt },
            { start: locations.egypt2, end: locations.saudia2 }
        ];

        const glowingRoutes = [];

        baseRoutes.forEach(route => {
            const colorRgb = '204, 191, 84'; // #ccbf54
            
            // Share the same initial gap so all layers animate perfectly together
            const initialGap = Math.random();

            // Core bright dot (solid and thin)
            glowingRoutes.push({
                startLat: route.start.lat, startLng: route.start.lng,
                endLat: route.end.lat, endLng: route.end.lng,
                color: `rgba(${colorRgb}, 1)`,
                stroke: 0.1, // Halved from 0.2
                initialGap
            });

            // Inner Glow (semi-transparent and thicker)
            glowingRoutes.push({
                startLat: route.start.lat, startLng: route.start.lng,
                endLat: route.end.lat, endLng: route.end.lng,
                color: `rgba(${colorRgb}, 0.4)`,
                stroke: 0.5, // Halved from 1.0
                initialGap
            });

            // Outer Glow (very transparent and very thick)
            glowingRoutes.push({
                startLat: route.start.lat, startLng: route.start.lng,
                endLat: route.end.lat, endLng: route.end.lng,
                color: `rgba(${colorRgb}, 0.1)`,
                stroke: 1.2, // Halved from 2.5
                initialGap
            });
        });

        // Also return the unique cities for the rings data
        const cities = Object.values(locations);

        return { glowingRoutes, cities };
    }, []);

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            style={{
                minHeight: '100vh',
                position: 'relative',
                paddingBottom: '25vh',
                backgroundColor: '#1a1a1a', // Dark gray background
                zIndex: 10,
                // overflow: 'visible' by default, allowing the video to overlap the next section
            }}
        >
            <Box
                ref={globeContainerRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    opacity: 1, // Full opacity
                    pointerEvents: 'none' // Not movable by mouse
                }}
            >
                <Globe
                    ref={globeEl}
                    rendererConfig={{ antialias: true }}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeOffset={[0, dimensions.height * 0.35]} // Shifts the globe down cleanly without CSS clipping
                    globeImageUrl="/8k_earth_nightmap.webp"
                    backgroundColor="rgba(0,0,0,0)"
                    atmosphereColor="#ccbf54"
                    atmosphereAltitude={0.15}

                    // Arc Data
                    arcsData={arcsData.glowingRoutes}
                    arcColor="color"
                    arcDashLength={0.05} // Tiny dashed line (data packet)
                    arcDashGap={0.5}     // Large gap between packets
                    arcDashInitialGap={d => d.initialGap} // Share gap so layers overlap perfectly
                    arcDashAnimateTime={1200} // Fast moving
                    arcStroke={d => d.stroke} // Dynamic stroke for layered glow

                    // Ring Data (Sonar Pings)
                    ringsData={arcsData.cities}
                    ringLat="lat"
                    ringLng="lng"
                    ringColor={() => t => `rgba(204, 191, 84, ${1-t})`}
                    ringMaxRadius={2}
                    ringPropagationSpeed={1}
                    ringRepeatPeriod={1500}
                />
            </Box>

            <Container
                size="4"
                p="6"
                style={{
                    textAlign: 'left',
                    zIndex: 1,
                    width: '100%',
                    flexGrow: 0,
                    flexShrink: 0,
                    position: 'relative'
                }}
            >
                <Heading size="9" mb="4" weight="bold" style={{ color: '#ffffff' }}>
                    Scan, Detect, Secure.
                </Heading>
                <Text
                    size="5"
                    mb="6"
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)', // Solid white with slight softness
                        maxWidth: '800px',
                        display: 'block',
                        lineHeight: '1.6',
                    }}
                >
                    Scan your infrastructure · Detect Risks · Secure what matters
                </Text>
                <Flex gap="4" justify="start" mb="8">
                    <Button 
                        size="4" 
                        style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold' }} 
                        onClick={() => navigate('/signup')}
                    >
                        Scan Your Cloud
                    </Button>
                    <Button 
                        size="4" 
                        variant="outline" 
                        style={{ color: '#ffffff', borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }}
                        onClick={() => navigate('/demo')}
                    >
                        View Demo
                    </Button>
                </Flex>
            </Container>

            {/* Video overlapping next section */}
            <Box className="hero-preview">
                <img
                    src={previewImage}
                    alt="Platform Preview"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                    }}
                />
            </Box>
        </Flex>
    );
}
