// @ts-ignore
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Residents from './pages/Residents'
import Rooms from './pages/Rooms'
import Attendance from './pages/Attendance'
import Visitors from './pages/Visitors'
import Fees from './pages/Fees'
import Analytics from './pages/Analytics'
import Assets from './pages/Assets'
import Maintenance from './pages/Maintenance'
import Mess from './pages/Mess'
import Login from './pages/Login'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Dashboard - All authenticated users */}
                <Route index element={<Dashboard />} />

                {/* ADMIN only routes */}
                <Route path="residents" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Residents />
                  </ProtectedRoute>
                } />
                <Route path="rooms" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Rooms />
                  </ProtectedRoute>
                } />
                <Route path="fees" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Fees />
                  </ProtectedRoute>
                } />
                <Route path="assets" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Assets />
                  </ProtectedRoute>
                } />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="mess" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Mess />
                  </ProtectedRoute>
                } />

                {/* ADMIN and STAFF routes */}
                <Route path="attendance" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Attendance />
                  </ProtectedRoute>
                } />
                <Route path="visitors" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Visitors />
                  </ProtectedRoute>
                } />
                <Route path="maintenance" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Maintenance />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
