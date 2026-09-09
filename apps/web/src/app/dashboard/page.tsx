'use client';

import Link from 'next/link';
import { Award, BookOpen, Flame, PlayCircle, Trophy, Zap } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import { useApi } from '@/lib/use-api';
import { formatNumber } from '@/lib/format';

interface EnrollmentRow {
  id: string;
  progressPct: number;
  completedLessons: number;
  lastAccessedAt: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    icon: string | null;
    lessonCount: number;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const t = useT();
  const { data, loading } = useApi<Paginated<EnrollmentRow>>('/enrollments/me?limit=6');

  const enrollments = data?.data ?? [];
  const inProgress = enrollments.filter((e) => e.progressPct > 0 && e.progressPct < 100);
  const completed = enrollments.filter((e) => e.progressPct === 100);

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#12283E] via-[#16506B] to-primary p-6 text-white shadow-lift">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-light/80">{t('dash.subtitle')}</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">
              {t('dash.greeting', { name: user?.name?.split(' ')[0] ?? 'QA' })} 👋
            </h2>
          </div>
          <ButtonLink href="/catalog" size="sm" className="bg-white text-navy hover:bg-primary-light shrink-0">
            {t('dash.findNewClass')}
          </ButtonLink>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('dash.classesJoined')}
          value={data?.meta.total ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label={t('dash.inProgress')}
          value={inProgress.length}
          icon={<PlayCircle className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label={t('dash.totalXp')}
          value={formatNumber(user?.xp ?? 0)}
          hint={t('dash.level', { level: user?.level ?? 1 })}
          icon={<Zap className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label={t('dash.streak')}
          value={t('dash.days', { count: user?.streakDays ?? 0 })}
          icon={<Flame className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title={t('dash.continueLearning')}
          description={t('dash.lastOpened')}
          action={
            <Link
              href="/dashboard/classes"
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t('common.viewAll')}
            </Link>
          }
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </CardBody>
        ) : enrollments.length === 0 ? (
          <EmptyState
            title={t('dash.noClasses')}
            description={t('dash.noClassesHint')}
            action={
              <ButtonLink href="/catalog" size="sm">
                {t('common.exploreCatalog')}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {enrollments.map((e) => (
              <li key={e.id} data-testid="enrollment-card">
                <Link
                  href={`/learn/${e.course.slug}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-light text-2xl">
                    {e.course.icon ?? '🎓'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy dark:text-white">
                      {e.course.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {t('dash.lessonsDone', { done: e.completedLessons, total: e.course.lessonCount })}
                    </p>
                    <Progress value={e.progressPct} className="mt-2" showLabel />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {completed.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title={t('dash.readyForCert')}
            description={t('dash.classesComplete', { count: completed.length })}
            action={
              <ButtonLink href="/dashboard/certificates" size="sm" variant="outline">
                <Award className="h-4 w-4" /> {t('cert.title')}
              </ButtonLink>
            }
          />
          <CardBody className="flex flex-wrap gap-2">
            {completed.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-2 rounded-full bg-success-light px-3 py-1.5 text-sm font-semibold text-emerald-700"
              >
                <Trophy className="h-4 w-4" />
                {e.course.title}
              </span>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
