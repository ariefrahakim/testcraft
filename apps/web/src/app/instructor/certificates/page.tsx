'use client';

import { Award } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatNumber } from '@/lib/format';

interface CourseRow {
  id: string;
  title: string;
  icon: string | null;
  studentCount: number;
}

/**
 * Sertifikat diterbitkan otomatis oleh sistem saat siswa lulus.
 * Halaman ini memberi mentor gambaran sebaran peserta per kelas.
 */
export default function InstructorCertificatesPage() {
  const t = useT();
  const { data, loading } = useApi<CourseRow[]>('/instructor/courses');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('cert.title')}
        description={t('mentor.certSubtitle')}
      />

      <Card>
        <CardHeader title={t('mentor.studentsPerCourse')} />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Award className="h-6 w-6" />}
            title={t('mentor.noCertData')}
            description={t('mentor.noCertDataHint')}
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-light text-xl">
                  {c.icon ?? '🎓'}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-navy dark:text-white">
                  {c.title}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-slate-500">
                  {t('mentor.participantsCount', { count: formatNumber(c.studentCount) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
