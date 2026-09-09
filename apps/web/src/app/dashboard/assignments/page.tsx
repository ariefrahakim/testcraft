'use client';

import { useState } from 'react';
import { ClipboardList, Loader2, Send } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { deadlineInfo } from '@/lib/deadline';
import { useApi } from '@/lib/use-api';
import { useI18n, useT } from '@/lib/i18n';
import { cn } from '@/lib/format';

interface AssignmentRow {
  id: string;
  title: string;
  brief: string;
  maxPoints: number;
  dueAt: string | null;
  rubric: Array<{ criterion: string; points: number }> | null;
  lessonTitle: string;
  moduleTitle: string;
  courseSlug: string;
  courseTitle: string;
  submission: {
    id: string;
    status: string;
    grade: number | null;
    feedback: string | null;
    attempt: number;
    gradedAt: string | null;
  } | null;
}

export default function StudentAssignmentsPage() {
  const t = useT();
  const { data, loading, reload } = useApi<AssignmentRow[]>('/enrollments/me/assignments');
  const rows = data ?? [];

  const pending = rows.filter(
    (r) => !r.submission || r.submission.status === 'RETURNED',
  );

  return (
    <>
      <PageHeader
        title={t('assign.title')}
        description={t('assign.subtitle')}
      />

      {pending.length > 0 && (
        <div className="mb-5">
          <Alert tone="warning">
            {t('assign.pendingBanner', { count: pending.length })}
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={t('assign.empty')}
            description={t('assign.emptyHint')}
            action={
              <ButtonLink href="/catalog" size="sm">
                {t('common.exploreCatalog')}
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <AssignmentCard key={row.id} row={row} onSubmitted={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function AssignmentCard({
  row,
  onSubmitted,
}: {
  row: AssignmentRow;
  onSubmitted: () => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const due = deadlineInfo(row.dueAt, locale);
  const status = row.submission?.status ?? 'BELUM_DIKIRIM';
  const canSubmit = !row.submission || row.submission.status === 'RETURNED';

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await api.post(
        `/enrollments/assignments/${row.id}/submit`,
        { contentHtml: answer },
        { auth: true },
      );
      setOpen(false);
      setAnswer('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim tugas');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={row.title}
        description={`${row.courseTitle} · ${row.moduleTitle}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                due.className,
              )}
            >
              {t(due.labelKey, due.labelVars)}
            </span>
            {row.submission ? (
              <StatusBadge status={row.submission.status} />
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t('assign.notSubmitted')}
              </span>
            )}
          </div>
        }
      />
      <CardBody className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {row.brief}
        </p>

        {row.rubric && row.rubric.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('assign.rubric')}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {row.rubric.map((r) => (
                <li
                  key={r.criterion}
                  className="flex justify-between gap-4 text-slate-600 dark:text-slate-300"
                >
                  <span>{r.criterion}</span>
                  <span className="font-semibold tabular-nums">
                    {t('assign.points', { points: r.points })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {row.submission?.status === 'GRADED' && (
          <div className="rounded-xl border border-emerald-200 bg-success-light p-4">
            <p className="font-display text-lg font-extrabold text-emerald-700">
              {t('assign.score', { score: row.submission.grade ?? 0, max: row.maxPoints })}
            </p>
            {row.submission.feedback && (
              <p className="mt-1.5 text-sm text-emerald-900">
                {row.submission.feedback}
              </p>
            )}
          </div>
        )}

        {row.submission?.status === 'RETURNED' && row.submission.feedback && (
          <Alert tone="warning">
            {t('assign.revisionRequested', { feedback: row.submission.feedback })}
          </Alert>
        )}

        {canSubmit &&
          (open ? (
            <div className="space-y-3">
              {error && <Alert>{error}</Alert>}
              <Field label={t('assign.yourAnswer')} htmlFor={`answer-${row.id}`} required>
                <Textarea
                  id={`answer-${row.id}`}
                  rows={6}
                  placeholder={t('assign.answerPlaceholder')}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <Button onClick={submit} disabled={busy || !answer.trim()}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" /> {t('assign.submit')}
                </Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setOpen(true)}>
              {t(row.submission?.status === 'RETURNED' ? 'assign.sendRevision' : 'assign.doIt')}
            </Button>
          ))}
      </CardBody>
    </Card>
  );
}
