import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import {
  LayoutDashboard, TestTube2, FileText, MessageSquare, Settings,
  Users, School, Bell, Calendar, User, Building2, LogOut, Brain
} from 'lucide-react';

const NAV_BY_ROLE = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/student/tests', label: 'Take a Test', icon: TestTube2 },
    { to: '/student/results', label: 'My Results', icon: FileText },
    { to: '/student/concerns', label: 'Concerns', icon: MessageSquare },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ],
  PARENT: [
    { to: '/parent', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/parent/children', label: 'My Children', icon: Users },
    { to: '/parent/appointments', label: 'Appointments', icon: Calendar },
    { to: '/parent/settings', label: 'Settings', icon: Settings },
  ],
  PSYCHIATRIST: [
    { to: '/psychiatrist', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/psychiatrist/schools', label: 'Schools', icon: Building2 },
    { to: '/psychiatrist/alerts', label: 'Alerts', icon: Bell },
    { to: '/psychiatrist/appointments', label: 'Appointments', icon: Calendar },
    { to: '/psychiatrist/settings', label: 'Settings', icon: Settings },
  ],
  SUPER_ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/schools', label: 'Schools', icon: School },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  SCHOOL_ADMIN: [
    // This serves as a fallback; dynamic routing handled in component
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

const ROLE_LABELS = {
  STUDENT: 'Student',
  PARENT: 'Parent',
  PSYCHIATRIST: 'Psychiatrist',
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = (() => {
    if (user?.role === 'SCHOOL_ADMIN' && user?.schoolId) {
      return [
        { to: `/admin/schools/${user.schoolId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: `/admin/schools/${user.schoolId}/classes`, label: 'Classes', icon: Building2 },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/settings', label: 'Settings', icon: Settings },
      ];
    }
    return NAV_BY_ROLE[user?.role] || [];
  })();

  const handleLogout = async () => {
    try {
      const { refreshToken } = useAuthStore.getState();
      await api.post('/auth/logout', { refreshToken });
    } catch { }
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx('sidebar', mobileOpen && 'open')}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="flex flex-col gap-1.5">
            <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-10 w-auto object-contain self-start" />
            <p className="text-primary-300 text-xs">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="text-primary-400 text-xs font-semibold uppercase tracking-wider px-6 mb-2">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                clsx('sidebar-nav-item', isActive && 'active')
              }
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-primary-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
}
