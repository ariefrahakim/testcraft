'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/format';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        blue: 'bg-primary-light text-primary-dark',
        navy: 'bg-navy text-white',
        green: 'bg-success-light text-emerald-700',
        amber: 'bg-warning-light text-amber-700',
        red: 'bg-danger-light text-red-700',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      },
    },
    defaultVariants: { tone: 'blue' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const STATUS_TONE: Record<string, VariantProps<typeof badgeVariants>['tone']> = {
  PUBLISHED: 'green',
  PAID: 'green',
  GRADED: 'green',
  ACTIVE: 'green',
  DRAFT: 'slate',
  ARCHIVED: 'slate',
  PENDING: 'amber',
  SUBMITTED: 'amber',
  SCHEDULED: 'amber',
  RETURNED: 'amber',
  FAILED: 'red',
  EXPIRED: 'red',
  REFUNDED: 'red',
};

/**
 * Badge status yang konsisten untuk kursus, pembayaran, dan submission.
 * Labelnya diambil dari kamus (`status.<KODE>`) agar ikut berganti bahasa;
 * status yang belum punya terjemahan ditampilkan apa adanya.
 */
export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const key = `status.${status}` as TranslationKey;
  const label = t(key);

  return (
    <Badge tone={STATUS_TONE[status] ?? 'slate'}>
      {label === key ? status : label}
    </Badge>
  );
}

export { badgeVariants };
