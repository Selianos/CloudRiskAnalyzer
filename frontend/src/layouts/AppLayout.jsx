import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Flex, Box, Text, Button, DropdownMenu, Avatar, Badge, Spinner } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Settings, LogOut, Activity, Link2, Home } from 'lucide-react';
import { getScans } from '../api/scan';

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

function formatScanDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // The currently selected scan (full scan object or null)
  const [selectedScan, setSelectedScan] = useState(null);
  const [scans, setScans] = useState([]);
  const [scansLoading, setScansLoading] = useState(false);

  const navItems = [
    { label: 'Scans & Connections', path: '/app/connections', icon: Link2 },
    { label: 'Workspace', path: '/app', icon: LayoutDashboard },
    { label: 'Settings', path: '/app/settings', icon: Settings }
  ];

  // Fetch scans when we're on the workspace page (or any time)
  useEffect(() => {
    const loadScans = async () => {
      try {
        setScansLoading(true);
        const data = await getScans();
        // Already sorted desc by created_at from backend
        setScans(data);
        // Auto-select latest scan if nothing selected yet
        if (data.length > 0 && !selectedScan) {
          setSelectedScan(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch scans for workspace:', err);
      } finally {
        setScansLoading(false);
      }
    };

    if (location.pathname === '/app') {
      loadScans();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Allow child pages to trigger a scan selection (e.g. after creating one)
  const handleSelectScan = (scan) => {
    setSelectedScan(scan);
    navigate('/app');
  };

  const getDropdownLabel = (scan, index) => {
    if (!scan) return 'No scans yet';
    const isLatest = index === 0;
    const label = scan.connections?.name || `Scan ${scan.id.slice(0, 6)}`;
    const date = formatScanDate(scan.created_at);
    return isLatest ? `${label} — ${date}` : `${label} — ${date}`;
  };

  const getButtonLabel = () => {
    if (scansLoading) return 'Loading...';
    if (!selectedScan) return 'No scans';
    const isLatest = scans.length > 0 && scans[0].id === selectedScan.id;
    const label = selectedScan.connections?.name || `Scan ${selectedScan.id.slice(0, 6)}`;
    const date = formatScanDate(selectedScan.created_at);
    return isLatest ? `${label} — ${date}` : `${label} — ${date}`;
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-row items-center gap-3">
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
                {scansLoading ? (
                  <Flex align="center" gap="2">
                    <Spinner size="1" />
                    <Text color="gray" size="2">Loading scans...</Text>
                  </Flex>
                ) : scans.length === 0 ? (
                  <Flex align="center" gap="2">
                    <Text color="gray" size="2">No scans yet.</Text>
                    <Button variant="soft" size="1" onClick={() => navigate('/app/scans/new')} style={{ cursor: 'pointer' }}>
                      Start one
                    </Button>
                  </Flex>
                ) : (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="soft" color="gray" style={{ cursor: 'pointer', maxWidth: '400px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getButtonLabel()}
                        </span>
                        {selectedScan && scans.length > 0 && scans[0].id === selectedScan.id && (
                          <Badge color="blue" size="1" variant="solid" style={{ marginLeft: '6px', flexShrink: 0 }}>
                            Latest
                          </Badge>
                        )}
                        <DropdownMenu.TriggerIcon />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content style={{ maxHeight: '320px', overflowY: 'auto', minWidth: '320px' }}>
                      {scans.map((scan, index) => {
                        const connName = scan.connections?.name || `Scan ${scan.id.slice(0, 8)}`;
                        const date = formatScanDate(scan.created_at);
                        const isLatest = index === 0;
                        const isSelected = selectedScan?.id === scan.id;

                        return (
                          <DropdownMenu.Item
                            key={scan.id}
                            onSelect={() => setSelectedScan(scan)}
                            style={{ fontWeight: isSelected ? 'bold' : 'normal' }}
                          >
                            <Flex align="center" gap="2" style={{ width: '100%' }}>
                              <Box style={{ flexGrow: 1 }}>
                                <Text size="2" weight={isSelected ? 'bold' : 'regular'}>{connName}</Text>
                                <Text size="1" color="gray" as="div">{date}</Text>
                              </Box>
                              {isLatest && (
                                <Badge color="blue" size="1" variant="soft">Latest</Badge>
                              )}
                              {scan.status === 'PENDING' || scan.status === 'RUNNING' ? (
                                <Badge color="orange" size="1" variant="soft">Scanning…</Badge>
                              ) : scan.status === 'FAILED' ? (
                                <Badge color="red" size="1" variant="soft">Failed</Badge>
                              ) : null}
                            </Flex>
                          </DropdownMenu.Item>
                        );
                      })}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item onSelect={() => navigate('/app/connections')}>
                        View All Connections…
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                )}
              </>
            ) : (
              <Text weight="bold" size="5" style={{ color: 'var(--gray-12)' }}>
                {location.pathname.includes('/settings') ? 'Settings' : 'Scans & Connections'}
              </Text>
            )}
          </Flex>

          {location.pathname === '/app' && (
            <Button variant="solid" onClick={() => navigate('/app/scans/new')} style={{ cursor: 'pointer' }}>
              + New Scan
            </Button>
          )}
        </Flex>

        {/* Main Content */}
        <Box style={{ flexGrow: 1, overflow: 'hidden' }}>
          <Outlet context={{ selectedScan, onSelectScan: handleSelectScan, refreshScans: () => {
            // Triggers a re-load when called from child
            getScans().then(data => {
              setScans(data);
              if (data.length > 0) setSelectedScan(data[0]);
            }).catch(console.error);
          }}} />
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}
