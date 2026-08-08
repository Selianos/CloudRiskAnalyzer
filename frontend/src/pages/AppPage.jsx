import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Heading, Text, Flex } from '@radix-ui/themes';

export default function AppPage() {
  const { user, logout } = useAuth();

  // Extract real name straight from the GoTrue metadata payload, or fallback to email
  const userName = user?.user_metadata?.fullname;

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="4" align="center">
          <Heading size="6">Hello, {userName}!</Heading>
          <Flex direction="column" gap="2" align="center">
            <Text>Email: <Text weight="bold">{user?.email}</Text></Text>
            <Text>Role: <Text weight="bold">{user?.user_metadata?.role}</Text></Text>
          </Flex>
          <Button onClick={handleSignOut} color="red" style={{ width: '100%' }}>Sign out</Button>
        </Flex>
      </Card>
    </Flex>
  );
}
