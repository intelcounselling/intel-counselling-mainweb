import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarPlus, X, Clock } from 'lucide-react';
import { Card, Button, Modal, Input, Spinner, EmptyState, Badge } from '../../components/ui';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, formatDateTime, formatRelative, getInitials } from '../../utils/formatters';

function ChildSelector({ children, selected, onSelect }) {
  if (!children || children.length === 0) return null;
  if (children.length === 1) return null; // No tabs needed for single child

  return (
    <div className="flex gap-2 flex-wrap">
      {children.map(child => (
        <button
          key={child.id}
          onClick={() => onSelect(child)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${
            selected?.id === child.id
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-surface-600 border border-surface-200 hover:border-primary-300 hover:text-primary-700'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            selected?.id === child.id ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
          }`}>
            {getInitials(child)}
          </div>
          {child.firstName} {child.lastName}
        </button>
      ))}
    </div>
  );
}

function BookingModal({ child, onClose, onSuccess }) {
  const { success, error: toastError } = useToast();
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Fetch psychiatrists for the school
  const { data: psychData } = useQuery({
    queryKey: ['school-psychiatrists', child?.schoolId],
    queryFn: () => api.get('/parent/children').then(r => r.data),
    enabled: !!child,
  });
  const [psychiatristId, setPsychiatristId] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/parent/appointments', { childId: child.id, psychiatristId, slot, notes, meetingLink }),
    onSuccess: () => { success('Appointment booked! A confirmation has been sent.'); onSuccess?.(); onClose(); },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to book appointment'),
  });

  return (
    <Modal isOpen title={`Book Appointment for ${child?.firstName}`} onClose={onClose} size="md"
      footer={
        <Button variant="primary" className="w-full" loading={mutation.isPending}
          disabled={!slot} onClick={() => mutation.mutate()}>
          Confirm Booking
        </Button>
      }>
      <div className="space-y-4">
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-800">
          📎 The last 3 assessments for {child?.firstName} will be automatically attached to this appointment.
        </div>
        <Input label="Preferred Date & Time" type="datetime-local" required value={slot} onChange={e => setSlot(e.target.value)} />
        <Input label="Meeting Link (optional)" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
        <div>
          <label className="text-sm font-medium text-surface-700 block mb-1.5">Notes</label>
          <textarea className="form-input resize-none" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context for the session..." />
        </div>
      </div>
    </Modal>
  );
}

export default function ParentDashboard() {
  const qc = useQueryClient();
  const [selectedChild, setSelectedChild] = useState(null);
  const [showBook, setShowBook] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parent/dashboard').then(r => r.data),
  });

  // Set default selected child once data loads (RQ v5 — no onSuccess in useQuery)
  useEffect(() => {
    if (data?.children?.length && !selectedChild) {
      setSelectedChild(data.children[0]);
    }
  }, [data]);

  const children = data?.children || [];
  const currentChild = selectedChild || children[0];

  const { data: resultsData } = useQuery({
    queryKey: ['parent-child-results', currentChild?.id],
    queryFn: () => currentChild ? api.get(`/parent/children/${currentChild.id}/results`).then(r => r.data) : null,
    enabled: !!currentChild,
  });

  const results = resultsData?.results || [];
  const lastResult = results[0];
  const hasAlert = currentChild?.alerts?.length > 0;

  // Fetch actual appointments to determine if there is an active appointment
  const { data: apptData } = useQuery({
    queryKey: ['parent-appointments'],
    queryFn: () => api.get('/parent/appointments').then(r => r.data),
  });
  
  const hasActiveAppt = apptData?.appointments?.some(
    a => a.patientId === currentChild?.id && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  ) || false;

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  if (!children.length) return (
    <EmptyState icon="👶" title="No children linked" description="Contact your school admin to link children to your account." />
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-surface-900">Parent Dashboard</h2>
        <div className="flex gap-2">
          {currentChild && (
            <Link to={`/parent/children/${currentChild.id}/comparison`}>
              <Button variant="outline" size="sm">📊 Comparison Report</Button>
            </Link>
          )}
          <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />} onClick={() => setShowBook(true)}>
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <ChildSelector children={children} selected={currentChild} onSelect={setSelectedChild} />
      )}

      {/* Alert Banner */}
      {hasAlert && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">
              ⚠️ We recommend booking a session for {currentChild?.firstName}
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Their school's psychiatrist has been notified. Please book an appointment as soon as possible.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowBook(true)}>Book Now</Button>
        </div>
      )}

      {/* Child Overview */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
            {getInitials(currentChild)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-surface-900">{currentChild?.firstName} {currentChild?.lastName}</h3>
            <p className="text-surface-500">Grade {currentChild?.grade} · {currentChild?.school?.name}</p>
            {lastResult && (
              <p className="text-sm text-surface-400 mt-0.5">Last assessed: {formatRelative(lastResult.takenAt)}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Score Chart */}
      {results.length > 0 && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Assessment History</h3>
          <ScoreHistoryChart results={results} height={240} />
        </Card>
      )}

      {/* Latest Result */}
      {lastResult && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Latest Result</h3>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-surface-500">{lastResult.test?.name} · {formatDate(lastResult.takenAt)}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold text-surface-900">{lastResult.score}</span>
                <span className="text-surface-400 text-lg">/ {lastResult.maxScore}</span>
                <SeverityBadge severity={lastResult.severity} size="md" />
              </div>
            </div>
            <Link to={`/parent/children/${currentChild?.id}/results`}>
              <Button variant="outline" size="sm">View All Results</Button>
            </Link>
          </div>
          {/* Score bar */}
          <div className="mt-4">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(lastResult.score / lastResult.maxScore) * 100}%` }} />
            </div>
          </div>
        </Card>
      )}

      {!results.length && (
        <EmptyState icon="📋" title="No assessments yet" description={`${currentChild?.firstName} hasn't taken any tests yet.`} />
      )}

      {showBook && currentChild && (
        <BookingModal
          child={currentChild}
          onClose={() => setShowBook(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['parent-appointments'] })}
        />
      )}
    </div>
  );
}
