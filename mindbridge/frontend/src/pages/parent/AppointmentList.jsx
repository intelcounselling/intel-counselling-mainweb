import { useQuery } from '@tanstack/react-query';
import { Download, Calendar } from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { formatDateTime, getStatusColor } from '../../utils/formatters';

export default function AppointmentList() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-appointments'],
    queryFn: () => api.get('/parent/appointments').then(r => r.data),
  });

  const appointments = data?.appointments || [];

  const handleDownloadReport = (apptId) => {
    window.open(`${import.meta.env.VITE_API_URL || ''}/api/portal/api/appointments/${apptId}/report`, '_blank');
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Appointments</h2>
        <p className="text-surface-500">{appointments.length} total appointments</p>
      </div>

      {!appointments.length ? (
        <Card>
          <EmptyState icon="📅" title="No appointments" description="Book your first appointment from the dashboard." />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Child</th><th>Date & Time</th><th>Psychiatrist</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      <p className="font-medium text-surface-900">{appt.patient?.firstName} {appt.patient?.lastName}</p>
                      <p className="text-xs text-surface-400">Grade {appt.patient?.grade}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-sm">{formatDateTime(appt.slot)}</span>
                      </div>
                    </td>
                    <td className="text-sm">Dr. {appt.psychiatrist?.firstName} {appt.psychiatrist?.lastName}</td>
                    <td>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="text-sm text-surface-500 max-w-xs truncate">{appt.notes || '—'}</td>
                    <td>
                      {appt.status === 'COMPLETED' && (
                        <Button variant="outline" size="xs" icon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => handleDownloadReport(appt.id)}>
                          Report
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
