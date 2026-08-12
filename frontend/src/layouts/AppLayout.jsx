import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Flex, Box, Text, Button, DropdownMenu, Avatar } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, ShieldAlert, Settings, LogOut, Activity, Link2 } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInset
} from '@/components/animate-ui/components/radix/sidebar';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedScan, setSelectedScan] = useState('AWS');

  const navItems = [
    { label: 'Scans & Connections', path: '/app/connections', icon: Link2 },
    { label: 'Workspace', path: '/app', icon: LayoutDashboard },
    { label: 'Settings', path: '/app/settings', icon: Settings }
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-row items-center gap-3">
          <div className="p-2 bg-[var(--primary-color)] rounded-md text-white flex items-center justify-center">
            <Activity size={24} />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">Sahaba</span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                        tooltip={item.label}
                        className={isActive ? 'font-medium text-[var(--primary-color)]' : ''}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <Avatar fallback={(user?.user_metadata?.fullname?.[0]) || 'U'} radius="full" size="3" color="indigo" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.user_metadata?.fullname}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.user_metadata?.role}</span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1 w-full bg-[var(--gray-1)] overflow-hidden flex flex-col">
        {/* Dynamic Header spanning full width */}
        <Flex
          justify="between"
          align="center"
          p="4"
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--gray-4)',
            height: '70px',
            flexShrink: 0
          }}
        >
          <Flex align="center" gap="4">
            <SidebarTrigger className="-ml-1" />
            {location.pathname === '/app' ? (
              <>
                <Text weight="bold" size="4">Current Scan:</Text>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>
                      {selectedScan} Production Environment
                      <DropdownMenu.TriggerIcon />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={() => setSelectedScan('AWS')} onSelect={() => setSelectedScan('AWS')}>AWS Production Environment</DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => setSelectedScan('OCI')} onSelect={() => setSelectedScan('OCI')}>OCI Production Environment</DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => setSelectedScan('GCP')} onSelect={() => setSelectedScan('GCP')}>GCP Production Environment</DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onClick={() => navigate('/app/connections')}>View All Scans...</DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </>
            ) : (
              <Text weight="bold" size="5" style={{ color: 'var(--gray-12)' }}>
                {location.pathname.includes('/settings') ? 'Settings' : 'Scans & Connections'}
              </Text>
            )}
          </Flex>

          {location.pathname === '/app' && (
            <Button variant="solid" onClick={() => navigate('/app/scans/new')} style={{ cursor: 'pointer' }}>
              + Create Scan
            </Button>
          )}
        </Flex>

        {/* Main Content */}
        <Box style={{ flexGrow: 1, overflow: 'hidden' }}>
          <Outlet context={{ selectedScan }} />
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}
