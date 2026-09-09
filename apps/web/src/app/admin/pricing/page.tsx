'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search } from 'lucide-react';
import type { Paginated } from '@testcraft/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Input } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { discountPct, formatIDR } from '@/lib/format';

interface CourseRow {
  id: string;
  title: string;
  icon: string | null;
  status: string;
  priceIDR: number;
  priceUSD: number;
  compareAtIDR: number | null;
  isFree: boolean;
}

interface Draft {
  priceIDR: string;
  priceUSD: string;
  compareAtIDR: string;
  isFree: boolean;
}

/**
 * Editor harga massal: ubah beberapa baris lalu simpan sekali.
 * Backend memakai satu transaksi sehingga harga tidak pernah setengah tersimpan.
 */
export default function PricingPage() {
  const t = useT();
  const { data, loading, reload } = useApi<Paginated<CourseRow>>(
    '/courses?limit=100&status=PUBLISHED',
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  const rows = useMemo(() => data?.data ?? [], [data]);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        rows.map((c) => [
          c.id,
          {
            priceIDR: String(c.priceIDR),
            priceUSD: String(c.priceUSD),
            compareAtIDR: c.compareAtIDR ? String(c.compareAtIDR) : '',
            isFree: c.isFree,
          },
        ]),
      ),
    );
  }, [rows]);

  const visible = rows.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  const changed = rows.filter((c) => {
    const d = drafts[c.id];
    if (!d) return false;
    return (
      Number(d.priceIDR) !== c.priceIDR ||
      Number(d.priceUSD) !== c.priceUSD ||
      (d.compareAtIDR ? Number(d.compareAtIDR) : null) !== c.compareAtIDR ||
      d.isFree !== c.isFree
    );
  });

  function set(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveAll() {
    setMessage(null);
    setBusy(true);
    try {
      const items = changed.map((c) => {
        const d = drafts[c.id];
        return {
          courseId: c.id,
          priceIDR: Number(d.priceIDR) || 0,
          priceUSD: Number(d.priceUSD) || 0,
          ...(d.compareAtIDR ? { compareAtIDR: Number(d.compareAtIDR) } : {}),
          isFree: d.isFree,
        };
      });
      const res = await api.patch<{ updated: number }>(
        '/courses/pricing/bulk',
        { items },
        { auth: true },
      );
      setMessage({ tone: 'success', text: t('adm.pricesUpdated', { count: res.updated }) });
      reload();
    } catch (err) {
      setMessage({
        tone: 'danger',
        text: err instanceof Error ? err.message : t('crud.saveFailed'),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('adm.pricingTitle')}
        description={t('adm.pricingSubtitle')}
        action={
          <Button onClick={saveAll} disabled={busy || changed.length === 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {t('common.save')} {changed.length > 0 && `(${changed.length})`}
          </Button>
        }
      />

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <Card>
        <CardHeader
          title={t('adm.priceList')}
          description={t('adm.publishedCount', { count: rows.length })}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('adm.searchCourse')}
                className="w-full pl-9 sm:w-64"
                aria-label={t('nav.searchCourses')}
              />
            </div>
          }
        />
        <CardBody className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : (
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.priceIDR')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.priceUSD')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.compareAt')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.discount')}</th>
                  <th className="pb-2 font-semibold">{t('adm.free')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map((c) => {
                  const d = drafts[c.id];
                  if (!d) return null;
                  const off = discountPct(Number(d.priceIDR), Number(d.compareAtIDR) || null);
                  return (
                    <tr key={c.id}>
                      <td data-label={t('table.class')} className="py-2.5 pr-4">
                        <span className="flex items-center gap-2">
                          <span aria-hidden>{c.icon ?? '🎓'}</span>
                          <span className="font-semibold text-navy dark:text-white">
                            {c.title}
                          </span>
                          <StatusBadge status={c.status} />
                        </span>
                      </td>
                      <td data-label={t('adm.priceIDR')} className="py-2.5 pr-4">
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${t('adm.priceIDR')} ${c.title}`}
                          value={d.priceIDR}
                          onChange={(e) => set(c.id, { priceIDR: e.target.value })}
                          className="w-36"
                        />
                      </td>
                      <td data-label={t('adm.priceUSD')} className="py-2.5 pr-4">
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${t('adm.priceUSD')} ${c.title}`}
                          value={d.priceUSD}
                          onChange={(e) => set(c.id, { priceUSD: e.target.value })}
                          className="w-24"
                        />
                      </td>
                      <td data-label={t('adm.compareAt')} className="py-2.5 pr-4">
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${t('adm.compareAt')} ${c.title}`}
                          value={d.compareAtIDR}
                          onChange={(e) => set(c.id, { compareAtIDR: e.target.value })}
                          className="w-36"
                          placeholder="—"
                        />
                      </td>
                      <td data-label={t('adm.discount')} className="py-2.5 pr-4 tabular-nums">
                        {off > 0 ? (
                          <span className="font-semibold text-danger">-{off}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td data-label={t('adm.free')} className="py-2.5">
                        <input
                          type="checkbox"
                          aria-label={t('adm.makeFree', { title: c.title })}
                          checked={d.isFree}
                          onChange={(e) => set(c.id, { isFree: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <p className="mt-4 text-sm text-slate-500">
        {t('adm.priceRange', {
          min: formatIDR(Math.min(...rows.map((c) => c.priceIDR), 0)),
          max: formatIDR(Math.max(...rows.map((c) => c.priceIDR), 0)),
        })}
      </p>
    </>
  );
}
