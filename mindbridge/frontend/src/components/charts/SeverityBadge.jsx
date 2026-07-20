import { clsx } from 'clsx';
import { getSeverityBg } from '../../utils/formatters';

export default function SeverityBadge({ severity, size = 'sm' }) {
  if (!severity) return null;

  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  const colorClass = getSeverityBg(severity);

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
