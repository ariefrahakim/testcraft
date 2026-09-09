'use client';

import { MessageSquare } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate, initials } from '@/lib/format';

interface SubmissionRow {
  id: string;
  status: string;
  grade: number | null;
  maxPoints: number;
  submittedAt: string;
  student: { name: string; email: string };
  assignmentTitle: string;
  courseTitle: string;
}

/** Riwayat penilaian yang sudah Anda berikan — untuk menengok kembali feedback. */
export default function InstructorFeedbackPage() {
  const t = useT();
  const { data, loading } = useApi<Paginated<SubmissionRow>>(
    '/instructor/submissions?status=GRADED&limit=50',
  );
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title={t('mentor.feedbackTitle')}
        description={t('mentor.feedbackSubtitle')}
      />

      <Card>
        <CardHeader
          title={t('mentor.graded')}
          description={`${data?.meta.total ?? 0} submissions`}
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title={t('mentor.noGrading')}
            description={t('mentor.noGradingHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.student')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('assign.title')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.score')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td data-label={t('table.student')} className="py-3 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                          {initials(s.student.name)}
                        </span>
                        <span className="font-semibold text-navy dark:text-white">
                          {s.student.name}
                        </span>
                      </span>
                    </td>
                    <td data-label={t('assign.title')} className="py-3 pr-4 text-slate-600">
                      {s.assignmentTitle}
                    </td>
                    <td data-label={t('table.class')} className="py-3 pr-4 text-slate-600">
                      {s.courseTitle}
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td data-label={t('table.score')} className="py-3 pr-4 text-right font-semibold tabular-nums">
                      {s.grade ?? '—'}/{s.maxPoints}
                    </td>
                    <td data-label={t('table.date')} className="py-3 text-right text-slate-500">
                      {formatDate(s.submittedAt)}
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
