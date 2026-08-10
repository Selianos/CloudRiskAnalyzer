import { Outlet, useLocation } from 'react-router'
import Header from '../components/common/Header'
import { Box } from '@radix-ui/themes'

/**
 * RootLayout — shared shell for all pages.
 * Add Navbar, Sidebar, Toasts, etc. here.
 */
export default function RootLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {/* Spacer to push content down because Header is now position: fixed */}
      {!isHome && <Box style={{ height: '70px' }} />}
      <Box style={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
