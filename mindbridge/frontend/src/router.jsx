import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './utils/roleGuard';
import { ROLE_DASHBOARDS } from './utils/roleGuard';
import AppShell from './components/layout/AppShell';
import useAuthStore from './store/authStore';

// ── Auth ──────────────────────────────────────────────────────
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';

// ── Helper ────────────────────────────────────────────────────
const Loadable = (Component) => (props) => (
  <Suspense fallback={
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        <p className="text-sm font-medium text-surface-500">Loading...</p>
      </div>
    </div>
  }>
    <Component {...props} />
  </Suspense>
);

// ── Admin ─────────────────────────────────────────────
const AdminDashboard = Loadable(lazy(() => import('./pages/admin/AdminDashboard')));
const SchoolList = Loadable(lazy(() => import('./pages/admin/SchoolList')));
const SchoolDetail = Loadable(lazy(() => import('./pages/admin/SchoolDetail')));
const SchoolDashboard = Loadable(lazy(() => import('./pages/admin/SchoolDashboard')));
const ClassManager = Loadable(lazy(() => import('./pages/admin/ClassManager')));
const ClassAnalytics = Loadable(lazy(() => import('./pages/admin/ClassAnalytics')));
const CreateFamily = Loadable(lazy(() => import('./pages/admin/CreateFamily')));
const UserManagement = Loadable(lazy(() => import('./pages/admin/UserManagement')));
const GenerateCredentials = Loadable(lazy(() => import('./pages/admin/GenerateCredentials')));

// ── Psychiatrist ──────────────────────────────────────────────
const PsychiatristDashboard = Loadable(lazy(() => import('./pages/psychiatrist/PsychiatristDashboard')));
const SchoolOverview = Loadable(lazy(() => import('./pages/psychiatrist/SchoolOverview')));
const AlertsFeed = Loadable(lazy(() => import('./pages/psychiatrist/AlertsFeed')));
const StudentProfile = Loadable(lazy(() => import('./pages/psychiatrist/StudentProfile')));
const AppointmentManager = Loadable(lazy(() => import('./pages/psychiatrist/AppointmentManager')));

// ── Parent ─────────────────────────────────────────────
const ParentDashboard = Loadable(lazy(() => import('./pages/parent/ParentDashboard')));
const ChildResults = Loadable(lazy(() => import('./pages/parent/ChildResults')));
const AppointmentList = Loadable(lazy(() => import('./pages/parent/AppointmentList')));
const ComparisonReport = Loadable(lazy(() => import('./pages/parent/ComparisonReport')));

// ── Student ───────────────────────────────────────────────────
const StudentDashboard = Loadable(lazy(() => import('./pages/student/StudentDashboard')));
const TestList = Loadable(lazy(() => import('./pages/student/TestList')));
const TakeTest = Loadable(lazy(() => import('./pages/student/TakeTest')));
const ResultDetail = Loadable(lazy(() => import('./pages/student/ResultDetail')));
const ConcernForm = Loadable(lazy(() => import('./pages/student/ConcernForm')));

// ── Shared Settings ───────────────────────────────────────────
const Settings = Loadable(lazy(() => import('./pages/Settings')));

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
