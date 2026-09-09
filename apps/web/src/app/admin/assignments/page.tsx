'use client';

import { useState } from 'react';
import { ClipboardList, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { deadlineInfo } from '@/lib/deadline';
import { useApi } from '@/lib/use-api';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/format';

interface RubricItem {
  criterion: string;
  points: number;
}

interface AssignmentRow {
  id: string;
  title: string;
  brief: string;
  maxPoints: number;
  dueAt: string | null;
  rubric: RubricItem[] | null;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  totalSubmissions: number;
  pendingCount: number;
  gradedCount: number;
}

interface LessonOption {
  id: string;
  title: string;
  module: { title: string; course: { title: string } };
}

/**
 * Tugas & rubrik dikelola satu pintu di CMS. Konfigurasi di sini langsung
 * dipakai dua peran: siswa melihat instruksi + rubrik, mentor menilai
 * memakai rubrik dan tenggat yang sama.
 */
export default function AdminAssignmentsPage() {
  const { t, locale } = useI18n();
  const { data, loading, reload } = useApi<AssignmentRow[]>('/cms/assignments');
  const [editing, setEditing] = useState<AssignmentRow | 'new' | null>(null);
  const [error, setError] = useState('');

  const rows = data ?? [];

  async function remove(row: AssignmentRow) {
    if (
      !window.confirm(
        `Hapus tugas "${row.title}"? Seluruh submission siswa untuk tugas ini ikut terhapus.`,
      )
    )
      return;
    try {
      await api.delete(`/cms/assignments/${row.id}`, { auth: true });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus tugas');
    }
  }

  return (
    <>
      <PageHeader
        title="Tugas & Rubrik"
        description="Sumber tunggal konfigurasi tugas — dipakai halaman siswa dan antrian penilaian mentor."
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Tugas Baru
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="Belum ada tugas"
            description="Buat tugas dan lampirkan ke sebuah materi agar siswa bisa mengumpulkan."
            action={
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" /> Tugas Baru
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const due = deadlineInfo(row.dueAt, locale);
            return (
              <Card key={row.id}>
                <CardHeader
                  title={row.title}
                  description={`${row.courseTitle} · ${row.moduleTitle} · ${row.lessonTitle}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          due.className,
                        )}
                      >
                        {t(due.labelKey, due.labelVars)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(row)}>
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(row)}
                        className="text-danger hover:bg-danger-light"
                        aria-label="Hapus tugas"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                />
                <CardBody className="space-y-3">
                  <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {row.brief}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="slate">{row.maxPoints} poin maksimum</Badge>
                    <Badge tone="slate">{row.rubric?.length ?? 0} kriteria rubrik</Badge>
                    <Badge tone="blue">{row.totalSubmissions} pengumpulan</Badge>
                    {row.pendingCount > 0 && (
                      <Badge tone="amber">{row.pendingCount} menunggu dinilai</Badge>
                    )}
                    {row.gradedCount > 0 && (
                      <Badge tone="green">{row.gradedCount} sudah dinilai</Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <AssignmentForm
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

function AssignmentForm({
  row,
  onClose,
  onSaved,
}: {
  row: AssignmentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: lessons } = useApi<LessonOption[]>(
    row ? null : '/cms/assignments/available-lessons',
  );

  const [form, setForm] = useState({
    lessonId: row?.lessonId ?? '',
    title: row?.title ?? '',
    brief: row?.brief ?? '',
    maxPoints: String(row?.maxPoints ?? 100),
    dueAt: row?.dueAt ? row.dueAt.slice(0, 10) : '',
  });
  const [rubric, setRubric] = useState<RubricItem[]>(
    row?.rubric?.length ? row.rubric : [{ criterion: '', points: 0 }],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const totalPoints = rubric.reduce((n, r) => n + (Number(r.points) || 0), 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      title: form.title,
      brief: form.brief,
      maxPoints: Number(form.maxPoints) || 100,
      rubric: rubric
        .filter((r) => r.criterion.trim())
        .map((r) => ({ criterion: r.criterion.trim(), points: Number(r.points) || 0 })),
      ...(form.dueAt ? { dueAt: new Date(form.dueAt).toISOString() } : {}),
    };
    try {
      if (row) await api.patch(`/cms/assignments/${row.id}`, payload, { auth: true });
      else
        await api.post(
          '/cms/assignments',
          { ...payload, lessonId: form.lessonId },
          { auth: true },
        );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tugas');
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
        aria-label={row ? 'Ubah tugas' : 'Tugas baru'}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy dark:text-white">
            {row ? 'Ubah Tugas' : 'Tugas Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={save} className="space-y-4">
          {error && <Alert>{error}</Alert>}

          {!row && (
            <Field
              label="Lampirkan ke materi"
              htmlFor="lessonId"
              required
              hint="Hanya materi yang belum punya tugas yang bisa dipilih"
            >
              <Select
                id="lessonId"
                value={form.lessonId}
                onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))}
                required
              >
                <option value="">— pilih materi —</option>
                {(lessons ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.module.course.title} › {l.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Judul tugas" htmlFor="title" required>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Final Project — Framework Playwright"
              required
            />
          </Field>

          <Field label="Instruksi pengerjaan" htmlFor="brief" required>
            <Textarea
              id="brief"
              rows={4}
              value={form.brief}
              onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
              placeholder="Jelaskan apa yang harus dikerjakan dan bentuk pengumpulannya…"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Poin maksimum" htmlFor="maxPoints">
              <Input
                id="maxPoints"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.maxPoints}
                onChange={(e) => setForm((f) => ({ ...f, maxPoints: e.target.value }))}
              />
            </Field>
            <Field
              label="Tenggat pengumpulan"
              htmlFor="dueAt"
              hint="Mentor melihat tenggat ini dengan penanda warna"
            >
              <Input
                id="dueAt"
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Rubrik penilaian</span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  totalPoints === Number(form.maxPoints)
                    ? 'text-success'
                    : 'text-amber-600',
                )}
              >
                Total {totalPoints} / {form.maxPoints} poin
              </span>
            </div>

            <div className="space-y-2">
              {rubric.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    aria-label={`Kriteria ${i + 1}`}
                    placeholder="Kriteria, mis. Kelengkapan test case"
                    value={r.criterion}
                    onChange={(e) =>
                      setRubric((list) =>
                        list.map((x, j) =>
                          j === i ? { ...x, criterion: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={`Poin kriteria ${i + 1}`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="w-24 shrink-0"
                    value={r.points}
                    onChange={(e) =>
                      setRubric((list) =>
                        list.map((x, j) =>
                          j === i ? { ...x, points: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus kriteria"
                    onClick={() => setRubric((list) => list.filter((_, j) => j !== i))}
                    className="shrink-0 text-danger hover:bg-danger-light"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setRubric((list) => [...list, { criterion: '', points: 0 }])}
            >
              <Plus className="h-4 w-4" /> Tambah Kriteria
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Tugas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
