import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Avatar } from '../ui';

function getPageTitle(pathname) {
  const map = {
    '/student': 'Dashboard',
    '/student/tests': 'Take a Test',
    '/student/results': 'My Results',
    '/student/concerns': 'Concerns',
    '/parent': 'Dashboard',
    '/parent/children': 'My Children',
    '/parent/appointments': 'Appointments',
    '/psychiatrist': 'Dashboard',
    '/psychiatrist/schools': 'Schools',
    '/psychiatrist/alerts': 'Alerts',
    '/psychiatrist/appointments': 'Appointment Manager',
    '/admin': 'Dashboard',
    '/admin/schools': 'Schools',
    '/admin/users': 'User Management',
  };

  // Try exact match first
  if (map[pathname]) return map[pathname];

  // Then prefix match
  const segments = Object.keys(map).filter(k => pathname.startsWith(k) && k !== '/');
  if (segments.length) return map[segments.sort((a, b) => b.length - a.length)[0]];

  return 'Intel Counselling';
}

export default function Topbar({ onMenuClick, alertCount = 0 }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header
      className="topbar fixed top-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-surface-100"
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-600"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-surface-900">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative p-2 rounded-xl hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors">
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

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
