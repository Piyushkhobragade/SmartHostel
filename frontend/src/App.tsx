import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/Spinner'

// ─── Lazy-loaded page components ─────────────────────────────────────────────
// Each route is a separate chunk — prevents loading all ~870 kB upfront.
// Only the active route's chunk is fetched after the initial shell loads.

const Dashboard          = lazy(() => import('./pages/Dashboard'))
const Residents          = lazy(() => import('./pages/Residents'))
const Rooms              = lazy(() => import('./pages/Rooms'))
const Attendance         = lazy(() => import('./pages/Attendance'))
const Visitors           = lazy(() => import('./pages/Visitors'))
const Fees               = lazy(() => import('./pages/Fees'))
const Analytics          = lazy(() => import('./pages/Analytics'))
const Assets             = lazy(() => import('./pages/Assets'))
const Maintenance        = lazy(() => import('./pages/Maintenance'))
const Mess               = lazy(() => import('./pages/Mess'))
const Login              = lazy(() => import('./pages/Login'))

// Student portal
const StudentDashboard   = lazy(() => import('./pages/student/StudentDashboard'))
const StudentRoom        = lazy(() => import('./pages/student/StudentRoom'))
const StudentFees        = lazy(() => import('./pages/student/StudentFees'))
const StudentVisitors    = lazy(() => import('./pages/student/StudentVisitors'))
const StudentAttendance  = lazy(() => import('./pages/student/StudentAttendance'))
const StudentAssistant   = lazy(() => import('./pages/student/KnowledgeAI'))

// Admin tools (heaviest chunks — only loaded on demand)
const WardenCopilot      = lazy(() => import('./pages/admin/WardenCopilot'))
const OperationalTimeline = lazy(() => import('./pages/admin/OperationalTimeline'))
const DigitalTwin        = lazy(() => import('./pages/admin/DigitalTwin'))
const KnowledgeManager   = lazy(() => import('./pages/admin/KnowledgeManager'))

// Phase 8.3 — Admission wizard & first-login gate
const AdmissionsWizard   = lazy(() => import('./pages/AdmissionsWizard'))
const ChangePassword     = lazy(() => import('./pages/ChangePassword'))

// ─── Suspense fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return <Spinner fullPage label="Loading..." />
}

// ─── Smart home redirect ─────────────────────────────────────────────────────

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />
  return <Dashboard />
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* All authenticated routes share Layout */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Smart home redirect */}
                  <Route index element={<HomeRedirect />} />

                  {/* ADMIN only */}
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
                  <Route path="knowledge-manager" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <KnowledgeManager />
                    </ProtectedRoute>
                  } />
                  <Route path="admissions/new" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdmissionsWizard />
                    </ProtectedRoute>
                  } />

                  {/* ADMIN and STAFF */}
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
                  <Route path="copilot" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                      <WardenCopilot />
                    </ProtectedRoute>
                  } />
                  <Route path="timeline" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                      <OperationalTimeline />
                    </ProtectedRoute>
                  } />
                  <Route path="digital-twin" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                      <DigitalTwin />
                    </ProtectedRoute>
                  } />

                  {/* Student Portal */}
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
                  <Route path="student/attendance" element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <StudentAttendance />
                    </ProtectedRoute>
                  } />

                  {/* Accessible to all authenticated roles */}
                  <Route path="knowledge" element={<StudentAssistant />} />

                  {/* First-login password change — accessible to all authenticated users */}
                  <Route path="change-password" element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
