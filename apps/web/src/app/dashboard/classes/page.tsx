'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Paginated } from '@testcraft/shared';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/format';

interface EnrollmentRow {
  id: string;
  progressPct: number;
  completedLessons: number;
  completedAt: string | null;
  lastAccessedAt: string | null;
  course: {
    slug: string;
    title: string;
    icon: string | null;
    lessonCount: number;
    level: string;
  };
}

const TABS = [
  { key: 'active', labelKey: 'classes.tabActive' },
  { key: 'finished', labelKey: 'classes.tabFinished' },
] as const;

export default function MyClassesPage() {
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('active');
  const { data, loading } = useApi<Paginated<EnrollmentRow>>('/enrollments/me?limit=50');

  const all = data?.data ?? [];
  const rows = all.filter((e) =>
    tab === 'finished' ? e.progressPct === 100 : e.progressPct < 100,
  );

  return (
    <>
      <PageHeader
        title={t('classes.title')}
        description={t('classes.subtitle')}
      />

      <div
        role="tablist"
        className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        {TABS.map((tabItem) => {
          const count = all.filter((e) =>
            tabItem.key === 'finished' ? e.progressPct === 100 : e.progressPct < 100,
          ).length;
          return (
            <button
              key={tabItem.key}
              role="tab"
              aria-selected={tab === tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                tab === tabItem.key
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:text-navy dark:text-slate-300',
              )}
            >
              {t(tabItem.labelKey)}
              <span
                className={cn(
                  'ml-2 text-xs',
                  tab === tabItem.key ? 'text-white/70' : 'text-slate-400',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-white dark:bg-slate-900"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title={t(tab === 'active' ? 'classes.emptyActive' : 'classes.emptyFinished')}
            description={t(
              tab === 'active' ? 'classes.emptyActiveHint' : 'classes.emptyFinishedHint',
            )}
            action={
              <ButtonLink href="/catalog" size="sm">
                {t('common.exploreCatalog')}
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((e) => (
            <Link
              key={e.id}
              href={`/learn/${e.course.slug}`}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-light text-2xl">
                {e.course.icon ?? '🎓'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold text-navy dark:text-white">
                  {e.course.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('classes.lessons', {
                    done: e.completedLessons,
                    total: e.course.lessonCount,
                  })}
                  {e.lastAccessedAt &&
                    ` · ${t('classes.lastOpened', { date: formatDate(e.lastAccessedAt) })}`}
                </p>
                <Progress value={e.progressPct} className="mt-3" showLabel />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
