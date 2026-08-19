import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { School, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, Spinner, EmptyState, Badge, PageHeader } from '../../components/ui';
import api from '../../lib/axios';
import { formatRelative } from '../../utils/formatters';

function SchoolCard({ school }) {
  return (
    <Link to={`/psychiatrist/schools/${school.id}`}>
      <Card hover className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden">
            {school.logoUrl
              ? <img src={school.logoUrl} className="w-full h-full object-cover" alt="" />
              : <School className="w-6 h-6 text-primary-600" />
            }
          </div>
          {school.alertCount > 0 && (
            <Badge variant="danger">{school.alertCount} alert{school.alertCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <div>
          <p className="font-semibold text-surface-900">{school.name}</p>
          <p className="text-sm text-surface-500 mt-0.5">{school.address || school.contactEmail}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <Users className="w-3.5 h-3.5" />
            <span>{school._count?.users || 0} users</span>
          </div>
          {school.lastActivity && (
            <span className="text-xs text-surface-400">Last: {formatRelative(school.lastActivity)}</span>
          )}
          <ChevronRight className="w-4 h-4 text-surface-400" />
        </div>
      </Card>
    </Link>
  );
}

export default function SchoolOverview() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['psych-schools'],
    queryFn: () => api.get('/psychiatrist/schools').then(r => r.data),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['psych-school-students', id],
    queryFn: () => id ? api.get(`/psychiatrist/schools/${id}/students`).then(r => r.data) : null,
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  if (id) {
    // School detail view
    const school = data?.schools?.find(s => s.id === id);
    const students = studentsData?.students || [];

    return (
      <div className="space-y-6 animate-slide-up">
        <PageHeader backTo="/psychiatrist/schools" title={school?.name} description={school?.address} />

        <Card padding={false}>
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-900">Students ({students.length})</h3>
          </div>
          {studentsLoading ? <div className="flex justify-center py-12"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Grade</th><th>Last Test</th><th>Score</th><th>Alerts</th><th>Action</th></tr></thead>
                <tbody>
                  {students.map(s => {
                    const last = s.testResults?.[0];
                    const alerts = s.alerts?.length || 0;
                    return (
                      <tr key={s.id} className={alerts > 0 ? 'border-l-4 border-l-red-500' : ''}>
                        <td><span className="font-medium">{s.firstName} {s.lastName}</span></td>
                        <td>{s.grade || '—'}</td>
                        <td>{last?.test?.name || '—'}</td>
                        <td>{last ? `${last.score}/${last.maxScore}` : '—'}</td>
                        <td>{alerts > 0 ? <Badge variant="danger">{alerts}</Badge> : '—'}</td>
                        <td>
                          <Link to={`/psychiatrist/students/${s.id}`}
                            className="text-primary-600 text-sm hover:underline font-medium">View Profile</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Schools grid
  const schools = data?.schools || [];
  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="My Schools" description={`${schools.length} assigned school${schools.length !== 1 ? 's' : ''}`} />
      {!schools.length
        ? <EmptyState icon="🏫" title="No schools assigned" description="Contact your admin to assign schools." />
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {schools.map(s => <SchoolCard key={s.id} school={s} />)}
          </div>
      }
    </div>
  );
}
