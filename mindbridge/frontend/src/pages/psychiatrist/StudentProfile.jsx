import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CalendarPlus, Download } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState, Badge, PageHeader } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import SeverityBadge from '../../components/charts/SeverityBadge';
import CounsellingPanel from '../../components/CounsellingPanel';
import IndividualProfileView from '../../components/IndividualProfileView';
import { downloadPdf } from '../../utils/download';
import api from '../../lib/axios';
import { formatDate, formatDateTime, formatRelative, getStatusColor } from '../../utils/formatters';

function BookAppointmentInline({ patientId, resultIds, onSuccess }) {
  const { success, error: toastError } = useToast();
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/psychiatrist/appointments', { patientId, slot, notes, meetingLink, ...(resultIds?.length && { resultIds }) }),
    onSuccess: () => { success('Appointment booked!'); onSuccess?.(); },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to book'),
  });

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 space-y-4">
      <h4 className="text-sm font-semibold text-primary-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Book Appointment</h4>
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

  const { student, results = [], alerts = [], appointments = [], profile, modules = [] } = data || {};
  const isIndividual = student?.role === 'INDIVIDUAL';
  // Individual clients: attach their latest result in each test to the session so it's all at hand
  const latestIds = isIndividual
    ? Object.values(results.reduce((acc, r) => (acc[r.test?.category] ? acc : { ...acc, [r.test?.category]: r.id }), {}))
    : [];
  const downloadReport = () => downloadPdf(`/admin/students/${id}/pdf-report`, `Client_Report_${student.firstName}_${student.lastName}.pdf`);
  const infoItems = isIndividual
    ? [
        { label: 'Client type', value: 'Individual' },
        { label: 'Modules', value: modules.length ? modules.map((m) => 'Module ' + m).join(', ') : 'None purchased' },
        { label: 'Phone', value: student?.phone || '—' },
        { label: 'Email', value: student?.email },
      ]
    : [
        { label: 'Date of Birth', value: student?.dateOfBirth ? formatDate(student.dateOfBirth) : '—' },
        { label: 'Grade',         value: student?.grade || '—' },
        { label: 'School',        value: student?.school?.name || '—' },
        { label: 'Email',         value: student?.email },
      ];

  return (
    <div className="space-y-6 max-w-5xl animate-slide-up">
      <PageHeader
        backTo={isIndividual ? '/psychiatrist/individuals' : '/psychiatrist/schools'}
        title={`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student Profile'}
        description={isIndividual ? 'Individual client' : `Grade ${student?.grade || '—'} · ${student?.school?.name || ''}`}
        actions={(
          <>
            {isIndividual && (
              <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={downloadReport}>Download report</Button>
            )}
            <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />}
              onClick={() => setShowBook(v => !v)}>
              {showBook ? 'Cancel' : 'Book Appointment'}
            </Button>
          </>
        )}
      />

      {/* Patient info */}
      <Card>
        <div className="grid sm:grid-cols-4 gap-4">
          {infoItems.map(i => (
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
          resultIds={latestIds}
          onSuccess={() => { setShowBook(false); qc.invalidateQueries({ queryKey: ['psych-student', id] }); }}
        />
      )}

      {/* Individual clients: integrated psychological profile */}
      {isIndividual && profile && (
        <div>
          <h3 className="text-base font-semibold text-surface-900 mb-3">Integrated profile</h3>
          <IndividualProfileView profile={profile} />
        </div>
      )}

      {/* Score History Chart */}
      {results.length > 0 && (
        <Card>
          <h3 className="text-base font-semibold text-surface-900 mb-4">Score History</h3>
          <ScoreHistoryChart results={results} height={260} />
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-900">Alerts ({alerts.length})</h3>
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
            <h3 className="text-base font-semibold text-surface-900">Appointments ({appointments.length})</h3>
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
          <h3 className="text-base font-semibold text-surface-900">Assessment History ({results.length})</h3>
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
