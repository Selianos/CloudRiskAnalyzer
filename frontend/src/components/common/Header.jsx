import { Flex, Heading, Button, Box, Link as RadixLink } from '@radix-ui/themes';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Box style={{ borderBottom: '1px solid var(--gray-5)', backgroundColor: 'var(--color-panel-solid)' }}>
      <Flex 
        align="center" 
        justify="between" 
        p="4" 
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* Logo Area */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Heading size="5" weight="bold" style={{ color: 'var(--accent-9)' }}>
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
                  <RadixLink asChild color="gray" highContrast>
                    <span>Dashboard</span>
                  </RadixLink>
                </Link>
              </Box>
              <Button variant="soft" color="red" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
