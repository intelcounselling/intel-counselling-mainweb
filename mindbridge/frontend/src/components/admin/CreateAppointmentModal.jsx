import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, CheckCircle, Search, AlertTriangle, FileText,
  Link2, CalendarPlus
} from 'lucide-react';
import { Button, Spinner } from '../ui';
import SeverityBadge from '../charts/SeverityBadge';
import { useToast } from '../ui/Toast';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';

export default function CreateAppointmentModal({ isOpen, onClose, prefillStudent }) {
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
    enabled: isOpen && !prefillStudent,
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

  useEffect(() => {
    if (psychiatrists.length > 0 && !selectedPsych) {
      setSelectedPsych(psychiatrists[0].id);
    }
  }, [psychiatrists, selectedPsych]);

  // Reset/sync form state every time the modal opens. The useState
  // initializers below only run on the component's FIRST mount — and both
  // AdminDashboard and AdminAppointments keep this modal mounted permanently
  // (with prefillStudent=null), so without this effect the prefill never
  // applies and stale state (previously selected student, old slot/notes)
  // leaks into the next open — appointments could be created for the wrong
  // student.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedStudent(prefillStudent || null);
    setStep(prefillStudent ? 2 : 1);
    setSearch('');
    setSlot('');
    setNotes('');
    setMeetingLink('');
    setSelectedResults([]);
  }, [isOpen, prefillStudent]);

  const atRiskFirst = useMemo(() => [
    ...students.filter(s => s.alerts?.length > 0),
    ...students.filter(s => !s.alerts?.length),
  ], [students]);

  const handleSubmit = () => {
    const psychId = selectedPsych || psychiatrists[0]?.id;
    if (!selectedStudent || !slot) {
      toastError('Please fill all required fields');
      return;
    }
    if (!psychId) {
      toastError('No psychiatrists are available to schedule this appointment');
      return;
    }
    createMutation.mutate({
      patientId: selectedStudent.id,
      psychiatristId: psychId,
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
                disabled={!selectedStudent || !slot}
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
