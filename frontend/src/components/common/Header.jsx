import React, { useState, useEffect } from 'react';
import { Flex, Heading, Button, Box, Link as RadixLink } from '@radix-ui/themes';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return; // Only track scroll on home page
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isTransparent = isHome && !isScrolled;

  return (
    <Box 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease-in-out',
        borderBottom: isTransparent ? '1px solid transparent' : '1px solid var(--gray-5)', 
        backgroundColor: isTransparent ? 'transparent' : 'var(--color-panel-solid)' 
      }}
    >
      <Flex 
        align="center" 
        justify="between" 
        style={{ 
          maxWidth: isTransparent ? '100%' : '1200px', 
          margin: '0 auto',
          transition: 'max-width 0.3s ease-in-out, padding 0.3s ease-in-out',
          paddingTop: '1rem',
          paddingBottom: '1rem',
          paddingLeft: isTransparent ? '2rem' : '1rem',
          paddingRight: isTransparent ? '2rem' : '1rem'
        }}
      >
        {/* Logo Area */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Heading size="5" weight="bold" style={{ color: isTransparent ? '#ffffff' : 'var(--accent-9)', transition: 'color 0.3s ease' }}>
            Sahaba
          </Heading>
        </Link>

        {/* Navigation & Actions */}
        <Flex align="center" gap="4">
          {isAuthenticated ? (
            <>
              {/* Hide text links on very small screens */}
              <Box display={{ initial: 'none', sm: 'block' }}>
                <Link to="/app" style={{ textDecoration: 'none' }}>
                  <RadixLink asChild style={{ color: isTransparent ? '#ffffff' : 'var(--gray-11)', transition: 'color 0.3s' }}>
                    <span>Dashboard</span>
                  </RadixLink>
                </Link>
              </Box>
              <Button variant={isTransparent ? "outline" : "soft"} color="red" style={isTransparent ? { color: '#ffffff', borderColor: '#ffffff'} : {}} onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" style={isTransparent ? { color: '#ffffff' } : {}} onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button style={isTransparent ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold' } : {}} onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
