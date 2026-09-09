'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, Loader2, RotateCcw } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { deadlineInfo } from '@/lib/deadline';
import { useApi } from '@/lib/use-api';
import { useI18n } from '@/lib/i18n';
import { cn, formatDate, initials } from '@/lib/format';

interface SubmissionRow {
  id: string;
  status: string;
  grade: number | null;
  attempt: number;
  submittedAt: string;
  student: { id: string; name: string; email: string };
  assignmentTitle: string;
  maxPoints: number;
  dueAt: string | null;
  rubric: Array<{ criterion: string; points: number }> | null;
  lessonTitle: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const TABS = [
  { key: 'SUBMITTED', labelKey: 'mentor.tabUngraded' },
  { key: 'GRADED', labelKey: 'mentor.tabGraded' },
  { key: 'RETURNED', labelKey: 'mentor.tabRevision' },
] as const;

function GradingQueue() {
  const { t } = useI18n();
  const params = useSearchParams();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('SUBMITTED');
  const [courseId, setCourseId] = useState(params.get('courseId') ?? '');

  const { data: courses } = useApi<CourseOption[]>('/instructor/courses');
  const query = `/instructor/submissions?status=${tab}&limit=50${
    courseId ? `&courseId=${courseId}` : ''
  }`;
  const { data, loading, reload } = useApi<Paginated<SubmissionRow>>(query);

  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title={t('mentor.gradingTitle')}
        description={t('mentor.gradingSubtitle')}
      />

      {/* Filter bertingkat: kelas → status. */}
      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Field label={t('table.class')} htmlFor="filter-course">
            <Select
              id="filter-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">{t('mentor.allCourses')}</option>
              {(courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('table.status')} htmlFor="filter-status">
            <Select
              id="filter-status"
              value={tab}
              onChange={(e) => setTab(e.target.value as typeof tab)}
            >
              {TABS.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {t(tab.labelKey)}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6 text-success" />}
            title={t(tab === 'SUBMITTED' ? 'mentor.allGraded' : 'mentor.noData')}
            description={t(
              tab === 'SUBMITTED' ? 'mentor.allGradedHint' : 'mentor.noDataHint',
            )}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <GradingCard key={row.id} row={row} onGraded={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function GradingCard({ row, onGraded }: { row: SubmissionRow; onGraded: () => void }) {
  const { t, locale } = useI18n();
  const [grade, setGrade] = useState(String(row.grade ?? ''));
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const due = deadlineInfo(row.dueAt, locale);

  async function submit(returnForRevision: boolean) {
    const value = Number(grade);
    if (!returnForRevision && (Number.isNaN(value) || value < 0)) {
      setError(t('mentor.invalidGrade'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.patch(
        `/instructor/submissions/${row.id}/grade`,
        { grade: value || 0, feedback: feedback || undefined, returnForRevision },
        { auth: true },
      );
      onGraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crud.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
              {initials(row.student.name)}
            </span>
            {row.student.name}
          </span>
        }
        description={`${row.courseTitle} · ${row.assignmentTitle} · ${t('assign.attempt', { n: row.attempt })}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', due.className)}
            >
              {t('assign.deadline', { label: t(due.labelKey, due.labelVars) })}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t('assign.sentOn', { date: formatDate(row.submittedAt) })}
            </span>
          </div>
        }
      />
      <CardBody className="space-y-4">
        {row.rubric && row.rubric.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('mentor.rubricPoints', { points: row.maxPoints })}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {row.rubric.map((r) => (
                <li
                  key={r.criterion}
                  className="flex justify-between gap-4 text-slate-600 dark:text-slate-300"
                >
                  <span>{r.criterion}</span>
                  <span className="font-semibold tabular-nums">{r.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <Alert>{error}</Alert>}

        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <Field label={t('mentor.gradeField', { max: row.maxPoints })} htmlFor={`grade-${row.id}`}>
            <Input
              id={`grade-${row.id}`}
              type="number"
              min={0}
              max={row.maxPoints}
              inputMode="numeric"
              placeholder="0"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </Field>

          <Field label={t('mentor.feedbackField')} htmlFor={`feedback-${row.id}`}>
            <Textarea
              id={`feedback-${row.id}`}
              rows={3}
              placeholder={t('mentor.feedbackPlaceholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => submit(false)} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <ClipboardCheck className="h-4 w-4" /> {t('mentor.saveGrade')}
          </Button>
          <Button variant="outline" onClick={() => submit(true)} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> {t('mentor.requestRevision')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function GradingPage() {
  return (
    <Suspense fallback={null}>
      <GradingQueue />
    </Suspense>
  );
}
