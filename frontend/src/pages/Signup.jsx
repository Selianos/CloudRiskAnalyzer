import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      await signup(name, email, password);
      // Redirect to login upon successful registration
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Sign up</Heading>
          {error && <Text color="red" size="2" align="center">{error}</Text>}
          <form onSubmit={handleSignup}>
            <Flex direction="column" gap="3">
              <TextField.Root name="name" type="text" placeholder="Full Name" required />
              <TextField.Root name="email" type="email" placeholder="Email" required />
              <TextField.Root name="password" type="password" placeholder="Password" required />
              <Button type="submit" style={{ width: '100%' }}>Sign up</Button>
            </Flex>
          </form>
          <Text align="center" size="2">
            <Link to="/login" style={{ color: 'var(--accent-9)', textDecoration: 'none' }}>Already have an account? Sign in</Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
