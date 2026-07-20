import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, List, LayoutGrid, X, Edit2, Trash2 } from 'lucide-react';
import { Card, Button, Modal, Input, Select, Spinner, Badge } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDateTime, getStatusColor } from '../../utils/formatters';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MonthCalendar({ year, month, appointments, onSelect }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-surface-400 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-surface-200 rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          const appts = getAppts(day);
          const isToday = day && new Date().getDate() === day &&
                          new Date().getMonth() === month &&
                          new Date().getFullYear() === year;
          return (
            <div
              key={i}
              onClick={() => day && onSelect?.({ year, month, day })}
              className={`bg-white min-h-[80px] p-1.5 ${day ? 'cursor-pointer hover:bg-primary-50' : ''} transition-colors`}
            >
              {day && (
                <>
                  <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary-600 text-white' : 'text-surface-700'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {appts.slice(0, 2).map(a => (
                      <div key={a.id} className="text-xs bg-primary-100 text-primary-800 rounded px-1 truncate">
                        {a.patient?.firstName} {a.patient?.lastName?.[0]}.
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className="text-xs text-primary-600 font-medium">+{appts.length - 2} more</div>
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

function AppointmentDetailModal({ appointment, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [status, setStatus] = useState(appointment?.status || 'PENDING');
  const [meetingLink, setMeetingLink] = useState(appointment?.meetingLink || '');
  const { success } = useToast();

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/psychiatrist/appointments/${appointment.id}`, { notes, status, meetingLink }),
    onSuccess: () => { success('Appointment updated'); onUpdate?.(); onClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/psychiatrist/appointments/${appointment.id}`),
    onSuccess: () => { success('Appointment cancelled'); onDelete?.(); onClose(); },
  });

  if (!appointment) return null;

  return (
    <Modal isOpen title="Appointment Details" onClose={onClose} size="md"
      footer={
        <div className="flex justify-between">
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}
            loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Cancel Appointment
          </Button>
          <Button variant="primary" size="sm" loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}>
            Save Changes
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div className="bg-surface-50 rounded-xl p-4">
          <p className="font-semibold text-surface-900">{appointment.patient?.firstName} {appointment.patient?.lastName}</p>
          <p className="text-sm text-surface-500">Grade {appointment.patient?.grade} · {appointment.patient?.school?.name}</p>
          <p className="text-sm text-surface-600 mt-1">{formatDateTime(appointment.slot)}</p>
        </div>

        {appointment.results?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-surface-700 mb-2">Attached Assessments:</p>
            <div className="space-y-1">
              {appointment.results.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="text-surface-600">{r.test?.name}</span>
                  <span className="text-surface-400">·</span>
                  <span className="font-medium">{r.score}/{r.maxScore}</span>
                  <SeverityBadge severity={r.severity} size="xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        <Select label="Status" value={status} onChange={e => setStatus(e.target.value)}>
          {['PENDING','CONFIRMED','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>

        <Input label="Meeting Link" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://..." />

        <div>
          <label className="text-sm font-medium text-surface-700 block mb-1.5">Session Notes</label>
          <textarea className="form-input resize-none" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add session notes..." />
        </div>
      </div>
    </Modal>
  );
}

export default function AppointmentManager() {
  const today = new Date();
  const [view, setView] = useState('calendar');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedAppt, setSelectedAppt] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['psych-appointments', month, year],
    queryFn: () => api.get('/psychiatrist/appointments', { params: { month: month + 1, year } }).then(r => r.data),
  });

  const appointments = data?.appointments || [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Appointment Manager</h2>
          <p className="text-surface-500">{appointments.length} appointments this month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('calendar')}
            className={`p-2 rounded-lg ${view === 'calendar' ? 'bg-primary-600 text-white' : 'hover:bg-surface-200 text-surface-600'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-primary-600 text-white' : 'hover:bg-surface-200 text-surface-600'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Card>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 hover:bg-surface-100 rounded-xl text-surface-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-surface-900">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-surface-100 rounded-xl text-surface-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : view === 'calendar' ? (
          <MonthCalendar year={year} month={month} appointments={appointments}
            onSelect={() => {}} />
        ) : (
          <div className="space-y-3">
            {!appointments.length ? (
              <p className="text-center text-surface-400 py-8">No appointments this month</p>
            ) : appointments.map(appt => (
              <div key={appt.id}
                className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl cursor-pointer hover:bg-primary-50 transition-colors"
                onClick={() => setSelectedAppt(appt)}>
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 text-sm font-bold leading-none">{new Date(appt.slot).getDate()}</span>
                  <span className="text-primary-500 text-xs">{MONTHS[new Date(appt.slot).getMonth()].slice(0,3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 truncate">
                    {appt.patient?.firstName} {appt.patient?.lastName}
                  </p>
                  <p className="text-xs text-surface-500">{formatDateTime(appt.slot)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(appt.status)}`}>
                  {appt.status}
                </span>
                <Edit2 className="w-4 h-4 text-surface-400" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['psych-appointments'] })}
          onDelete={() => qc.invalidateQueries({ queryKey: ['psych-appointments'] })}
        />
      )}
    </div>
  );
}
