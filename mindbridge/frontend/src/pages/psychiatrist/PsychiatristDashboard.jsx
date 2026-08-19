import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Users, School, Calendar, ChevronRight, Eye, CalendarPlus } from 'lucide-react';
import { Card, EmptyState, PageHeader, StatCard, StatRowSkeleton, ListSkeleton } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { formatDateTime, formatRelative, getAlertCardClass } from '../../utils/formatters';

export default function PsychiatristDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['psych-dashboard'],
    queryFn: () => api.get('/psychiatrist/dashboard').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Your overview for today" />
        <StatRowSkeleton count={4} />
        <div className="grid lg:grid-cols-2 gap-6">
          <Card padding={false}><ListSkeleton rows={3} /></Card>
          <Card padding={false}><ListSkeleton rows={3} /></Card>
        </div>
      </div>
    );
  }

  const { stats, recentAlerts, upcomingAppointments } = data || {};

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Dashboard" description="Your overview for today" />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Assigned Schools"     value={stats?.totalSchools}     icon={School}        tone="primary" />
        <StatCard label="Total Students"       value={stats?.totalStudents}    icon={Users}         tone="primary" />
        <StatCard label="Unread Alerts (Week)" value={stats?.unreadAlerts}     icon={AlertTriangle} tone="danger" />
        <StatCard label="Appointments (Week)"  value={stats?.weekAppointments} icon={Calendar}      tone="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts Feed */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Active Alerts
            </h3>
            <Link to="/psychiatrist/alerts" className="text-sm font-medium text-primary-700 hover:underline">View all</Link>
          </div>
          {!recentAlerts?.length ? (
            <EmptyState icon="✅" title="No alerts" description="No unread alerts at the moment." />
          ) : (
            <div className="divide-y divide-surface-50">
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`px-6 py-4 ${getAlertCardClass(alert.severity)}`}>
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
                      aria-label="View student profile"
                      className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-700">
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
            <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              Upcoming (48h)
            </h3>
            <Link to="/psychiatrist/appointments" className="text-sm font-medium text-primary-700 hover:underline">View all</Link>
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
