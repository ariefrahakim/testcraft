'use client';

import Link from 'next/link';
import { AlertTriangle, BookOpen, ClipboardCheck, Star, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { deadlineInfo } from '@/lib/deadline';
import { useApi } from '@/lib/use-api';
import { useI18n } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/format';

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  status: string;
  studentCount: number;
  rating: number;
  reviewCount: number;
  lessonCount: number;
  category: { name: string };
}

interface PendingSummary {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  dueAt: string | null;
  pending: number;
}

export default function InstructorOverview() {
  const { t, locale } = useI18n();
  const { data: courses, loading } = useApi<CourseRow[]>('/instructor/courses');
  const { data: pending } = useApi<PendingSummary[]>(
    '/instructor/submissions/pending-summary',
  );

  const rows = courses ?? [];
  const queue = pending ?? [];
  const totalPending = queue.reduce((n, q) => n + q.pending, 0);
  const overdue = queue.filter((q) => deadlineInfo(q.dueAt, locale).urgency === 'overdue');

  return (
    <>
      <PageHeader
        title={t('mentor.overviewTitle')}
        description={t('mentor.overviewSubtitle')}
        action={
          totalPending > 0 && (
            <ButtonLink href="/instructor/grading" size="sm">
              <ClipboardCheck className="h-4 w-4" /> {t('mentor.startGrading')}
            </ButtonLink>
          )
        }
      />

      {/* Banner tindakan — meniru pola "perlu penilaian", ditambah penanda
          keterlambatan agar prioritas langsung terlihat. */}
      {totalPending > 0 && (
        <Card
          className={cn(
            'mb-5 border-l-4',
            overdue.length ? 'border-l-danger' : 'border-l-warning',
          )}
        >
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  overdue.length ? 'text-danger' : 'text-warning',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy dark:text-white">
                  {t('mentor.pendingBanner', { count: totalPending })}
                  {overdue.length > 0 &&
                    ` · ${t('mentor.overdueSuffix', { count: overdue.length })}`}
                </p>
                <ul className="mt-3 space-y-2">
                  {queue.slice(0, 5).map((q) => {
                    const due = deadlineInfo(q.dueAt, locale);
                    return (
                      <li
                        key={q.assignmentId}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <Link
                          href={`/instructor/grading?courseId=${q.courseId}`}
                          className="font-medium text-navy hover:text-primary dark:text-slate-200"
                        >
                          {q.courseTitle} — {q.assignmentTitle}
                        </Link>
                        <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                          {t('mentor.studentsCount', { count: q.pending })}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            due.className,
                          )}
                        >
                          {t(due.labelKey, due.labelVars)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('mentor.coursesTaught')}
          value={rows.length}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label={t('mentor.totalStudents')}
          value={formatNumber(rows.reduce((n, c) => n + c.studentCount, 0))}
          icon={<Users className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label={t('mentor.awaitingGrade')}
          value={totalPending}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone={totalPending ? 'warning' : 'primary'}
        />
        <StatCard
          label={t('mentor.avgRating')}
          value={
            rows.length
              ? (rows.reduce((n, c) => n + c.rating, 0) / rows.length).toFixed(1)
              : '—'
          }
          icon={<Star className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
            title={t('mentor.myCoursesTitle')}
            description={t('mentor.myCoursesDesc')}
          />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t('mentor.noCourses')}
            description={t('mentor.noCoursesHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.participants')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.materials')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.rating')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td data-label={t('table.class')} className="py-3 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden>{c.icon ?? '🎓'}</span>
                        <span className="font-semibold text-navy dark:text-white">
                          {c.title}
                        </span>
                      </span>
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td data-label={t('table.participants')} className="py-3 pr-4 text-right tabular-nums">
                      {formatNumber(c.studentCount)}
                    </td>
                    <td data-label={t('table.materials')} className="py-3 pr-4 text-right tabular-nums">
                      {c.lessonCount}
                    </td>
                    <td data-label={t('table.rating')} className="py-3 text-right tabular-nums">
                      {c.rating.toFixed(1)} ({c.reviewCount})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
    </>
  );
}
