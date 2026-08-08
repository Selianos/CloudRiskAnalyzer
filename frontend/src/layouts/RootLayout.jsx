import { Outlet } from 'react-router'
import Header from '../components/Header'
import { Box } from '@radix-ui/themes'

/**
 * RootLayout — shared shell for all pages.
 * Add Navbar, Sidebar, Toasts, etc. here.
 */
export default function RootLayout() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box style={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
