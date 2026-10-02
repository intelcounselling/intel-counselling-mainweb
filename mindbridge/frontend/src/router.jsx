import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
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

// ── Stale-deploy recovery ─────────────────────────────────────
// Lazy routes fetch content-hashed chunks (e.g. ConcernForm-BnoQpt4n.js).
// After a new deploy those filenames no longer exist, so users with an
// already-open app (or a cached index.html) get "Failed to fetch dynamically
// imported module" when they navigate. Recover by reloading the page once —
// a full reload fetches the fresh index.html with the new chunk names. The
// sessionStorage guard prevents reload loops when the failure is genuine
// (e.g. the user is offline).
const CHUNK_ERROR = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk/i;
const CHUNK_RELOAD_KEY = 'vite:chunk-reload-at';

function staleSafeLazy(factory) {
  return lazy(() =>
    factory().catch((err) => {
      if (CHUNK_ERROR.test(String(err?.message || err))) {
        const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
        if (Date.now() - last > 10000) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return new Promise(() => {}); // halt navigation — the page is reloading
        }
      }
      throw err;
    })
  );
}

// ── Admin ─────────────────────────────────────────────
const AdminDashboard = Loadable(staleSafeLazy(() => import('./pages/admin/AdminDashboard')));
const SchoolList = Loadable(staleSafeLazy(() => import('./pages/admin/SchoolList')));
const SchoolDetail = Loadable(staleSafeLazy(() => import('./pages/admin/SchoolDetail')));
const SchoolDashboard = Loadable(staleSafeLazy(() => import('./pages/admin/SchoolDashboard')));
const ClassManager = Loadable(staleSafeLazy(() => import('./pages/admin/ClassManager')));
const ClassAnalytics = Loadable(staleSafeLazy(() => import('./pages/admin/ClassAnalytics')));
const CreateFamily = Loadable(staleSafeLazy(() => import('./pages/admin/CreateFamily')));
const UserManagement = Loadable(staleSafeLazy(() => import('./pages/admin/UserManagement')));
const GenerateCredentials = Loadable(staleSafeLazy(() => import('./pages/admin/GenerateCredentials')));
const StudentReportPage = Loadable(staleSafeLazy(() => import('./pages/admin/StudentReportPage')));
const AdminAppointments = Loadable(staleSafeLazy(() => import('./pages/admin/AdminAppointments')));

// ── Psychiatrist ──────────────────────────────────────────────
const PsychiatristDashboard = Loadable(staleSafeLazy(() => import('./pages/psychiatrist/PsychiatristDashboard')));
const SchoolOverview = Loadable(staleSafeLazy(() => import('./pages/psychiatrist/SchoolOverview')));
const AlertsFeed = Loadable(staleSafeLazy(() => import('./pages/psychiatrist/AlertsFeed')));
const StudentProfile = Loadable(staleSafeLazy(() => import('./pages/psychiatrist/StudentProfile')));
const AppointmentManager = Loadable(staleSafeLazy(() => import('./pages/psychiatrist/AppointmentManager')));

// ── Parent ─────────────────────────────────────────────
const ParentDashboard = Loadable(staleSafeLazy(() => import('./pages/parent/ParentDashboard')));
const ChildResults = Loadable(staleSafeLazy(() => import('./pages/parent/ChildResults')));
const AppointmentList = Loadable(staleSafeLazy(() => import('./pages/parent/AppointmentList')));
const ComparisonReport = Loadable(staleSafeLazy(() => import('./pages/parent/ComparisonReport')));
const ParentPerspective = Loadable(staleSafeLazy(() => import('./pages/parent/ParentPerspective')));

// ── Student ───────────────────────────────────────────────────
const StudentDashboard = Loadable(staleSafeLazy(() => import('./pages/student/StudentDashboard')));
const TestList = Loadable(staleSafeLazy(() => import('./pages/student/TestList')));
const TakeTest = Loadable(staleSafeLazy(() => import('./pages/student/TakeTest')));
const ResultDetail = Loadable(staleSafeLazy(() => import('./pages/student/ResultDetail')));
const ConcernForm = Loadable(staleSafeLazy(() => import('./pages/student/ConcernForm')));

// ── Shared Settings ───────────────────────────────────────────
const Settings = Loadable(staleSafeLazy(() => import('./pages/Settings')));

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];

// Unknown URL: send signed-in users back to their own dashboard
function NotFound() {
  const user = useAuthStore(s => s.user);
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-surface-900 mb-2">Page not found</h1>
        <p className="text-surface-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary-700 text-white font-semibold px-6 py-3 hover:bg-primary-800">
          {user ? 'Back to my dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}

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
      { path: 'students/:id/report', element: <StudentReportPage /> },
      { path: 'appointments', element: <AdminAppointments /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  // ── Psychiatrist ───────────────────────────────────────────
  {
    path: '/psychiatrist',
    element: (
      <ProtectedRoute roles={['SUPER_ADMIN']}>
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
      { path: 'children/:childId/perspective', element: <ParentPerspective /> },
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

  // ── 404 ──────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);
export default router;
