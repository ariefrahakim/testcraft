'use client';

import { CreditCard } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate, formatIDR } from '@/lib/format';

interface PaymentRow {
  id: string;
  invoiceNo: string;
  status: string;
  provider: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  items: Array<{ titleSnapshot: string }>;
}

export default function BillingPage() {
  const t = useT();
  const { data, loading } = useApi<Paginated<PaymentRow>>('/payments/me?limit=50');
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader title={t('billing.title')} description={t('billing.subtitle')} />

      <Card>
        <CardHeader
          title={t('billing.history')}
          description={t('billing.transactions', { count: data?.meta.total ?? 0 })}
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title={t('billing.empty')}
            description={t('billing.emptyHint')}
            action={
              <ButtonLink href="/catalog" size="sm">
                {t('common.exploreCatalog')}
              </ButtonLink>
            }
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.invoice')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.total')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label={t('table.invoice')} className="py-3 pr-4 font-mono text-xs font-bold">
                      {p.invoiceNo}
                    </td>
                    <td data-label={t('table.class')} className="py-3 pr-4 text-slate-600">
                      {p.items.map((i) => i.titleSnapshot).join(', ')}
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td data-label={t('table.total')} className="py-3 pr-4 text-right font-semibold tabular-nums">
                      {formatIDR(p.total)}
                    </td>
                    <td data-label={t('table.date')} className="py-3 text-right text-slate-500">
                      {formatDate(p.paidAt ?? p.createdAt)}
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
