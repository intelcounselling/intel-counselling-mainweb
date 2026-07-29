import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { School, Users, AlertTriangle, ArrowRight, Activity, ShieldCheck, Brain, HeartPulse, Moon, Smartphone, Sparkles, Clock, CalendarPlus } from 'lucide-react';
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

  const { data: severeData } = useQuery({
    queryKey: ['admin-severe-no-appt'],
    queryFn: () => api.get('/admin/severe-no-appt').then(r => r.data),
    refetchInterval: 60000,
  });

  const severeStudents = severeData?.students || [];

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
          {/* At-Risk — No Appointment Panel */}
          <Card padding={false} className="overflow-hidden border-red-200/70 shadow-sm">
            <div className="px-6 py-5 border-b border-red-100 bg-red-50/60 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                At-Risk — No Appointment
                {severeStudents.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {severeStudents.length}
                  </span>
                )}
              </h3>
              <span className="text-xs text-red-400 font-medium">Students flagged severe with no upcoming session</span>
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
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-600 text-primary-600 hover:text-white flex items-center justify-center transition-colors"
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

          <h3 className="text-lg font-semibold text-surface-900 mt-8">Main Website Activity</h3>
          <Card className="p-5 border-surface-200/50 shadow-sm bg-white rounded-2xl">
            <p className="text-sm text-surface-500 mb-4">Total completions per assessment type</p>
            <div className="space-y-4">
              {[
                { label: 'Career Guidance Assessment', count: stats?.mainWebsiteStats?.career || 0, icon: Sparkles, color: 'text-amber-500 bg-amber-50 animate-pulse' },
                { label: 'Depression Screening (PHQ-9)', count: stats?.mainWebsiteStats?.phq9 || 0, icon: HeartPulse, color: 'text-red-500 bg-red-50' },
                { label: 'Anxiety Screening (GAD-7)', count: stats?.mainWebsiteStats?.gad7 || 0, icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
                { label: 'Stress Self-Check (PSS-10)', count: stats?.mainWebsiteStats?.pss10 || 0, icon: Brain, color: 'text-amber-700 bg-amber-50' },
                { label: 'Sleep Hygiene Check', count: stats?.mainWebsiteStats?.sleep || 0, icon: Moon, color: 'text-indigo-500 bg-indigo-50' },
                { label: 'Smartphone Addiction (SAS)', count: stats?.mainWebsiteStats?.sas || 0, icon: Smartphone, color: 'text-blue-500 bg-blue-50' }
              ].map((test, index) => {
                const Icon = test.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${test.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-surface-700 truncate">{test.label}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-800 bg-surface-100 px-2.5 py-1 rounded-md shrink-0">
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
  );
}
