import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Lock, Unlock, TrendingUp } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState } from './ui';
import { useToast } from './ui/Toast';
import RadarChart from './charts/RadarChart';
import api from '../lib/axios';
import { formatDate, formatRelative } from '../utils/formatters';

// ── Add Note Form ─────────────────────────────────────────────
function NoteForm({ patientId, appointmentId, onSuccess, onCancel }) {
  const { success, error: toastError } = useToast();
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 16));
  const [summary, setSummary] = useState('');
  const [goals, setGoals] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);

  const mutation = useMutation({
    mutationFn: () => api.post('/psychiatrist/notes', {
      patientId, appointmentId: appointmentId || null,
      sessionDate, summary, goals, nextSteps, isConfidential,
    }),
    onSuccess: () => { success('Note saved!'); onSuccess?.(); },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to save note'),
  });

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 space-y-4">
      <h4 className="font-semibold text-primary-900">📝 New Session Note</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Session Date & Time" type="datetime-local" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
        <div className="flex items-center gap-3 pt-6">
          <button
            type="button"
            onClick={() => setIsConfidential(v => !v)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all ${
              isConfidential ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-surface-200 text-surface-600'
            }`}
          >
            {isConfidential ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {isConfidential ? 'Confidential' : 'Non-confidential'}
          </button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-surface-700 block mb-1.5">Session Summary <span className="text-red-500">*</span></label>
        <textarea
          className="form-input resize-none" rows={3}
          value={summary} onChange={e => setSummary(e.target.value)}
          placeholder="What was covered in this session..."
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-surface-700 block mb-1.5">Goals / Targets</label>
        <textarea
          className="form-input resize-none" rows={2}
          value={goals} onChange={e => setGoals(e.target.value)}
          placeholder="Goals set during this session..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-surface-700 block mb-1.5">Next Steps</label>
        <textarea
          className="form-input resize-none" rows={2}
          value={nextSteps} onChange={e => setNextSteps(e.target.value)}
          placeholder="Actions and follow-ups planned..."
        />
      </div>
      <div className="flex gap-3">
        <Button variant="primary" loading={mutation.isPending} disabled={!summary} onClick={() => mutation.mutate()}>
          Save Note
        </Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}

// ── Note Card ─────────────────────────────────────────────────
function NoteCard({ note, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-2xl overflow-hidden ${note.isConfidential ? 'border-amber-200 bg-amber-50/30' : 'border-surface-200'}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/[0.02] transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-primary-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-surface-900 text-sm truncate">{note.summary}</p>
          <p className="text-xs text-surface-400">
            {formatDate(note.sessionDate)} · Dr. {note.counsellor?.firstName} {note.counsellor?.lastName}
            {note.isConfidential && ' · 🔒 Confidential'}
          </p>
        </div>
        <span className="text-xs text-surface-400 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-surface-100">
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Summary</p>
            <p className="text-sm text-surface-700 whitespace-pre-line">{note.summary}</p>
          </div>
          {note.goals && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Goals</p>
              <p className="text-sm text-surface-700 whitespace-pre-line">{note.goals}</p>
            </div>
          )}
          {note.nextSteps && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Next Steps</p>
              <p className="text-sm text-surface-700 whitespace-pre-line">{note.nextSteps}</p>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { if (confirm('Delete this note?')) onDelete(note.id); }}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress Chart ────────────────────────────────────────────
function ProgressSection({ progress }) {
  const categories = Object.keys(progress);
  if (!categories.length) return null;

  const CAT_LABELS = {
    LearningPattern: 'Learning Pattern',
    StudyBehaviour: 'Study Behaviour',
    EmotionalWellness: 'Emotional Wellness',
    InternetUsage: 'Internet Usage',
    PersonalityDimensions: 'Personality',
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-surface-900">Assessment Progress (Before → After)</h3>
      </div>
      <div className="space-y-4">
        {categories.map(cat => {
          const results = progress[cat];
          if (!results || results.length < 2) return null;
          const first = results[0];
          const last = results[results.length - 1];
          const change = last.score - first.score;
          const isImproved = change > 0;
          const pctFirst = Math.round((first.score / first.maxScore) * 100);
          const pctLast = Math.round((last.score / last.maxScore) * 100);

          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-700">{CAT_LABELS[cat] || cat}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isImproved ? 'bg-green-50 text-green-700' : change < 0 ? 'bg-red-50 text-red-700' : 'bg-surface-100 text-surface-600'
                }`}>
                  {isImproved ? '↑' : change < 0 ? '↓' : '='} {Math.abs(change)} pts
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-surface-400 mb-1">First ({formatDate(first.takenAt)})</p>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pctFirst}%`, background: '#e2e8f0' }} />
                  </div>
                  <p className="text-xs text-surface-600 mt-1">{pctFirst}%</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400 mb-1">Latest ({formatDate(last.takenAt)})</p>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pctLast}%` }} />
                  </div>
                  <p className="text-xs text-surface-600 mt-1">{pctLast}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export default function CounsellingPanel({ patientId, appointmentId }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['psych-progress', patientId],
    queryFn: () => api.get(`/psychiatrist/students/${patientId}/progress`).then(r => r.data),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => api.delete(`/psychiatrist/notes/${noteId}`),
    onSuccess: () => { success('Note deleted'); qc.invalidateQueries({ queryKey: ['psych-progress', patientId] }); },
    onError: (e) => toastError(e.response?.data?.error || 'Failed'),
  });

  const { notes = [], progress = {} } = data || {};

  return (
    <div className="space-y-5">
      {/* Progress */}
      {!isLoading && <ProgressSection progress={progress} />}

      {/* Notes */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Session Notes (Package 3)</h3>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : 'Add Note'}
          </Button>
        </div>

        {showForm && (
          <div className="p-5">
            <NoteForm
              patientId={patientId}
              appointmentId={appointmentId}
              onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['psych-progress', patientId] }); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !notes.length ? (
          <EmptyState icon="📝" title="No session notes yet" description="Add a note after each session to track progress over time." />
        ) : (
          <div className="divide-y divide-surface-50">
            {notes.map(note => (
              <div key={note.id} className="px-5 py-3">
                <NoteCard note={note} onDelete={deleteMutation.mutate} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
