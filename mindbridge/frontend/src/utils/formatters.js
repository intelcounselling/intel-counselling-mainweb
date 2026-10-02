/**
 * Format utilities for dates, scores, and names
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatDateTime(date) {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatName(user) {
  if (!user) return '—';
  return `${user.firstName} ${user.lastName}`;
}

export function getInitials(user) {
  if (!user) return '??';
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
}

export function formatScore(score, maxScore) {
  if (score == null || maxScore == null) return '—';
  return `${score}/${maxScore}`;
}

export function severityToPercent(score, maxScore) {
  if (!maxScore) return 0;
  return Math.round((score / maxScore) * 100);
}

export function getSeverityColor(severity) {
  const map = {
    minimal: '#16a34a',
    mild: '#ca8a04',
    moderate: '#ea580c',
    'moderately severe': '#dc2626',
    severe: '#dc2626',
    low: '#16a34a',
    high: '#dc2626',
  };
  return map[severity?.toLowerCase()] || '#64748b';
}

export function getSeverityBg(severity) {
  const map = {
    minimal: 'bg-green-50 text-green-700 border-green-200',
    mild: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    moderate: 'bg-orange-50 text-orange-700 border-orange-200',
    'moderately severe': 'bg-red-50 text-red-700 border-red-200',
    severe: 'bg-red-50 text-red-700 border-red-200',
    low: 'bg-green-50 text-green-700 border-green-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[severity?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200';
}

// Maps a severity value (e.g. "SEVERE", "moderately severe", "high") to one of
// the alert-card-* CSS classes defined in index.css. Values with spaces or
// unknown values would otherwise produce invalid/undefined class names.
export function getAlertCardClass(severity) {
  const s = severity?.toLowerCase() || '';
  if (s === 'minimal' || s === 'low') return 'alert-card-minimal';
  if (s === 'mild') return 'alert-card-mild';
  if (s === 'moderate') return 'alert-card-moderate';
  return 'alert-card-severe'; // severe, moderately severe, high, unknown
}

export function getStatusColor(status) {
  const map = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    UNREAD:    'bg-red-50 text-red-700 border-red-200',
    READ:      'bg-gray-50 text-gray-600 border-gray-200',
    ACTIONED:  'bg-green-50 text-green-700 border-green-200',
    RECEIVED:  'bg-blue-50 text-blue-600 border-blue-200',
    REVIEWED:  'bg-green-50 text-green-700 border-green-200',
  };
  return map[status] || 'bg-gray-50 text-gray-600 border-gray-200';
}

export function downloadCSV(rows, filename = 'export.csv') {
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${row[h] || ''}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── INTELL Student Success Assessment helpers ─────────────────────

export const VALIDITY_MESSAGE = 'Please answer based on real experience for better understanding.';

const INTELL_SCORED = ['StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'];

// Older results carried "[Validity Warning] " in front of the severity text.
export const cleanSeverity = (severity) => String(severity ?? '').replace(/^\[Validity Warning\]\s*/i, '');

// Learning-pattern dimension (4–20): 16–20 strong, 11–15 moderate, 4–10 low
export const getLearningPreference = (score) =>
  score >= 16 ? 'Strong Preference' : score >= 11 ? 'Moderate Preference' : 'Low Preference';

// 80%+ of the answers are "5" on a 1–5 INTELL scale → possible self-presentation bias.
// Works for new results and for older rows (derived from the saved answers).
export function hasValidityFlag(result) {
  if (!result) return false;
  if (/^\[Validity Warning\]/i.test(result.severity || '')) return true;
  const category = result.test?.category;
  if (category !== 'LearningPattern' && !INTELL_SCORED.includes(category)) return false;
  const raw = result.answers || {};
  const values = (Array.isArray(raw) ? raw.map((a) => a.value ?? a) : Object.values(raw)).map(Number).filter(Number.isFinite);
  return values.length > 0 && values.filter((v) => v >= 5).length / values.length >= 0.8;
}

// Green 48–60 · Yellow 36–47 · Orange 24–35 · Red 12–23 for the four scored INTELL domains.
export function getIntellTone(result) {
  if (!result || !INTELL_SCORED.includes(result.test?.category) || typeof result.score !== 'number') return null;
  return result.score >= 48 ? 'green' : result.score >= 36 ? 'yellow' : result.score >= 24 ? 'orange' : 'red';
}

export const TONE_BADGE = {
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};
export const TONE_HEX = { green: '#16a34a', yellow: '#ca8a04', orange: '#ea580c', red: '#dc2626' };
