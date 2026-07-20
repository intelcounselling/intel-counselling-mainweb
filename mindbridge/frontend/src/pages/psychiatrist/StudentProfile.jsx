import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CalendarPlus } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import SeverityBadge from '../../components/charts/SeverityBadge';
import CounsellingPanel from '../../components/CounsellingPanel';
import api from '../../lib/axios';
import { formatDate, formatDateTime, formatRelative, getStatusColor } from '../../utils/formatters';

function BookAppointmentInline({ patientId, onSuccess }) {
  const { success, error: toastError } = useToast();
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/psychiatrist/appointments', { patientId, slot, notes, meetingLink }),
    onSuccess: () => { success('Appointment booked!'); onSuccess?.(); },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to book'),
  });

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 space-y-4">
      <h4 className="font-semibold text-primary-900">📅 Book Appointment</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Date & Time" type="datetime-local" value={slot} onChange={e => setSlot(e.target.value)} required />
        <Input label="Meeting Link" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
      </div>
      <div>
        <label className="text-sm font-medium text-surface-700 block mb-1.5">Notes</label>
        <textarea className="form-input resize-none" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes..." />
      </div>
      <Button variant="primary" loading={mutation.isPending} disabled={!slot} onClick={() => mutation.mutate()}>
        Confirm Appointment
      </Button>
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const [showBook, setShowBook] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['psych-student', id],
    queryFn: () => api.get(`/psychiatrist/students/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { student, results = [], alerts = [], appointments = [] } = data || {};

  return (
    <div className="space-y-6 max-w-5xl animate-slide-up">
      <div className="flex items-center gap-4">
        <Link to="/psychiatrist/schools" className="p-2 hover:bg-surface-200 rounded-xl text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-surface-900">
            {student?.firstName} {student?.lastName}
          </h2>
          <p className="text-surface-500">Grade {student?.grade} · {student?.school?.name}</p>
        </div>
        <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />}
          onClick={() => setShowBook(v => !v)}>
          {showBook ? 'Cancel' : 'Book Appointment'}
        </Button>
      </div>

      {/* Patient info */}
      <Card>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Date of Birth', value: student?.dateOfBirth ? formatDate(student.dateOfBirth) : '—' },
            { label: 'Grade',         value: student?.grade || '—' },
            { label: 'School',        value: student?.school?.name || '—' },
            { label: 'Email',         value: student?.email },
          ].map(i => (
            <div key={i.label}>
              <p className="text-xs text-surface-400 uppercase tracking-wide">{i.label}</p>
              <p className="font-semibold text-surface-800 mt-0.5 text-sm">{i.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Inline booking form */}
      {showBook && (
        <BookAppointmentInline
          patientId={id}
          onSuccess={() => { setShowBook(false); qc.invalidateQueries({ queryKey: ['psych-student', id] }); }}
        />
      )}

      {/* Score History Chart */}
      {results.length > 0 && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Score History</h3>
          <ScoreHistoryChart results={results} height={260} />
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="font-semibold">Alerts ({alerts.length})</h3>
          </div>
          {!alerts.length ? (
            <EmptyState icon="✅" title="No alerts" />
          ) : (
            <div className="divide-y divide-surface-50">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <SeverityBadge severity={a.severity} size="xs" />
                  <p className="text-sm text-surface-700 flex-1 truncate">{a.message}</p>
                  <span className="text-xs text-surface-400">{formatRelative(a.firedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Appointments */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="font-semibold">Appointments ({appointments.length})</h3>
          </div>
          {!appointments.length ? (
            <EmptyState icon="📭" title="No appointments" />
          ) : (
            <div className="divide-y divide-surface-50">
              {appointments.map(appt => (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-900">{formatDateTime(appt.slot)}</p>
                    <p className="text-xs text-surface-400">Dr. {appt.psychiatrist?.firstName} {appt.psychiatrist?.lastName}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* All Results */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold">Assessment History ({results.length})</h3>
        </div>
        {!results.length ? (
          <EmptyState icon="📋" title="No assessments taken" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Test</th><th>Date</th><th>Score</th><th>Severity</th><th>Shared</th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.test?.name}</td>
                    <td className="text-surface-500">{formatDate(r.takenAt)}</td>
                    <td>{r.score}/{r.maxScore}</td>
                    <td><SeverityBadge severity={r.severity} size="xs" /></td>
                    <td>{r.sharedWithTherapist ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Package 3: Counselling Notes & Progress */}
      <CounsellingPanel patientId={id} />
    </div>
  );
}
