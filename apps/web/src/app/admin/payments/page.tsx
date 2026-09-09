'use client';

import { useState } from 'react';
import type { Paginated } from '@testcraft/shared';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate, formatIDR } from '@/lib/format';

interface PaymentRow {
  id: string;
  invoiceNo: string;
  provider: string;
  status: string;
  total: number;
  couponCode: string | null;
  createdAt: string;
  paidAt: string | null;
  user: { name: string; email: string };
  items: Array<{ titleSnapshot: string }>;
}

const STATUSES = ['', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED'];

export default function AdminPaymentsPage() {
  const t = useT();
  const [status, setStatus] = useState('');
  const { data, loading } = useApi<Paginated<PaymentRow>>(
    `/payments?limit=50${status ? `&status=${status}` : ''}`,
    [status],
  );
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title={t('adm.paymentsTitle')}
        description={t('adm.paymentsSubtitle')}
      />

      <Card>
        <CardHeader
          title={t('adm.invoiceList')}
          description={t('adm.txCount', { count: data?.meta.total ?? 0 })}
          action={
            <Select
              aria-label={t('table.status')}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-48"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || t('adm.allStatuses')}
                </option>
              ))}
            </Select>
          }
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t('adm.noTx')}
            description={t('adm.noTxHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.invoice')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.buyer')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.method')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 text-right font-semibold">{t('table.total')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label={t('table.invoice')} className="py-3 pr-4">
                      <span className="font-mono text-xs font-bold text-navy dark:text-white">
                        {p.invoiceNo}
                      </span>
                      {p.couponCode && (
                        <span className="ml-2 rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-bold text-primary-dark">
                          {p.couponCode}
                        </span>
                      )}
                    </td>
                    <td data-label={t('adm.buyer')} className="py-3 pr-4">
                      <span className="block font-semibold text-navy dark:text-white">
                        {p.user.name}
                      </span>
                      <span className="block text-xs text-slate-500">{p.user.email}</span>
                    </td>
                    <td data-label={t('table.class')} className="py-3 pr-4 text-slate-600">
                      {p.items.map((i) => i.titleSnapshot).join(', ')}
                    </td>
                    <td data-label={t('adm.method')} className="py-3 pr-4 text-slate-600">
                      {p.provider}
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
