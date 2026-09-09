'use client';

import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

/* ------------------------------ Skema field ----------------------------- */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'boolean'
  | 'select'
  | 'date'
  | 'list';

/**
 * Semua teks memakai kunci kamus, bukan string biasa. Tipenya yang memaksa —
 * label baru tidak mungkin lolos tanpa terjemahan.
 */
export interface FieldSpec {
  name: string;
  labelKey: TranslationKey;
  type: FieldType;
  /** Placeholder biasanya contoh nilai (mis. "MERDEKA50"), jadi tetap literal. */
  placeholder?: string;
  hintKey?: TranslationKey;
  required?: boolean;
  options?: Array<{ value: string; labelKey: TranslationKey }>;
  /** Lebar kolom di grid form (default 1). */
  span?: 1 | 2;
  /** Sembunyikan saat mengubah data yang sudah ada (mis. slug). */
  createOnly?: boolean;
}

export interface ColumnSpec<T> {
  key: string;
  labelKey: TranslationKey;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface ResourceTexts {
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  emptyTitleKey?: TranslationKey;
  emptyDescriptionKey?: TranslationKey;
}

interface ResourceManagerProps<T> extends ResourceTexts {
  /** Endpoint daftar & create, mis. "/cms/coupons". */
  endpoint: string;
  /** Bentuk respons: array polos atau { data, meta }. */
  paginated?: boolean;
  columns: ColumnSpec<T>[];
  fields: FieldSpec[];
  /** Nilai awal form tambah. */
  defaults?: Record<string, unknown>;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Petunjuk tambahan di atas tabel. */
  notice?: React.ReactNode;
}

type Row = Record<string, unknown> & { id: string };

/**
 * CRUD generik berbasis skema untuk seluruh entitas CMS.
 * Satu komponen ini dipakai kupon, banner, paket harga, testimoni, dan FAQ —
 * menambah entitas baru cukup mendefinisikan `columns` + `fields`.
 */
export function ResourceManager<T extends Row>({
  titleKey,
  descriptionKey,
  endpoint,
  paginated,
  columns,
  fields,
  defaults = {},
  emptyTitleKey,
  emptyDescriptionKey,
  notice,
}: ResourceManagerProps<T>) {
  const t = useT();
  const { data, loading, error, reload } = useApi<T[] | { data: T[] }>(endpoint);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const rows: T[] = Array.isArray(data)
    ? data
    : paginated && data && 'data' in data
      ? data.data
      : [];

  async function remove(row: T) {
    const name = String(row.name ?? row.title ?? row.code ?? row.id);
    if (!window.confirm(t('crud.confirmDelete', { name }))) return;
    setActionError('');
    setBusyId(row.id);
    try {
      await api.delete(`${endpoint}/${row.id}`, { auth: true });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('crud.deleteFailed'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={t(titleKey)}
          description={descriptionKey ? t(descriptionKey) : undefined}
          action={
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> {t('crud.add')}
            </Button>
          }
        />

        {notice && <CardBody className="pb-0">{notice}</CardBody>}
        {(error || actionError) && (
          <CardBody className="pb-0">
            <Alert>{actionError || error}</Alert>
          </CardBody>
        )}

        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t(emptyTitleKey ?? 'crud.empty')}
            description={t(emptyDescriptionKey ?? 'crud.emptyHint')}
            action={
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" /> {t('crud.add')}
              </Button>
            }
          />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`pb-2 pr-4 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}
                    >
                      {t(c.labelKey)}
                    </th>
                  ))}
                  <th className="pb-2 text-right font-semibold">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        data-label={t(c.labelKey)}
                        className={`py-3 pr-4 ${c.align === 'right' ? 'text-right' : ''}`}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                    <td data-label={t('table.actions')} className="py-3 text-right">
                      <span className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(row)}
                          aria-label={t('crud.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(row)}
                          disabled={busyId === row.id}
                          aria-label={t('crud.delete')}
                          className="text-danger hover:bg-danger-light"
                        >
                          {busyId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>

      {editing && (
        <ResourceForm
          endpoint={endpoint}
          fields={fields}
          defaults={defaults}
          row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

/* -------------------------------- Form --------------------------------- */

function ResourceForm({
  endpoint,
  fields,
  defaults,
  row,
  onClose,
  onSaved,
}: {
  endpoint: string;
  fields: FieldSpec[];
  defaults: Record<string, unknown>;
  row: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = { ...defaults };
    if (row) {
      for (const f of fields) {
        const v = row[f.name];
        if (v === null || v === undefined) continue;
        base[f.name] =
          f.type === 'list' && Array.isArray(v)
            ? v.join('\n')
            : f.type === 'date' && typeof v === 'string'
              ? v.slice(0, 10)
              : v;
      }
    }
    return base;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (name: string, value: unknown) =>
    setValues((v) => ({ ...v, [name]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    // Rakit payload sesuai tipe field agar backend menerima tipe yang benar.
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      if (row && f.createOnly) continue;
      const raw = values[f.name];
      if (raw === undefined || raw === '') continue;

      switch (f.type) {
        case 'number':
        case 'currency':
          payload[f.name] = Number(raw);
          break;
        case 'boolean':
          payload[f.name] = Boolean(raw);
          break;
        case 'list':
          payload[f.name] = String(raw)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          break;
        case 'date':
          payload[f.name] = new Date(String(raw)).toISOString();
          break;
        default:
          payload[f.name] = raw;
      }
    }
    // Boolean yang tidak dicentang tetap harus terkirim sebagai false.
    for (const f of fields.filter((x) => x.type === 'boolean')) {
      if (!(f.name in payload)) payload[f.name] = false;
    }

    try {
      if (row) await api.patch(`${endpoint}/${row.id}`, payload, { auth: true });
      else await api.post(endpoint, payload, { auth: true });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crud.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-navy/50 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(row ? 'crud.editData' : 'crud.addData')}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy dark:text-white">
            {t(row ? 'crud.editData' : 'crud.addData')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('crud.close')}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={save} className="space-y-4">
          {error && <Alert>{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            {fields
              .filter((f) => !(row && f.createOnly))
              .map((f) => (
                <div key={f.name} className={f.span === 2 ? 'sm:col-span-2' : ''}>
                  {f.type === 'boolean' ? (
                    <div className="pt-7">
                      <Checkbox
                        label={t(f.labelKey)}
                        checked={Boolean(values[f.name])}
                        onChange={(e) => set(f.name, e.target.checked)}
                      />
                      {f.hintKey && (
                        <p className="mt-1.5 text-xs text-slate-500">{t(f.hintKey)}</p>
                      )}
                    </div>
                  ) : (
                    <Field
                      label={t(f.labelKey)}
                      hint={f.hintKey ? t(f.hintKey) : undefined}
                      required={f.required}
                      htmlFor={`f-${f.name}`}
                    >
                      {f.type === 'textarea' || f.type === 'list' ? (
                        <Textarea
                          id={`f-${f.name}`}
                          rows={f.type === 'list' ? 4 : 3}
                          placeholder={
                            f.placeholder ??
                            (f.type === 'list' ? t('crud.onePerLine') : undefined)
                          }
                          value={String(values[f.name] ?? '')}
                          onChange={(e) => set(f.name, e.target.value)}
                          required={f.required}
                        />
                      ) : f.type === 'select' ? (
                        <Select
                          id={`f-${f.name}`}
                          value={String(values[f.name] ?? '')}
                          onChange={(e) => set(f.name, e.target.value)}
                          required={f.required}
                        >
                          <option value="">{t('crud.choose')}</option>
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {t(o.labelKey)}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={`f-${f.name}`}
                          type={
                            f.type === 'number' || f.type === 'currency'
                              ? 'number'
                              : f.type === 'date'
                                ? 'date'
                                : 'text'
                          }
                          inputMode={
                            f.type === 'number' || f.type === 'currency'
                              ? 'numeric'
                              : undefined
                          }
                          min={f.type === 'currency' ? 0 : undefined}
                          placeholder={f.placeholder}
                          value={String(values[f.name] ?? '')}
                          onChange={(e) => set(f.name, e.target.value)}
                          required={f.required}
                        />
                      )}
                    </Field>
                  )}
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
