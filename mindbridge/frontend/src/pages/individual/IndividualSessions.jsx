import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarPlus, CalendarDays, Download, Video, Lock, MessagesSquare, Hourglass, CheckCircle2, XCircle, CalendarCheck, Send } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { downloadPdf } from '../../utils/download';
import { formatDateTime } from '../../utils/formatters';

const STATUS = {
  PENDING: { label: 'Awaiting confirmation', icon: Hourglass, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Confirmed', icon: CalendarCheck, cls: 'bg-primary-50 text-primary-700 border-primary-100' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, cls: 'bg-surface-100 text-surface-500 border-surface-200' },
};

export default function IndividualSessions() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [slot, setSlot] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['individual-appointments'],
    queryFn: () => api.get('/individual/appointments').then((r) => r.data.appointments),
  });
  // Only clients who have unlocked the assessments can request a session
  const { data: dash } = useQuery({
    queryKey: ['individual-dashboard'],
    queryFn: () => api.get('/individual/dashboard').then((r) => r.data),
  });
  const unlocked = dash?.access?.unlocked;

  const request = useMutation({
    mutationFn: () => api.post('/individual/appointments', { slot: new Date(slot).toISOString(), message }),
    onSuccess: () => {
      success("Request sent! We'll confirm your session soon.");
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
    <div className="space-y-6 max-w-5xl animate-slide-up">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 to-primary-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-12 -bottom-16 w-48 h-48 rounded-full bg-accent-600/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0"><MessagesSquare className="w-7 h-7 text-accent-300" /></span>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl">Talk it through</h1>
            <p className="text-white/70 text-sm mt-1">A counsellor goes over your results with you. They'll already have them in front of them.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center"><CalendarPlus className="w-4 h-4" /></span>
            Request a session
          </h2>
          {unlocked === false ? (
            <div className="text-sm text-surface-600 flex gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-surface-400" />
              <p>Unlock the assessments first so your counsellor has your results to work with. <Link to="/individual" className="font-medium text-primary-700">Go to assessments</Link></p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); request.mutate(); }} className="space-y-4">
              <Input label="When suits you?" type="datetime-local" required value={slot} onChange={(e) => setSlot(e.target.value)} hint="We'll confirm this time or suggest another." />
              <div>
                <label htmlFor="session-msg" className="text-sm font-medium text-surface-700 block mb-1.5">Anything you'd like to talk about? (optional)</label>
                <textarea id="session-msg" className="form-input resize-none" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. exam stress, my results, sleep..." />
              </div>
              <Button type="submit" className="w-full" loading={request.isPending} disabled={!slot || unlocked === undefined} icon={<Send className="w-4 h-4" />}>Send request</Button>
            </form>
          )}
        </Card>

        <Card padding={false} className="lg:col-span-3">
          <div className="px-5 py-4 border-b border-surface-100">
            <h2 className="font-semibold text-surface-900 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary-600" /> Your sessions</h2>
          </div>
          {!appointments.length ? (
            <EmptyState icon={<CalendarDays className="w-6 h-6 text-surface-500" />} title="No sessions yet" description="Requested and scheduled sessions show up here." />
          ) : (
            <div className="divide-y divide-surface-100">
              {appointments.map((a) => {
                const st = STATUS[a.status] || STATUS.PENDING;
                const d = new Date(a.slot);
                return (
                  <div key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="w-14 text-center rounded-xl bg-primary-50 py-1.5 flex-shrink-0" aria-hidden="true">
                      <p className="text-[10px] font-semibold uppercase text-primary-600">{d.toLocaleString('en-IN', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-primary-800 leading-none">{d.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-[10rem]">
                      <p className="text-sm font-medium text-surface-900">{formatDateTime(a.slot)}</p>
                      <p className="text-xs text-surface-400">with {a.psychiatrist?.firstName} {a.psychiatrist?.lastName}</p>
                      <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.cls}`}><st.icon className="w-3 h-3" />{st.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.meetingLink && a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                        <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-800"><Video className="w-4 h-4" /> Join</a>
                      )}
                      {a.status === 'COMPLETED' && (
                        <button onClick={() => report(a.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700"><Download className="w-4 h-4" /> Report</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
