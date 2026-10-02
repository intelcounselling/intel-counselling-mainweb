import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Calendar } from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge, PageHeader, ListSkeleton } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime, getStatusColor } from '../../utils/formatters';

export default function AppointmentList() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-appointments'],
    queryFn: () => api.get('/parent/appointments').then(r => r.data),
  });

  const appointments = data?.appointments || [];

  const toast = useToast();

  // The report endpoint needs the Authorization header, which a plain
  // window.open() tab never sends — fetch it through the API client instead.
  const handleDownloadReport = async (apptId) => {
    try {
      const res = await api.get(`/appointments/${apptId}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-report-${apptId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error('Could not download the report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Appointments" description="Sessions booked for your children" />
        <Card padding={false}><ListSkeleton rows={4} /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Appointments"
        description={`${appointments.length} total appointment${appointments.length !== 1 ? 's' : ''}`}
      />

      {!appointments.length ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No appointments"
            description="You haven't booked a session yet."
            action={<Link to="/parent?book=1" className="inline-flex items-center rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">Book an appointment</Link>}
          />
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
