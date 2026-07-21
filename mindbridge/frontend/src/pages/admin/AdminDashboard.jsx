import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { School, Users, AlertTriangle, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { Card, Spinner, EmptyState } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { formatRelative } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

function StatCard({ title, value, icon: Icon, color, bgGradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} p-6 shadow-glass hover:shadow-glass-lg transition-all group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-24 h-24 text-white" />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold text-white mt-1">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user);
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  if (isSchoolAdmin && user?.schoolId) {
    return <Navigate to={`/admin/schools/${user.schoolId}/dashboard`} replace />;
  }

  const { stats, recentAlerts } = data || {};

  return (
    <div className="space-y-8 animate-slide-up max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-surface-900 tracking-tight">Command Center</h2>
          <p className="text-surface-500 mt-2 text-lg">Platform overview and global activity</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
          <ShieldCheck className="w-4 h-4" />
          System Optimal
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Schools" value={stats?.totalSchools} icon={School} bgGradient="from-primary-600 to-primary-800" color="bg-primary-500/30" />
        <StatCard title="Total Students" value={stats?.totalStudents} icon={Users} bgGradient="from-accent-500 to-accent-700" color="bg-accent-400/30" />
        <StatCard title="Total Parents" value={stats?.totalParents} icon={Users} bgGradient="from-green-600 to-green-800" color="bg-green-500/30" />
        <StatCard title="Alerts This Month" value={stats?.alertsThisMonth} icon={AlertTriangle} bgGradient="from-red-500 to-red-700" color="bg-red-400/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card padding={false} className="overflow-hidden border-surface-200/50 shadow-sm">
            <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Recent Alerts
              </h3>
              <Link to="/admin/users" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all users <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {!recentAlerts?.length ? (
              <EmptyState icon="🎉" title="No alerts" description="All students are doing well!" className="py-12" />
            ) : (
              <div className="divide-y divide-surface-100">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {alert.student.firstName} {alert.student.lastName}
                      </p>
                      <p className="text-xs text-surface-500 truncate mt-0.5">{alert.student.school?.name}</p>
                    </div>
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-medium text-surface-400 flex-shrink-0 w-24 text-right">
                      {formatRelative(alert.firedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-surface-900">Quick Actions</h3>
          <div className="flex flex-col gap-4">
            <Link to="/admin/schools" className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-surface-200 hover:border-primary-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-surface-900">Manage Schools</h4>
                  <p className="text-sm text-surface-500">Add or edit schools</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
            </Link>
            
            <Link to="/admin/users" className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-surface-200 hover:border-accent-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600 group-hover:bg-accent-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-surface-900">User Directory</h4>
                  <p className="text-sm text-surface-500">Manage all platform users</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-accent-500 transform group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
