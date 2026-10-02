import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarPlus, Download, Video } from 'lucide-react';
import { Card, Button, Input, Spinner, PageHeader, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { downloadPdf } from '../../utils/download';
import { formatDateTime, getStatusColor } from '../../utils/formatters';

const STATUS_LABEL = { PENDING: 'Awaiting confirmation', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };

export default function IndividualSessions() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [slot, setSlot] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['individual-appointments'],
    queryFn: () => api.get('/individual/appointments').then((r) => r.data.appointments),
  });
  // Only clients who have unlocked a module can request a session
  const { data: dash } = useQuery({
    queryKey: ['individual-dashboard'],
    queryFn: () => api.get('/individual/dashboard').then((r) => r.data),
  });
  const unlocked = dash?.modules?.some((m) => m.owned);

  const request = useMutation({
    mutationFn: () => api.post('/individual/appointments', { slot: new Date(slot).toISOString(), message }),
    onSuccess: () => {
      success('Session requested. A counsellor will confirm the time.');
      setSlot('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['individual-appointments'] });
      qc.invalidateQueries({ queryKey: ['individual-dashboard'] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Could not request the session.'),
  });

  const report = async (id) => {
    try {
      await downloadPdf(`/appointments/${id}/report`, 'Intel_Counselling_Session_Report.pdf');
    } catch {
      toastError('Could not download the report.');
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;
  const appointments = data || [];

  return (
    <div className="space-y-6 max-w-4xl animate-slide-up">
      <PageHeader title="Counselling sessions" description="Your counsellor sees your results during the session." />

      <Card>
        <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-4"><CalendarPlus className="w-4 h-4" /> Request a session</h3>
        {unlocked === false ? (
          <p className="text-sm text-surface-500">
            Unlock a module first so your counsellor has your results to work with. <Link to="/individual" className="font-medium text-primary-700">Go to assessments</Link>
          </p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); request.mutate(); }} className="space-y-4">
            <Input label="Preferred date and time" type="datetime-local" required value={slot} onChange={(e) => setSlot(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1.5">What would you like to talk about? (optional)</label>
              <textarea className="form-input resize-none" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" loading={request.isPending} disabled={!slot || unlocked === undefined}>Send request</Button>
          </form>
        )}
      </Card>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-surface-100"><h3 className="font-semibold text-surface-900">Your sessions</h3></div>
        {!appointments.length ? (
          <EmptyState icon="○" title="No sessions yet" description="Requested and scheduled sessions appear here." />
        ) : (
          <div className="divide-y divide-surface-50">
            {appointments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm font-medium text-surface-900">{formatDateTime(a.slot)}</p>
                  <p className="text-xs text-surface-400">with {a.psychiatrist?.firstName} {a.psychiatrist?.lastName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(a.status)}`}>{STATUS_LABEL[a.status] || a.status}</span>
                {a.meetingLink && a.status !== 'CANCELLED' && (
                  <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700"><Video className="w-4 h-4" /> Join</a>
                )}
                {a.status === 'COMPLETED' && (
                  <button onClick={() => report(a.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700"><Download className="w-4 h-4" /> Report</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
