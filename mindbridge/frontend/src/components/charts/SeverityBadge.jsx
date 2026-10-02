import { clsx } from 'clsx';
import { getSeverityBg, cleanSeverity, TONE_BADGE } from '../../utils/formatters';

// `tone` (green/yellow/orange/red) colours INTELL results, whose labels
// ("Emotionally Stable", "Moderate Digital Overuse"…) aren't clinical words.
export default function SeverityBadge({ severity, size = 'sm', tone }) {
  const text = cleanSeverity(severity);
  if (!text) return null;

  const label = text.charAt(0).toUpperCase() + text.slice(1);
  const colorClass = tone && TONE_BADGE[tone] ? TONE_BADGE[tone] : getSeverityBg(text);

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1 font-medium',
    md: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-full border', colorClass, sizes[size])}>
      {label}
    </span>
  );
}
