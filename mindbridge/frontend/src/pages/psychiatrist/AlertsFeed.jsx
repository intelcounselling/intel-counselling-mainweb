import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, Filter } from 'lucide-react';
import { Card, Button, Select, Spinner, EmptyState, Badge } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatRelative } from '../../utils/formatters';

const SEVERITY_ORDER = { severe: 0, 'moderately severe': 1, moderate: 2, high: 2, mild: 3, minimal: 4, low: 4 };

export default function AlertsFeed() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('UNREAD');

  const { data, isLoading } = useQuery({
    queryKey: ['psych-alerts', filter],
    queryFn: () => api.get('/psychiatrist/alerts', { params: { status: filter || undefined, limit: 50 } }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/psychiatrist/alerts/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psych-alerts'] }); success('Alert updated'); },
    onError: () => toastError('Failed to update alert'),
  });

  const alerts = (data?.alerts || []).sort((a, b) =>
    (SEVERITY_ORDER[a.severity.toLowerCase()] ?? 5) - (SEVERITY_ORDER[b.severity.toLowerCase()] ?? 5)
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Alerts</h2>
          <p className="text-surface-500">{alerts.length} alerts</p>
        </div>
        <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-36">
          <option value="">All</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
          <option value="ACTIONED">Actioned</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-12"><Spinner size="lg" /></div>
      ) : !alerts.length ? (
        <EmptyState icon="✅" title="No alerts" description="No alerts match the selected filter." />
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <Card key={alert.id} className={`alert-card-${alert.severity.toLowerCase()} !p-0 overflow-hidden`} padding={false}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-surface-900">
                        {alert.student.firstName} {alert.student.lastName}
                      </span>
                      <SeverityBadge severity={alert.severity} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        alert.status === 'UNREAD' ? 'bg-red-50 text-red-700 border-red-200' :
                        alert.status === 'ACTIONED' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-surface-100 text-surface-600 border-surface-200'
                      }`}>{alert.status}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-1">
                      🏫 {alert.student.school?.name} &nbsp;|&nbsp; 📚 Grade {alert.student.grade || 'N/A'}
                    </p>
                    <p className="text-sm text-surface-700">{alert.message}</p>
                    <p className="text-xs text-surface-400 mt-2">{formatRelative(alert.firedAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link to={`/psychiatrist/students/${alert.student.id}`}>
                    <Button variant="primary" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      View Profile
                    </Button>
                  </Link>
                  {alert.status === 'UNREAD' && (
                    <Button variant="outline" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />}
                      onClick={() => updateMutation.mutate({ id: alert.id, status: 'READ' })}>
                      Mark as Read
                    </Button>
                  )}
                  {alert.status !== 'ACTIONED' && (
                    <Button variant="ghost" size="sm"
                      onClick={() => updateMutation.mutate({ id: alert.id, status: 'ACTIONED' })}>
                      Mark Actioned
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
