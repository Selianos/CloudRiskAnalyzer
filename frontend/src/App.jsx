import { Routes, Route } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import RootLayout from './layouts/RootLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import GuestRoute from './components/auth/GuestRoute'

import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AppPage from './pages/AppPage'
import CreateScanPage from './pages/CreateScanPage'
import SettingsPage from './pages/SettingsPage'
import ConnectionsPage from './pages/ConnectionsPage'
import DemoCreateScanPage from './pages/DemoCreateScanPage'
import DemoAppPage from './pages/DemoAppPage'
import DemoLayout from './layouts/DemoLayout'
import AppLayout from './layouts/AppLayout'
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes with Global Header */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          
          <Route element={<GuestRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>
        </Route>

        {/* Demo Routes WITHOUT Auth */}
        <Route path="demo" element={<DemoLayout />}>
          <Route index element={<DemoCreateScanPage />} />
          <Route path="results" element={<DemoAppPage />} />
        </Route>

        {/* Protected Dashboard Routes WITHOUT Global Header */}
        <Route element={<ProtectedRoute />}>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<AppPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="scans/new" element={<CreateScanPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
