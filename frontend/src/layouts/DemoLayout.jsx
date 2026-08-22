import { Outlet, useNavigate, useLocation } from 'react-router';
import { Flex, Box, Text, Avatar, Button } from '@radix-ui/themes';
import { LayoutDashboard, Home } from 'lucide-react';
import { DemoTipProvider } from '../contexts/DemoTipContext';

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

export default function DemoLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Demo Workspace', path: '/demo/results', icon: LayoutDashboard }
  ];

  return (
    <DemoTipProvider>
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-row items-center gap-3">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Sahaba (Demo)</span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
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

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/')} className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    <Home size={18} />
                    <span>Back to Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <Avatar fallback="G" radius="full" size="3" color="indigo" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate">Guest User</span>
              <span className="text-xs text-gray-500 capitalize">Viewer</span>
            </div>
          </div>
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
            <Text weight="bold" size="4">Mock AWS Scan Results</Text>
          </Flex>

          <Button variant="solid" onClick={() => navigate('/demo')} style={{ cursor: 'pointer' }}>
            New Demo Scan
          </Button>
        </Flex>

        {/* Main Content */}
        <Box style={{ flexGrow: 1, overflow: 'hidden' }}>
          <Outlet />
        </Box>
      </SidebarInset>
    </SidebarProvider>
    </DemoTipProvider>
  );
}
