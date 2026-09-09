'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  lessonCount: number;
}

export default function InstructorContentPage() {
  const t = useT();
  const { data, loading } = useApi<CourseRow[]>('/instructor/courses');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('mentor.contentTitle')}
        description={t('mentor.contentSubtitle')}
      />

      <Card>
        <CardHeader title={t('mentor.coursesAndLessons')} />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Video className="h-6 w-6" />}
            title={t('mentor.noContent')}
            description={t('mentor.noContentHint')}
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="flex items-center gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-xl">
                    {c.icon ?? '🎓'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy dark:text-white">
                      {c.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {t('mentor.lessonsCount', { count: c.lessonCount })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
