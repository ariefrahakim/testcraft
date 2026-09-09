'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Paginated, CourseSummaryDto } from '@testcraft/shared';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatIDR, formatNumber } from '@/lib/format';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

export default function AdminCoursesPage() {
  const t = useT();
  const [q, setQ] = useState('');
  const { data, loading } = useApi<Paginated<CourseSummaryDto>>('/courses?limit=100');
  const rows = (data?.data ?? []).filter((c) =>
    c.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title={t('adm.coursesTitle')}
        description={t('adm.coursesSubtitle')}
        action={
          <ButtonLink href="/admin/pricing" size="sm" variant="outline">
            {t('adm.managePricing')}
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader
          title={t('adm.courseList')}
          description={t('adm.coursesCount', { count: data?.meta.total ?? 0 })}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('adm.searchCourse')}
                aria-label={t('nav.searchCourses')}
                className="w-full pl-9 sm:w-64"
              />
            </div>
          }
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState title={t('adm.noCourses')} description={t('adm.noCoursesHint')} />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.category')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.level')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.participants')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.price')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((c) => (
                  <tr key={c.id} data-testid="course-row">
                    <td data-label={t('table.class')} className="py-3 pr-4">
                      <Link
                        href={`/courses/${c.slug}`}
                        className="flex items-center gap-2 font-semibold text-navy hover:text-primary dark:text-white"
                      >
                        <span aria-hidden>{c.icon ?? '🎓'}</span>
                        {c.title}
                      </Link>
                    </td>
                    <td data-label={t('table.category')} className="py-3 pr-4 text-slate-600">
                      {c.category.name}
                    </td>
                    <td data-label={t('table.level')} className="py-3 pr-4 text-slate-600">
                      {t(`catalog.level.${c.level}` as TranslationKey)}
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td data-label={t('table.participants')} className="py-3 pr-4 text-right tabular-nums">
                      {formatNumber(c.studentCount)}
                    </td>
                    <td data-label={t('table.price')} className="py-3 text-right tabular-nums">
                      {c.isFree ? t('catalog.free') : formatIDR(c.priceIDR)}
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
