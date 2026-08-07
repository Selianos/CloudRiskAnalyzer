import { Routes, Route } from 'react-router'
import RootLayout from './layouts/RootLayout'

import Home from './pages/Home'
import NotFound from './pages/NotFound'

export default function App() {

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
