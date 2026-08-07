import { Outlet } from 'react-router'

/**
 * RootLayout — shared shell for all pages.
 * Add Navbar, Sidebar, Toasts, etc. here.
 */
export default function RootLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
