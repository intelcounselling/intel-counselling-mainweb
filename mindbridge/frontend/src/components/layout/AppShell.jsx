import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useAuthStore(s => s.user?.role);

  // Unread risk alerts for the counsellor (super admin) — drives the bell and
  // the sidebar badge so new alerts are visible from every page.
  const { data } = useQuery({
    queryKey: ['unread-alert-count'],
    queryFn: () => api.get('/psychiatrist/alerts', { params: { status: 'UNREAD', limit: 1 } }).then(r => r.data),
    enabled: role === 'SUPER_ADMIN',
    refetchInterval: 60_000,
  });
  const unreadAlerts = data?.pagination?.total ?? data?.alerts?.length ?? 0;

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} unreadAlerts={unreadAlerts} />
      <Topbar onMenuClick={() => setMobileOpen(true)} alertCount={unreadAlerts} showAlerts={role === 'SUPER_ADMIN'} />
      <main className="main-content">
        <div className="p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
