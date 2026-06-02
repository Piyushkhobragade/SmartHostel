// @ts-ignore
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import StudentDashboard from './pages/student/StudentDashboard'
import StudentRoom from './pages/student/StudentRoom'
import StudentFees from './pages/student/StudentFees'
import StudentVisitors from './pages/student/StudentVisitors'
import KnowledgeAI from './pages/student/KnowledgeAI'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

// Smart home redirect: sends users to the right landing page based on role
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  return <Dashboard />;
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* All authenticated routes share the same Layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Smart home redirect */}
                <Route index element={<HomeRedirect />} />

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

                {/* Student Portal routes */}
                <Route path="student/dashboard" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="student/room" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentRoom />
                  </ProtectedRoute>
                } />
                <Route path="student/fees" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentFees />
                  </ProtectedRoute>
                } />
                <Route path="student/visitors" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentVisitors />
                  </ProtectedRoute>
                } />

                {/* Knowledge AI — accessible to all roles */}
                <Route path="knowledge" element={<KnowledgeAI />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
