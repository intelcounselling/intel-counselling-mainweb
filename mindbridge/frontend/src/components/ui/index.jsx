import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// ── Page Header ───────────────────────────────────────────────
// Standard page-level header: back link, eyebrow meta, title,
// description, and primary actions aligned right.

export function PageHeader({ title, description, actions, backTo, meta, className = '' }) {
  return (
    <div className={clsx('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {backTo && (
          <Link
            to={backTo}
            aria-label="Go back"
            className="mt-1 p-2 rounded-lg bg-white border border-surface-200 text-surface-500 hover:text-surface-900 hover:border-surface-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div className="min-w-0">
          {meta && <div className="mb-1.5">{meta}</div>}
          <h1 className="text-2xl font-semibold tracking-tight text-surface-900">{title}</h1>
          {description && <p className="text-sm text-surface-500 mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
// Uniform metric tile: caption label, large tabular value,
// optional icon chip and hint line.

export function StatCard({ label, value, icon: Icon, tone = 'default', hint, className = '' }) {
  const tones = {
    default: 'bg-surface-100 text-surface-600',
    primary: 'bg-primary-50 text-primary-700',
    accent:  'bg-accent-100 text-accent-800',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger:  'bg-red-50 text-red-600',
    info:    'bg-blue-50 text-blue-600',
  };
  return (
    <div className={clsx('stat-card flex items-start justify-between gap-4 min-h-[96px]', className)}>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</p>
        <p className="text-2xl font-semibold text-surface-900 mt-1.5 tabular-nums">{value ?? '—'}</p>
        {hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', tones[tone] || tones.default)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-lg bg-surface-100', className)} />;
}

export function StatRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card min-h-[96px] space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={clsx('space-y-0 divide-y divide-surface-100', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  icon,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm',
    secondary: 'bg-primary-50 text-primary-800 border border-primary-100 hover:bg-primary-100',
    ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 hover:border-surface-300',
  };

  const sizes = {
    xs: 'text-xs px-3 py-1.5',
    sm: 'text-sm px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && <span className="text-current">{icon}</span>}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────

export function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-surface-200/70',
        padding && 'p-6',
        hover && 'transition-shadow duration-200 cursor-pointer hover:border-surface-300',
        hover ? 'shadow-card hover:shadow-card-hover' : 'shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-surface-100 text-surface-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    danger:  'bg-red-50 text-red-700 border border-red-200',
    info:    'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

// ── Input ──────────────────────────────────────────────────────

export function Input({ label, error, hint, icon, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-surface-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={clsx(icon && 'relative')}>
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          className={clsx(
            'form-input',
            icon && '!pl-11',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────

export function Textarea({ label, error, hint, className = '', rows = 4, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-surface-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'form-input resize-none',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-surface-700">{label}</label>}
      <select
        className={clsx('form-input appearance-none cursor-pointer bg-white', error && 'border-red-400', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10', xl: 'h-16 w-16' };
  return (
    <svg
      className={clsx('animate-spin text-primary-600', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center">
          <span className="text-white text-xl">🧠</span>
        </div>
        <Spinner size="lg" />
        <p className="text-surface-500 text-sm">Loading Intel Counselling...</p>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={clsx('modal-panel w-full', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────

export function EmptyState({ icon = '📭', title, description, action, className = '' }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-14 px-6 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-2xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-surface-800 mb-1.5">{title}</h3>
      {description && <p className="text-surface-500 text-sm max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────

export function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className={clsx('rounded-full object-cover', sizes[size])}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full bg-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0',
        sizes[size]
      )}
    >
      {initials || '?'}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────

export function Table({ columns, data, onRowClick, loading, emptyState }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.length) {
    return emptyState || <EmptyState title="No data found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={clsx(onRowClick && 'cursor-pointer')}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
