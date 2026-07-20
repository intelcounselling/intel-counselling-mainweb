import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Users, School, Calendar, ChevronRight, Eye, CalendarPlus } from 'lucide-react';
import { Card, Spinner, EmptyState } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { formatDateTime, formatRelative } from '../../utils/formatters';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-surface-900">{value ?? '—'}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function PsychiatristDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['psych-dashboard'],
    queryFn: () => api.get('/psychiatrist/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { stats, recentAlerts, upcomingAppointments } = data || {};

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Dashboard</h2>
        <p className="text-surface-500 mt-1">Your overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Assigned Schools"      value={stats?.totalSchools}    icon={School}        color="bg-primary-600" />
        <StatCard title="Total Students"         value={stats?.totalStudents}   icon={Users}         color="bg-accent-500" />
        <StatCard title="Unread Alerts (Week)"   value={stats?.unreadAlerts}    icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Appointments (Week)"    value={stats?.weekAppointments} icon={Calendar}     color="bg-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts Feed */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">⚠️ Active Alerts</h3>
            <Link to="/psychiatrist/alerts" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {!recentAlerts?.length ? (
            <EmptyState icon="✅" title="No alerts" description="No unread alerts at the moment." />
          ) : (
            <div className="divide-y divide-surface-50">
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`px-6 py-4 alert-card-${alert.severity.toLowerCase()}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-surface-900 text-sm">
                          {alert.student.firstName} {alert.student.lastName}
                        </span>
                        <SeverityBadge severity={alert.severity} size="xs" />
                      </div>
                      <p className="text-xs text-surface-500">{alert.student.school?.name}</p>
                      <p className="text-xs text-surface-400 mt-1">{formatRelative(alert.firedAt)}</p>
                    </div>
                    <Link to={`/psychiatrist/students/${alert.student.id}`}
                      className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Appointments */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">📅 Upcoming (48h)</h3>
            <Link to="/psychiatrist/appointments" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {!upcomingAppointments?.length ? (
            <EmptyState icon="📭" title="No upcoming appointments" description="Your schedule is clear for the next 48 hours." />
          ) : (
            <div className="divide-y divide-surface-50">
              {upcomingAppointments.map(appt => (
                <div key={appt.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-xs font-bold leading-none">
                      {new Date(appt.slot).getDate()}
                    </span>
                    <span className="text-primary-500 text-xs">
                      {new Date(appt.slot).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-surface-900 truncate">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </p>
                    <p className="text-xs text-surface-500">{formatDateTime(appt.slot)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${appt.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
