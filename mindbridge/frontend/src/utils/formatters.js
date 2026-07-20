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
