import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { School, Users, AlertTriangle, ArrowRight, Activity, ShieldCheck, Brain, HeartPulse, Moon, Smartphone, Sparkles, Clock, CalendarPlus, Check } from 'lucide-react';
import { Card, EmptyState, PageHeader, StatCard, StatRowSkeleton, ListSkeleton } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { formatRelative } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';

export default function AdminDashboard() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  const { data: severeData } = useQuery({
    queryKey: ['admin-severe-no-appt'],
    queryFn: () => api.get('/admin/severe-no-appt').then(r => r.data),
    refetchInterval: 60000,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/alerts/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      success('Alert resolved successfully');
    },
    onError: () => toastError('Failed to resolve alert'),
  });

  const severeStudents = severeData?.students || [];
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  if (isSchoolAdmin && user?.schoolId) {
    return <Navigate to={`/admin/schools/${user.schoolId}/dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader title="Platform Overview" description="Global activity across all schools" />
        <StatRowSkeleton count={4} />
        <Card padding={false}><ListSkeleton rows={4} /></Card>
      </div>
    );
  }

  const { stats, recentAlerts } = data || {};

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl">
      <PageHeader
        title="Platform Overview"
        description="Global activity and student wellbeing across all schools"
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Schools" value={stats?.totalSchools} icon={School} tone="primary" />
        <StatCard label="Total Students" value={stats?.totalStudents} icon={Users} tone="primary" />
        <StatCard label="Total Parents" value={stats?.totalParents} icon={Users} tone="primary" />
        <StatCard label="Alerts This Month" value={stats?.alertsThisMonth} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* At-Risk — No Appointment Panel */}
          <Card padding={false} className="overflow-hidden border-red-200/70">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/60 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                At-Risk — No Appointment
                {severeStudents.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {severeStudents.length}
                  </span>
                )}
              </h3>
              <span className="text-xs text-red-500/80 font-medium">Students flagged severe with no upcoming session</span>
            </div>
            {severeStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-surface-400">
                <ShieldCheck className="w-10 h-10 text-green-400 mb-2" />
                <p className="text-sm font-medium text-green-600">All flagged students have appointments booked</p>
              </div>
            ) : (
              <div className="divide-y divide-red-50">
                {severeStudents.map(student => {
                  const urgency = student.daysSince >= 14
                    ? { ring: 'border-l-4 border-red-500', dot: 'bg-red-500', label: 'Critical', labelColor: 'text-red-600 bg-red-50' }
                    : student.daysSince >= 7
                    ? { ring: 'border-l-4 border-orange-400', dot: 'bg-orange-400', label: 'Urgent', labelColor: 'text-orange-600 bg-orange-50' }
                    : { ring: 'border-l-4 border-yellow-400', dot: 'bg-yellow-400', label: 'Monitor', labelColor: 'text-yellow-700 bg-yellow-50' };

                  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

                  return (
                    <div key={student.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-red-50/40 transition-colors ${urgency.ring}`}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center flex-shrink-0 font-bold text-surface-600 text-sm">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-surface-500 truncate mt-0.5">
                          {student.school?.name} &middot; {student.testName}
                        </p>
                      </div>

                      {/* Severity */}
                      <SeverityBadge severity={student.severity} />

                      {/* Urgency label */}
                      <span className={`hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.labelColor}`}>
                        {urgency.label}
                      </span>

                      {/* Days since */}
                      <span className="flex items-center gap-1 text-xs text-surface-400 flex-shrink-0 w-20 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        {student.daysSince === 0 ? 'Today' : `${student.daysSince}d ago`}
                      </span>

                      {/* Schedule button */}
                      <button
                        title="Schedule appointment"
                        aria-label="Schedule appointment"
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-700 text-primary-700 hover:text-white flex items-center justify-center transition-colors"
                        onClick={() => window.location.href = `/admin/users`}
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <Card padding={false} className="overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-600" />
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <SeverityBadge severity={alert.severity} />
                      <button
                        title="Resolve alert"
                        aria-label="Resolve alert"
                        className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-600 text-green-600 hover:text-white flex items-center justify-center transition-colors border border-transparent"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs font-medium text-surface-400 flex-shrink-0 w-20 text-right">
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
          <div>
            <h3 className="text-base font-semibold text-surface-900 mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link to="/admin/schools" className="group flex items-center justify-between p-4 rounded-xl bg-white border border-surface-200/70 shadow-card hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-surface-900">Manage Schools</h4>
                    <p className="text-xs text-surface-500 mt-0.5">Add or edit schools</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-600 transition-colors" />
              </Link>

              <Link to="/admin/users" className="group flex items-center justify-between p-4 rounded-xl bg-white border border-surface-200/70 shadow-card hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-surface-900">User Directory</h4>
                    <p className="text-xs text-surface-500 mt-0.5">Manage all platform users</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-600 transition-colors" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-surface-900 mb-3">Main Website Activity</h3>
            <Card className="p-5">
              <p className="text-xs text-surface-500 mb-4">Total completions per assessment type</p>
              <div className="space-y-1">
                {[
                  { label: 'Career Guidance Assessment', count: stats?.mainWebsiteStats?.career || 0, icon: Sparkles },
                  { label: 'Depression Screening (PHQ-9)', count: stats?.mainWebsiteStats?.phq9 || 0, icon: HeartPulse },
                  { label: 'Anxiety Screening (GAD-7)', count: stats?.mainWebsiteStats?.gad7 || 0, icon: Activity },
                  { label: 'Stress Self-Check (PSS-10)', count: stats?.mainWebsiteStats?.pss10 || 0, icon: Brain },
                  { label: 'Sleep Hygiene Check', count: stats?.mainWebsiteStats?.sleep || 0, icon: Moon },
                  { label: 'Smartphone Addiction (SAS)', count: stats?.mainWebsiteStats?.sas || 0, icon: Smartphone }
                ].map((test, index) => {
                  const Icon = test.icon;
                  return (
                    <div key={index} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface-100 text-surface-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-surface-700 truncate">{test.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-surface-800 tabular-nums shrink-0">
                        {test.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
