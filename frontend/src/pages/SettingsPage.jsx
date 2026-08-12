import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Separator,
  Callout,
} from '@radix-ui/themes';

import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/apiClient';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();

  const [fullname, setFullname] = useState(
    user?.user_metadata?.fullname || ''
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [nameMessage, setNameMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Keep the name field in sync if the user changes.
  useEffect(() => {
    setFullname(user?.user_metadata?.fullname || '');
  }, [user]);

  const handleNameChange = async (e) => {
    e.preventDefault();

    setNameMessage(null);

    if (!fullname.trim()) {
      setNameMessage({
        type: 'error',
        text: 'Full name cannot be empty.',
      });
      return;
    }

    setSavingName(true);

    try {
      const data = await apiClient('/auth/name', {
        method: 'PUT',
        body: JSON.stringify({
          fullname: fullname.trim(),
        }),
      });

      setNameMessage({
        type: 'success',
        text: 'Your name has been updated successfully.',
      });

      // Update the locally stored user so the new name is reflected
      // throughout the application.
      const updatedUser = data?.user || data;

      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Change Name Error:', error);

      setNameMessage({
        type: 'error',
        text: error.message || 'Failed to update your name.',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Please enter your current password.',
      });
      return;
    }

    if (!newPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Please enter a new password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password cannot be the same as current password.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);

    try {
      await apiClient('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setPasswordMessage({
        type: 'success',
        text: 'Your password has been changed successfully.',
      });
    } catch (error) {
      console.error('Change Password Error:', error);

      setPasswordMessage({
        type: 'error',
        text: error.message || 'Failed to change your password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box p="6" style={{ height: '100%', overflowY: 'auto' }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Heading size="6" mb="2">
          Personal Settings
        </Heading>

        <Text color="gray" mb="6" as="div">
          Manage your account and authentication settings.
        </Text>

        {/* Account */}
        <Card size="4" mb="5">
          <Flex direction="column" gap="5">
            <Box>
              <Heading size="4" mb="1">
                Account
              </Heading>

              <Text size="2" color="gray">
                Manage your personal account information.
              </Text>
            </Box>

            <Separator size="4" />

            {/* Email */}
            <Box>
              <Text as="div" size="2" mb="1" weight="medium">
                Email
              </Text>

              <TextField.Root
                value={user?.email || ''}
                disabled
              />
            </Box>

            {/* Full Name */}
            <form onSubmit={handleNameChange}>
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="div" size="2" mb="1" weight="medium">
                    Full Name
                  </Text>

                  <TextField.Root
                    value={fullname}
                    placeholder="Enter your full name"
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </Box>

                {nameMessage && (
                  <Callout.Root
                    color={
                      nameMessage.type === 'success'
                        ? 'green'
                        : 'red'
                    }
                  >
                    <Callout.Text>
                      {nameMessage.text}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Box>
                  <Button
                    type="submit"
                    disabled={savingName}
                    style={{
                      cursor: savingName ? 'default' : 'pointer',
                    }}
                  >
                    {savingName ? 'Saving...' : 'Save Name'}
                  </Button>
                </Box>
              </Flex>
            </form>
          </Flex>
        </Card>

        {/* Password */}
        <Card size="4" mb="5">
          <Flex direction="column" gap="5">
            <Box>
              <Heading size="4" mb="1">
                Password
              </Heading>

              <Text size="2" color="gray">
                Change the password used to sign in to your account.
              </Text>
            </Box>

            <Separator size="4" />

            <form onSubmit={handlePasswordChange}>
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="div" size="2" mb="1" weight="medium">
                    Current Password
                  </Text>

                  <TextField.Root
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text as="div" size="2" mb="1" weight="medium">
                    New Password
                  </Text>

                  <TextField.Root
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text as="div" size="2" mb="1" weight="medium">
                    Confirm New Password
                  </Text>

                  <TextField.Root
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </Box>

                {passwordMessage && (
                  <Callout.Root
                    color={
                      passwordMessage.type === 'success'
                        ? 'green'
                        : 'red'
                    }
                  >
                    <Callout.Text>
                      {passwordMessage.text}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Box>
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    style={{
                      cursor: savingPassword
                        ? 'default'
                        : 'pointer',
                    }}
                  >
                    {savingPassword
                      ? 'Changing...'
                      : 'Change Password'}
                  </Button>
                </Box>
              </Flex>
            </form>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
