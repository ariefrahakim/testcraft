import { cn } from '@/lib/format';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(15,23,42,0.10)] dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-slate-800',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-navy dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />;
}

/** Kartu KPI: label kecil di atas, angka besar, opsional delta/ikon. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    primary: 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-[0_0_12px_rgba(14,156,156,0.15)]',
    success: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600',
    danger: 'bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-600',
  }[tone];

  return (
    <Card className="group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5" data-testid="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-navy dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full',
              toneClass,
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
