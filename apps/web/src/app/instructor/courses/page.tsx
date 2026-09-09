'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatIDR, formatNumber, LEVEL_LABEL } from '@/lib/format';

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  status: string;
  level: string;
  studentCount: number;
  rating: number;
  reviewCount: number;
  lessonCount: number;
  priceIDR: number;
  category: { name: string };
}

export default function InstructorCoursesPage() {
  const t = useT();
  const { data, loading } = useApi<CourseRow[]>('/instructor/courses');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('mentor.myCoursesTitle')}
        description={t('mentor.myCoursesPageSubtitle')}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={t('mentor.noCourses')}
            description={t('mentor.noCoursesHint')}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-light text-2xl">
                    {c.icon ?? '🎓'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${c.slug}`}
                      className="line-clamp-2 font-display font-bold text-navy hover:text-primary dark:text-white"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {c.category.name} · {LEVEL_LABEL[c.level] ?? c.level}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t('table.participants')}</dt>
                    <dd className="font-display font-bold text-navy dark:text-white">
                      {formatNumber(c.studentCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t('table.rating')}</dt>
                    <dd className="font-display font-bold text-navy dark:text-white">
                      {c.rating.toFixed(1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t('table.materials')}</dt>
                    <dd className="font-display font-bold text-navy dark:text-white">
                      {c.lessonCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t('table.price')}</dt>
                    <dd className="font-display text-sm font-bold text-navy dark:text-white">
                      {formatIDR(c.priceIDR)}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
