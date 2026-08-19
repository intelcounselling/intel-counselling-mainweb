import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, List,
  X, User, School, AlertTriangle, Clock, CheckCircle,
  FileText, ChevronDown, ChevronUp, Search, Link2,
  CalendarPlus, BookOpen
} from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, formatDateTime, formatRelative } from '../../utils/formatters';

// ── Constants ────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const STATUS_COLORS = {
  PENDING:   'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

// ── Calendar grid ─────────────────────────────────────────────
function MonthCalendar({ year, month, appointments, selectedDay, onSelectDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getAppts = (day) => {
    if (!day) return [];
    return appointments.filter(a => {
      const d = new Date(a.slot);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const isToday = (day) =>
    day &&
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-surface-400 py-2 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-surface-100 rounded-2xl overflow-hidden border border-surface-100">
        {cells.map((day, i) => {
          const appts = getAppts(day);
          const isSelected = selectedDay === day;
          const hasAlert = appts.some(a => a.patient?.alerts?.length > 0);

          return (
            <div
              key={i}
              onClick={() => day && onSelectDay(day)}
              className={[
                'bg-white min-h-[92px] p-2 transition-all relative',
                day ? 'cursor-pointer hover:bg-primary-50/60' : 'bg-surface-50',
                isSelected ? 'bg-primary-50 ring-2 ring-primary-400 ring-inset z-10' : '',
              ].join(' ')}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={[
                      'text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full',
                      isToday(day) ? 'bg-primary-600 text-white' : 'text-surface-700',
                    ].join(' ')}>
                      {day}
                    </span>
                    {hasAlert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {appts.slice(0, 2).map(a => (
                      <div
                        key={a.id}
                        className={[
                          'text-[10px] rounded px-1.5 py-0.5 truncate font-medium',
                          a.patient?.alerts?.length > 0
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-primary-100 text-primary-800',
                        ].join(' ')}
                      >
                        {a.patient?.firstName} {a.patient?.lastName?.[0]}.
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className="text-[10px] text-primary-600 font-semibold px-1">
                        +{appts.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Test history row (collapsible) ────────────────────────────
function TestHistoryRow({ result }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-surface-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-800 truncate">{result.test?.name}</p>
          <p className="text-xs text-surface-400">{formatDate(result.takenAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-surface-700">{result.score}/{result.maxScore}</span>
          <SeverityBadge severity={result.severity} size="xs" />
          {open ? <ChevronUp className="w-3.5 h-3.5 text-surface-400" /> : <ChevronDown className="w-3.5 h-3.5 text-surface-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 bg-surface-50 border-t border-surface-100">
          <p className="text-xs text-surface-500 mt-2">
            Category: <span className="font-medium text-surface-700">{result.test?.category || 'N/A'}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Student detail side panel ─────────────────────────────────
function StudentDetailPanel({ studentId, onClose, onSchedule }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-student-history', studentId],
    queryFn: () => api.get(`/admin/students/${studentId}/history`).then(r => r.data.student),
    enabled: !!studentId,
  });

  if (!studentId) return null;

  const student = data;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 flex-shrink-0">
        <h3 className="font-semibold text-surface-900 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          Student Profile
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg text-surface-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-1 py-8">
          <Spinner size="md" />
        </div>
      ) : !student ? (
        <div className="flex-1 flex items-center justify-center text-surface-400 text-sm">
          Student not found
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-surface-900">{student.firstName} {student.lastName}</p>
              <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-1">
                <School className="w-3 h-3" />
                {student.school?.name} {student.grade ? `· Grade ${student.grade}` : ''}
              </p>
              <p className="text-xs text-surface-400 truncate mt-0.5">{student.email}</p>
            </div>
          </div>

          {/* Active alerts */}
          {student.alerts?.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Active Alerts ({student.alerts.length})
              </p>
              <div className="space-y-1">
                {student.alerts.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <SeverityBadge severity={a.severity} size="xs" />
                    <span className="text-xs text-red-600">{formatRelative(a.firedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule button */}
          <Button
            variant="primary"
            size="sm"
            icon={<CalendarPlus className="w-4 h-4" />}
            className="w-full"
            onClick={() => onSchedule(student)}
          >
            Schedule Appointment
          </Button>

          {/* Upcoming appointments */}
          {student.appointments?.filter(a => new Date(a.slot) >= new Date()).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Upcoming Sessions</p>
              <div className="space-y-2">
                {student.appointments
                  .filter(a => new Date(a.slot) >= new Date())
                  .slice(0, 3)
                  .map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-800">{formatDateTime(a.slot)}</p>
                        <p className="text-xs text-blue-600">Dr. {a.psychiatrist?.firstName} {a.psychiatrist?.lastName}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Test history */}
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Test History ({student.testResults?.length || 0})
            </p>
            {!student.testResults?.length ? (
              <p className="text-sm text-surface-400 text-center py-4">No tests taken yet</p>
            ) : (
              <div className="space-y-2">
                {student.testResults.map(r => (
                  <TestHistoryRow key={r.id} result={r} />
                ))}
              </div>
            )}
          </div>

          {/* Past sessions */}
          {student.appointments?.filter(a => new Date(a.slot) < new Date()).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Past Sessions</p>
              <div className="space-y-2">
                {student.appointments
                  .filter(a => new Date(a.slot) < new Date())
                  .slice(0, 5)
                  .map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-surface-50 border border-surface-100 rounded-xl px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-surface-700">{formatDate(a.slot)}</p>
                        <p className="text-xs text-surface-400">Dr. {a.psychiatrist?.firstName} {a.psychiatrist?.lastName}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[a.status] || ''}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Appointment Modal ───────────────────────────────────
function CreateAppointmentModal({ isOpen, onClose, prefillStudent }) {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(prefillStudent || null);
  const [selectedPsych, setSelectedPsych] = useState('');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedResults, setSelectedResults] = useState([]);
  const [step, setStep] = useState(prefillStudent ? 2 : 1);

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-appt-students', search],
    queryFn: () => api.get('/admin/appointment-students', { params: search ? { search } : {} }).then(r => r.data.students),
    enabled: isOpen,
    staleTime: 30000,
  });

  const { data: psychData } = useQuery({
    queryKey: ['admin-psychiatrists'],
    queryFn: () => api.get('/admin/psychiatrists').then(r => r.data.psychiatrists),
    enabled: isOpen,
  });

  const { data: historyData } = useQuery({
    queryKey: ['admin-student-history', selectedStudent?.id],
    queryFn: () => api.get(`/admin/students/${selectedStudent?.id}/history`).then(r => r.data.student),
    enabled: !!selectedStudent?.id && step === 2,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/appointments', payload),
    onSuccess: () => {
      success('Appointment created! Parents notified by email.');
      qc.invalidateQueries({ queryKey: ['admin-appointments'] });
      qc.invalidateQueries({ queryKey: ['admin-severe-no-appt'] });
      onClose();
    },
    onError: (e) => toastError(e?.response?.data?.error || 'Failed to create appointment'),
  });

  const students = studentsData || [];
  const psychiatrists = psychData || [];

  const atRiskFirst = useMemo(() => [
    ...students.filter(s => s.alerts?.length > 0),
    ...students.filter(s => !s.alerts?.length),
  ], [students]);

  const handleSubmit = () => {
    if (!selectedStudent || !selectedPsych || !slot) {
      toastError('Please fill all required fields');
      return;
    }
    createMutation.mutate({
      patientId: selectedStudent.id,
      psychiatristId: selectedPsych,
      slot: new Date(slot).toISOString(),
      notes: notes || undefined,
      meetingLink: meetingLink || undefined,
      resultIds: selectedResults,
    });
  };

  const toggleResult = (id) =>
    setSelectedResults(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-surface-900">Schedule Appointment</h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Step {step} of 2 — {step === 1 ? 'Choose Student' : 'Appointment Details'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-xl text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-shrink-0">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                step >= s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-400',
              ].join(' ')}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div className={['flex-1 h-0.5 rounded-full transition-colors', step > s ? 'bg-primary-600' : 'bg-surface-100'].join(' ')} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── Step 1: Student picker ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {loadingStudents ? (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
              ) : !atRiskFirst.length ? (
                <p className="text-center text-surface-400 py-8 text-sm">No students found</p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {atRiskFirst.some(s => s.alerts?.length > 0) && (
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1.5 px-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> At-Risk Students
                    </p>
                  )}
                  {atRiskFirst.map(student => {
                    const isAt = student.alerts?.length > 0;
                    const hasAppt = student.appointments?.length > 0;
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={[
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200'
                            : isAt
                              ? 'border-red-200 hover:border-red-300 hover:bg-red-50/40'
                              : 'border-surface-100 hover:border-primary-200 hover:bg-surface-50',
                        ].join(' ')}
                      >
                        <div className={[
                          'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                          isAt ? 'bg-red-500' : 'bg-primary-700',
                        ].join(' ')}>
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surface-900 truncate">
                            {student.firstName} {student.lastName}
                            {isAt && <span className="ml-1.5 text-xs text-red-500">(Alert)</span>}
                          </p>
                          <p className="text-xs text-surface-500 truncate">
                            {student.school?.name}{student.grade ? ` · Grade ${student.grade}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {student.testResults?.[0] && (
                            <SeverityBadge severity={student.testResults[0].severity} size="xs" />
                          )}
                          {hasAppt && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-medium">
                              Has appt
                            </span>
                          )}
                          {isSelected && <CheckCircle className="w-4 h-4 text-primary-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Appointment details ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Selected student */}
              {selectedStudent && (
                <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    <p className="text-xs text-surface-500">{selectedStudent.school?.name}{selectedStudent.grade ? ` · Grade ${selectedStudent.grade}` : ''}</p>
                  </div>
                  {!prefillStudent && (
                    <button onClick={() => setStep(1)} className="text-xs text-primary-600 hover:underline flex-shrink-0">
                      Change
                    </button>
                  )}
                </div>
              )}

              {/* Psychiatrist */}
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1.5">
                  Psychiatrist <span className="text-red-500">*</span>
                </label>
                <select className="form-input" value={selectedPsych} onChange={e => setSelectedPsych(e.target.value)}>
                  <option value="">Select psychiatrist…</option>
                  {psychiatrists.map(p => (
                    <option key={p.id} value={p.id}>
                      Dr. {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & time */}
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1.5">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setSlot(e.target.value)}
                />
              </div>

              {/* Meeting link */}
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1.5">Meeting Link</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="url"
                    className="form-input !pl-9"
                    placeholder="https://meet.google.com/..."
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1.5">Notes</label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Session notes or reason for appointment…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Attach test results */}
              {historyData?.testResults?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-surface-400" />
                    Attach Test Results <span className="text-surface-400 font-normal">(optional)</span>
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto border border-surface-100 rounded-xl p-2">
                    {historyData.testResults.map(r => {
                      const checked = selectedResults.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className={[
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                            checked ? 'bg-primary-50 border border-primary-200' : 'hover:bg-surface-50 border border-transparent',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            className="accent-primary-600"
                            checked={checked}
                            onChange={() => toggleResult(r.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-800 truncate">{r.test?.name}</p>
                            <p className="text-xs text-surface-400">{formatDate(r.takenAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-surface-600">{r.score}/{r.maxScore}</span>
                            <SeverityBadge severity={r.severity} size="xs" />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between flex-shrink-0 bg-surface-50/80">
          {step === 1 ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={!selectedStudent} onClick={() => setStep(2)}>
                Continue →
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => prefillStudent ? onClose() : setStep(1)}>
                {prefillStudent ? 'Cancel' : '← Back'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={createMutation.isPending}
                disabled={!selectedStudent || !selectedPsych || !slot}
                onClick={handleSubmit}
                icon={<CalendarPlus className="w-4 h-4" />}
              >
                Schedule Appointment
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Day detail panel ──────────────────────────────────────────
function DayPanel({ year, month, day, appointments, onClose, onSelectStudent, onNewAppt }) {
  const dayAppts = appointments.filter(a => {
    const d = new Date(a.slot);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });

  const dateLabel = day
    ? new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-surface-900 text-sm">{dateLabel}</h3>
          <p className="text-xs text-surface-400 mt-0.5">
            {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewAppt}
            className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
            title="New appointment"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!dayAppts.length ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 gap-3 py-8">
            <CalendarDays className="w-10 h-10 text-surface-200" />
            <p className="text-sm">No appointments this day</p>
            <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onNewAppt}>
              Schedule One
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppts.map(appt => {
              const hasAlert = appt.patient?.alerts?.length > 0;
              return (
                <div
                  key={appt.id}
                  onClick={() => onSelectStudent(appt.patient?.id)}
                  className={[
                    'rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm',
                    hasAlert
                      ? 'border-red-200 bg-red-50/40 hover:bg-red-50 border-l-4 border-l-red-400'
                      : 'border-surface-100 bg-surface-50/40 hover:bg-surface-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={[
                      'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                      hasAlert ? 'bg-red-500' : 'bg-primary-700',
                    ].join(' ')}>
                      {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 text-sm truncate">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                        {hasAlert && <span className="ml-1 text-xs text-red-500">⚠</span>}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {appt.patient?.school?.name}{appt.patient?.grade ? ` · Gr. ${appt.patient?.grade}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[appt.status] || ''}`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(appt.slot).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Dr. {appt.psychiatrist?.firstName} {appt.psychiatrist?.lastName}
                    </span>
                  </div>
                  {appt.results?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {appt.results.slice(0, 3).map(r => (
                        <span key={r.id} className="text-[10px] bg-surface-100 text-surface-600 rounded-md px-2 py-0.5">
                          {r.test?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── List view row ─────────────────────────────────────────────
function ListRow({ appt, onClick }) {
  const hasAlert = appt.patient?.alerts?.length > 0;
  return (
    <div
      onClick={onClick}
      className={[
        'flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-surface-50',
        hasAlert ? 'border-l-4 border-red-400' : '',
      ].join(' ')}
    >
      <div className="w-10 h-10 rounded-xl bg-primary-100 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-primary-700 text-sm font-bold leading-none">
          {new Date(appt.slot).getDate()}
        </span>
        <span className="text-primary-400 text-[10px]">
          {MONTHS[new Date(appt.slot).getMonth()].slice(0, 3)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-900 truncate text-sm">
          {appt.patient?.firstName} {appt.patient?.lastName}
          {hasAlert && <span className="ml-1.5 text-xs text-red-500">(Alert)</span>}
        </p>
        <p className="text-xs text-surface-500 truncate">
          {formatDateTime(appt.slot)} · Dr. {appt.psychiatrist?.firstName} {appt.psychiatrist?.lastName}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {appt.patient?.alerts?.[0] && (
          <SeverityBadge severity={appt.patient.alerts[0].severity} size="xs" />
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[appt.status] || ''}`}>
          {appt.status}
        </span>
      </div>
    </div>
  );
}

// ── Main exported page ────────────────────────────────────────
export default function AdminAppointments() {
  const today = new Date();
  const [view, setView] = useState('calendar');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [panelMode, setPanelMode] = useState(null); // 'day' | 'student'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [prefillStudent, setPrefillStudent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', month + 1, year],
    queryFn: () =>
      api.get('/admin/appointments', { params: { month: month + 1, year } }).then(r => r.data),
  });

  const appointments = data?.appointments || [];
  const alertCount = appointments.filter(a => a.patient?.alerts?.length > 0).length;

  const prevMonth = () => {
    setSelectedDay(null); setPanelMode(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDay(null); setPanelMode(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
    setPanelMode('day');
    setSelectedStudentId(null);
  }, []);

  const handleSelectStudent = useCallback((id) => {
    setSelectedStudentId(id);
    setPanelMode('student');
  }, []);

  const handleScheduleFromPanel = useCallback((student) => {
    setPrefillStudent(student);
    setShowModal(true);
  }, []);

  const openNewAppt = () => {
    setPrefillStudent(null);
    setShowModal(true);
  };

  const panelOpen = panelMode !== null;

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-surface-900">Appointments</h1>
          <p className="text-surface-500 mt-1 text-sm flex items-center gap-3 flex-wrap">
            <span>{appointments.length} this month</span>
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {alertCount} at-risk
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('calendar')}
              className={['p-2 rounded-lg transition-all', view === 'calendar' ? 'bg-white shadow-sm text-primary-700' : 'text-surface-500 hover:text-surface-700'].join(' ')}
              title="Calendar view"
              aria-label="Calendar view"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={['p-2 rounded-lg transition-all', view === 'list' ? 'bg-white shadow-sm text-primary-700' : 'text-surface-500 hover:text-surface-700'].join(' ')}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />} onClick={openNewAppt}>
            New Appointment
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-6 items-start">
        {/* Calendar / List card */}
        <div className={['flex-1 min-w-0 transition-all duration-300', panelOpen ? 'hidden lg:block' : ''].join(' ')}>
          <Card padding={false} className="overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <button onClick={prevMonth} aria-label="Previous month" className="p-2 hover:bg-surface-100 rounded-lg text-surface-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h3 className="font-bold text-surface-900 text-lg">{MONTHS[month]} {year}</h3>
                <button
                  onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelectedDay(null); setPanelMode(null); }}
                  className="text-xs text-primary-500 hover:underline"
                >
                  Today
                </button>
              </div>
              <button onClick={nextMonth} aria-label="Next month" className="p-2 hover:bg-surface-100 rounded-lg text-surface-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : view === 'calendar' ? (
                <MonthCalendar
                  year={year}
                  month={month}
                  appointments={appointments}
                  selectedDay={selectedDay}
                  onSelectDay={handleDaySelect}
                />
              ) : (
                <div className="divide-y divide-surface-100">
                  {!appointments.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-surface-400 gap-3">
                      <CalendarDays className="w-12 h-12 text-surface-200" />
                      <p className="text-sm font-medium">No appointments this month</p>
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openNewAppt}>
                        Schedule One
                      </Button>
                    </div>
                  ) : appointments.map(appt => (
                    <ListRow
                      key={appt.id}
                      appt={appt}
                      onClick={() => handleSelectStudent(appt.patient?.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0">
            <Card
              padding={false}
              className="overflow-hidden sticky top-6 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              {panelMode === 'day' && selectedDay !== null ? (
                <DayPanel
                  year={year}
                  month={month}
                  day={selectedDay}
                  appointments={appointments}
                  onClose={() => { setSelectedDay(null); setPanelMode(null); }}
                  onSelectStudent={handleSelectStudent}
                  onNewAppt={openNewAppt}
                />
              ) : panelMode === 'student' && selectedStudentId ? (
                <StudentDetailPanel
                  studentId={selectedStudentId}
                  onClose={() => { setSelectedStudentId(null); setPanelMode(null); }}
                  onSchedule={handleScheduleFromPanel}
                />
              ) : null}
            </Card>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateAppointmentModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setPrefillStudent(null); }}
        prefillStudent={prefillStudent}
      />
    </div>
  );
}
