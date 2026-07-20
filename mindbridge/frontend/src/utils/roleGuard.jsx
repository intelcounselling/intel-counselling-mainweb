import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_DASHBOARDS = {
  SUPER_ADMIN: '/admin',
  SCHOOL_ADMIN: '/admin',
  PSYCHIATRIST: '/psychiatrist',
  PARENT: '/parent',
  STUDENT: '/student',
};

/**
 * Protects a route by:
 * 1. Requiring authentication
 * 2. Forcing password reset if mustResetPassword
 * 3. Checking allowed roles
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustResetPassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const dashboard = ROLE_DASHBOARDS[user.role] || '/login';
    return <Navigate to={dashboard} replace />;
  }

  return children;
}

export { ROLE_DASHBOARDS };
