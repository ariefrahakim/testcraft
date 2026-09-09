'use client';

import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

interface PageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  _count: { blocks: number };
}

export default function AdminPagesPage() {
  const t = useT();
  const { data, loading } = useApi<PageRow[]>('/cms/pages');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('adm.pagesTitle')}
        description={t('adm.pagesSubtitle')}
      />

      <Card>
        <CardHeader
          title={t('adm.pageList')}
          description={t('adm.pagesCount', { count: rows.length })}
          action={
            <ButtonLink href="/admin/pages/new" size="sm">
              <Plus className="h-4 w-4" /> {t('adm.newPage')}
            </ButtonLink>
          }
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t('adm.noPages')}
            description={t('adm.noPagesHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('adm.page')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('adm.blocks')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.updated')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label={t('adm.page')} className="py-3 pr-4">
                      <span className="block font-semibold text-navy dark:text-white">
                        {p.title}
                      </span>
                      <span className="block font-mono text-xs text-slate-500">/{p.slug}</span>
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td data-label={t('adm.blocks')} className="py-3 pr-4 text-right tabular-nums">
                      {p._count.blocks}
                    </td>
                    <td data-label={t('adm.updated')} className="py-3 pr-4 text-slate-500">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td data-label={t('table.actions')} className="py-3 text-right">
                      <Link
                        href={`/admin/pages/${p.slug}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {t('adm.manageBlocks')}
                      </Link>
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
