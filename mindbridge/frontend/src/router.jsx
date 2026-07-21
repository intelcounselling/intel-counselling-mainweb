import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './utils/roleGuard';
import { ROLE_DASHBOARDS } from './utils/roleGuard';
import AppShell from './components/layout/AppShell';
import useAuthStore from './store/authStore';

// ── Auth ──────────────────────────────────────────────────────
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';

// ── Admin ─────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import SchoolList from './pages/admin/SchoolList';
import SchoolDetail from './pages/admin/SchoolDetail';
import SchoolDashboard from './pages/admin/SchoolDashboard';
import ClassManager from './pages/admin/ClassManager';
import ClassAnalytics from './pages/admin/ClassAnalytics';
import CreateFamily from './pages/admin/CreateFamily';
import UserManagement from './pages/admin/UserManagement';
import GenerateCredentials from './pages/admin/GenerateCredentials';

// ── Psychiatrist ──────────────────────────────────────────────
import PsychiatristDashboard from './pages/psychiatrist/PsychiatristDashboard';
import SchoolOverview from './pages/psychiatrist/SchoolOverview';
import AlertsFeed from './pages/psychiatrist/AlertsFeed';
import StudentProfile from './pages/psychiatrist/StudentProfile';
import AppointmentManager from './pages/psychiatrist/AppointmentManager';

// ── Parent ─────────────────────────────────────────────
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildResults from './pages/parent/ChildResults';
import AppointmentList from './pages/parent/AppointmentList';
import ComparisonReport from './pages/parent/ComparisonReport';

// ── Student ───────────────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard';
import TestList from './pages/student/TestList';
import TakeTest from './pages/student/TakeTest';
import ResultDetail from './pages/student/ResultDetail';
import ConcernForm from './pages/student/ConcernForm';
import StudentOnboarding from './pages/student/StudentOnboarding';

// ── Shared Settings ───────────────────────────────────────────
import Settings from './pages/Settings';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];

function AuthRedirect() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    return <Navigate to={`/admin/schools/${user.schoolId}/dashboard`} replace />;
  }
  return <Navigate to={ROLE_DASHBOARDS[user.role] || '/login'} replace />;
}

const router = createBrowserRouter([
  { path: '/', element: <AuthRedirect /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  {
    path: '/reset-password',
    element: <ProtectedRoute><ResetPassword /></ProtectedRoute>,
  },

  // ── Admin ──────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={ADMIN_ROLES}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'schools', element: <SchoolList /> },
      { path: 'schools/:id', element: <SchoolDetail /> },
      { path: 'schools/:id/dashboard', element: <SchoolDashboard /> },
      { path: 'schools/:id/classes', element: <ClassManager /> },
      { path: 'schools/:id/classes/:classId/analytics', element: <ClassAnalytics /> },
      { path: 'schools/:id/create-family', element: <CreateFamily /> },
      { path: 'schools/:id/generate-credentials', element: <GenerateCredentials /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  // ── Psychiatrist ───────────────────────────────────────────
  {
    path: '/psychiatrist',
    element: (
      <ProtectedRoute roles={['PSYCHIATRIST', 'SUPER_ADMIN']}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PsychiatristDashboard /> },
      { path: 'schools', element: <SchoolOverview /> },
      { path: 'schools/:id', element: <SchoolOverview /> },
      { path: 'alerts', element: <AlertsFeed /> },
      { path: 'students/:id', element: <StudentProfile /> },
      { path: 'appointments', element: <AppointmentManager /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  // ── Parent ─────────────────────────────────────────────────
  {
    path: '/parent',
    element: (
      <ProtectedRoute roles={['PARENT']}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ParentDashboard /> },
      { path: 'children', element: <ParentDashboard /> },
      { path: 'children/:childId/results', element: <ChildResults /> },
      { path: 'children/:childId/comparison', element: <ComparisonReport /> },
      { path: 'appointments', element: <AppointmentList /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  // ── Student ────────────────────────────────────────────────
  {
    path: '/student/onboarding',
    element: (
      <ProtectedRoute roles={['STUDENT']}>
        <StudentOnboarding />
      </ProtectedRoute>
    )
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute roles={['STUDENT']}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'tests', element: <TestList /> },
      { path: 'tests/:testId', element: <TakeTest /> },
      { path: 'results', element: <ResultDetail /> },
      { path: 'results/:id', element: <ResultDetail /> },
      { path: 'concerns', element: <ConcernForm /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-8xl mb-4">🧠</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Page Not Found</h1>
          <p className="text-surface-500 mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="text-primary-600 underline">Go home</a>
        </div>
      </div>
    ),
  },
]);

export default router;
