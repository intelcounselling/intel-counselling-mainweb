import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Avatar } from '../ui';

// First matching pattern wins — more specific routes come first.
const TITLES = [
  [/^\/student\/tests\/.+/, 'Assessment'],
  [/^\/student\/tests$/, 'Take a Test'],
  [/^\/student\/results/, 'My Results'],
  [/^\/student\/concerns/, 'Concerns'],
  [/^\/parent\/children\/[^/]+\/results/, 'Child Results'],
  [/^\/parent\/children\/[^/]+\/comparison/, 'Progress Comparison'],
  [/^\/parent\/children/, 'My Children'],
  [/^\/parent\/appointments/, 'Appointments'],
  [/^\/psychiatrist\/alerts/, 'Alerts'],
  [/^\/psychiatrist\/students\//, 'Student Profile'],
  [/^\/psychiatrist\/schools/, 'Student Profiles'],
  [/^\/psychiatrist\/appointments/, 'Session Notes'],
  [/^\/admin\/schools\/[^/]+\/dashboard/, 'School Analytics'],
  [/^\/admin\/schools\/[^/]+\/classes\/[^/]+\/analytics/, 'Class Analytics'],
  [/^\/admin\/schools\/[^/]+\/classes/, 'Classes'],
  [/^\/admin\/schools\/[^/]+\/create-family/, 'Create Family'],
  [/^\/admin\/schools\/[^/]+\/generate-credentials/, 'Generate Credentials'],
  [/^\/admin\/schools/, 'Schools'],
  [/^\/admin\/users/, 'User Management'],
  [/^\/admin\/students\/[^/]+\/report/, 'Student Report'],
  [/^\/admin\/appointments/, 'Appointments'],
  [/\/settings$/, 'Settings'],
  [/^\/(student|parent|psychiatrist|admin)\/?$/, 'Dashboard'],
];

function getPageTitle(pathname) {
  return TITLES.find(([re]) => re.test(pathname))?.[1] || 'Intel Counselling';
}

export default function Topbar({ onMenuClick, alertCount = 0, showAlerts = false }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header
      className="topbar fixed top-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-surface-100"
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-600"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-surface-900 truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Risk alerts — only the counsellor (super admin) receives them */}
          {showAlerts && (
            <Link
              to="/psychiatrist/alerts"
              aria-label={alertCount > 0 ? `${alertCount} unread alerts` : 'Alerts'}
              title="Alerts"
              className="relative p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Link>
          )}

          {/* User avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-surface-200">
            <Avatar user={user} size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-surface-800 leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-surface-500 mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
