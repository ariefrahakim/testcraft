'use client';

import { useState } from 'react';
import { Check, Loader2, Mail, Phone } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  interest: string | null;
  message: string | null;
  source: string;
  handled: boolean;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const t = useT();
  const { data, loading, reload } = useApi<Paginated<LeadRow>>('/leads?limit=50');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const rows = data?.data ?? [];
  const pending = rows.filter((r) => !r.handled).length;

  async function markHandled(lead: LeadRow) {
    setError('');
    setBusyId(lead.id);
    try {
      await api.patch(`/leads/${lead.id}`, { handled: !lead.handled }, { auth: true });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crud.saveFailed'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t('adm.leadsTitle')}
        description={t('adm.leadsSubtitle')}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card>
        <CardHeader
          title={t('adm.leadList')}
          description={t('adm.leadsSummary', { total: data?.meta.total ?? 0, pending })}
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t('adm.noLeads')}
            description={t('adm.noLeadsHint')}
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('adm.name')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.contact')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.interest')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.arrived')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td data-label={t('adm.name')} className="py-3 pr-4 font-semibold text-navy dark:text-white">
                      {l.name}
                    </td>
                    <td data-label={t('adm.contact')} className="py-3 pr-4">
                      <span className="flex flex-col gap-0.5 text-xs text-slate-600">
                        {l.email && (
                          <a
                            href={`mailto:${l.email}`}
                            className="inline-flex items-center gap-1.5 hover:text-primary"
                          >
                            <Mail className="h-3.5 w-3.5" /> {l.email}
                          </a>
                        )}
                        {l.phone && (
                          <a
                            href={`https://wa.me/${l.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5" /> {l.phone}
                          </a>
                        )}
                      </span>
                    </td>
                    <td data-label={t('adm.interest')} className="py-3 pr-4 text-slate-600">
                      {l.interest ?? '—'}
                    </td>
                    <td data-label={t('adm.arrived')} className="py-3 pr-4 text-slate-500">
                      {formatDate(l.createdAt)}
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <Badge tone={l.handled ? 'green' : 'amber'}>
                        {t(l.handled ? 'adm.leadHandled' : 'adm.leadNew')}
                      </Badge>
                    </td>
                    <td data-label={t('table.actions')} className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => markHandled(l)}
                        disabled={busyId === l.id}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {busyId === l.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {t(l.handled ? 'adm.markNew' : 'adm.markDone')}
                      </button>
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
