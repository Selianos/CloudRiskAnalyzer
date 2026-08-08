import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Flex, Heading, Text, TextField, Callout } from '@radix-ui/themes';

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('sessionExpired') === 'true') {
      setSessionExpired(true);
      sessionStorage.removeItem('sessionExpired');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Sign in</Heading>
          
          {sessionExpired && (
            <Callout.Root color="amber">
              <Callout.Text>
                Your session has expired. Please sign in again.
              </Callout.Text>
            </Callout.Root>
          )}

          {error && <Text color="red" size="2" align="center">{error}</Text>}
          <form onSubmit={handleLogin}>
            <Flex direction="column" gap="3">
              <TextField.Root name="email" type="email" placeholder="Email" required />
              <TextField.Root name="password" type="password" placeholder="Password" required />
              <Button type="submit" style={{ width: '100%' }}>Sign in</Button>
            </Flex>
          </form>
          <Text align="center" size="2">
            <Link to="/signup" style={{ color: 'var(--accent-9)', textDecoration: 'none' }}>Create an account</Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
