'use client';

import { Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate, formatIDR } from '@/lib/format';

interface Payouts {
  grossIDR: number;
  sharePct: number;
  estimatedPayoutIDR: number;
  transactions: Array<{
    invoiceNo: string;
    paidAt: string | null;
    courseTitle: string;
    amountIDR: number;
    payoutIDR: number;
  }>;
}

export default function PayoutsPage() {
  const t = useT();
  const { data, loading } = useApi<Payouts>('/instructor/payouts');
  const rows = data?.transactions ?? [];

  return (
    <>
      <PageHeader
        title={t('mentor.payoutsTitle')}
        description={t('mentor.payoutsSubtitle')}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('mentor.gross')}
          value={formatIDR(data?.grossIDR ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label={t('mentor.share')}
          value={`${data?.sharePct ?? 0}%`}
          hint={t('mentor.shareHint')}
        />
        <StatCard
          label={t('mentor.estimated')}
          value={formatIDR(data?.estimatedPayoutIDR ?? 0)}
          tone="success"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title={t('mentor.txDetail')}
          description={t('mentor.txDetailHint')}
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title={t('mentor.noSales')}
            description={t('mentor.noSalesHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.invoice')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.date')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('mentor.amount')}</th>
                  <th className="pb-2 text-right font-semibold">{t('mentor.payout')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.invoiceNo}>
                    <td data-label={t('table.invoice')} className="py-3 pr-4 font-mono text-xs font-bold">
                      {row.invoiceNo}
                    </td>
                    <td data-label={t('table.class')} className="py-3 pr-4 text-slate-600">
                      {row.courseTitle}
                    </td>
                    <td data-label={t('table.date')} className="py-3 pr-4 text-slate-500">
                      {row.paidAt ? formatDate(row.paidAt) : '—'}
                    </td>
                    <td data-label={t('mentor.amount')} className="py-3 pr-4 text-right tabular-nums">
                      {formatIDR(row.amountIDR)}
                    </td>
                    <td data-label={t('mentor.payout')} className="py-3 text-right font-semibold tabular-nums text-success">
                      {formatIDR(row.payoutIDR)}
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
