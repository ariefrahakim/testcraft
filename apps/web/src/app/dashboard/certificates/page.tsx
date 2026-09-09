'use client';

import { Award, ExternalLink } from 'lucide-react';
import type { CertificateDto } from '@testcraft/shared';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

export default function CertificatesPage() {
  const t = useT();
  const { data, loading } = useApi<CertificateDto[]>('/certificates/me');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('cert.title')}
        description={t('cert.subtitle')}
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
            icon={<Award className="h-6 w-6" />}
            title={t('cert.empty')}
            description={t('cert.emptyHint')}
            action={
              <ButtonLink href="/dashboard/classes" size="sm">
                {t('cert.viewMyClasses')}
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success-light text-emerald-700">
                    <Award className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-navy dark:text-white">
                      {c.courseTitle}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{c.number}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {t('cert.scoreIssued', { score: c.scorePct, date: formatDate(c.issuedAt) })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <ButtonLink href={`/verify?n=${c.number}`} size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" /> {t('cert.verify')}
                  </ButtonLink>
                  {c.pdfUrl && (
                    <ButtonLink href={c.pdfUrl} size="sm" target="_blank">
                      {t('cert.downloadPdf')}
                    </ButtonLink>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
