'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Menu,
  PlayCircle,
} from 'lucide-react';
import type { CourseDetailDto } from '@testcraft/shared';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/use-api';
import { cn, formatSeconds } from '@/lib/format';

interface LessonProgressMap {
  [lessonId: string]: boolean;
}

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const { loading: authLoading } = useRequireAuth();
  const { data: course, loading } = useApi<CourseDetailDto>(`/courses/${slug}`);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [done, setDone] = useState<LessonProgressMap>({});
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Daftar lesson yang diratakan — memudahkan navigasi sebelumnya/berikutnya.
  const flat = useMemo(
    () =>
      (course?.modules ?? []).flatMap((m) =>
        m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
      ),
    [course],
  );

  useEffect(() => {
    if (!activeId && flat.length) setActiveId(flat[0].id);
  }, [flat, activeId]);

  const index = flat.findIndex((l) => l.id === activeId);
  const active = index >= 0 ? flat[index] : null;
  const completedCount = Object.values(done).filter(Boolean).length;
  const progressPct = flat.length ? Math.round((completedCount / flat.length) * 100) : 0;

  async function markDone(lessonId: string) {
    setSaving(true);
    try {
      await api.post(
        `/enrollments/lessons/${lessonId}/progress`,
        { completed: true },
        { auth: true },
      );
      setDone((d) => ({ ...d, [lessonId]: true }));
      if (index < flat.length - 1) setActiveId(flat[index + 1].id);
    } catch {
      // Progres bersifat non-kritis: jangan menghalangi siswa melanjutkan.
      setDone((d) => ({ ...d, [lessonId]: true }));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-display text-lg font-bold text-navy dark:text-white">
            Kelas tidak ditemukan
          </p>
          <Link href="/dashboard" className="mt-2 inline-block text-primary hover:underline">
            Kembali ke ruang belajar
          </Link>
        </div>
      </div>
    );
  }

  const curriculum = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <Link
          href="/dashboard/classes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kelas Saya
        </Link>
        <p className="mt-3 line-clamp-2 font-display font-bold text-navy dark:text-white">
          {course.title}
        </p>
        <Progress value={progressPct} className="mt-3" showLabel />
        <p className="mt-1.5 text-xs text-slate-500">
          {completedCount} dari {flat.length} materi selesai
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {course.modules.map((m) => (
          <div key={m.id} className="mb-4">
            <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {m.title}
            </p>
            <ul className="space-y-0.5">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(l.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                      activeId === l.id
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    {done[l.id] ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <PlayCircle className="h-4 w-4 shrink-0 opacity-60" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    <span
                      className={cn(
                        'shrink-0 text-xs tabular-nums',
                        activeId === l.id ? 'text-white/70' : 'text-slate-400',
                      )}
                    >
                      {formatSeconds(l.durationSec)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0B1220]">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {curriculum}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/50 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-lift dark:bg-slate-900">
            {curriculum}
          </div>
        </div>
      )}

      <div className="lg:pl-80">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka daftar materi"
            className="grid h-10 w-10 place-items-center rounded-xl text-navy hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>
          <p className="ml-auto text-sm font-semibold tabular-nums text-slate-500">
            {progressPct}% selesai
          </p>
        </header>

        <main className="mx-auto max-w-4xl p-4 sm:p-6">
          {active ? (
            <>
              <div className="grid aspect-video place-items-center rounded-2xl bg-navy text-white">
                {/* Pemutar sesungguhnya (Cloudflare Stream / Mux) dipasang di sini
                    memakai active.videoId. */}
                <div className="text-center">
                  <PlayCircle className="mx-auto h-14 w-14 opacity-80" />
                  <p className="mt-3 px-4 font-semibold">{active.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatSeconds(active.durationSec)} · {active.moduleTitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-extrabold text-navy dark:text-white">
                    {active.title}
                  </h1>
                  <p className="text-sm text-slate-500">{active.moduleTitle}</p>
                </div>

                <Button
                  onClick={() => markDone(active.id)}
                  disabled={saving || done[active.id]}
                  variant={done[active.id] ? 'success' : 'primary'}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {done[active.id] ? 'Selesai' : 'Tandai Selesai'}
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index <= 0}
                  onClick={() => setActiveId(flat[index - 1].id)}
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index >= flat.length - 1}
                  onClick={() => setActiveId(flat[index + 1].id)}
                >
                  Berikutnya <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="flex items-center gap-2 font-display font-bold text-navy dark:text-white">
                  <FileText className="h-4 w-4 text-primary" /> Catatan materi
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {course.description}
                </p>
              </section>
            </>
          ) : (
            <p className="text-slate-500">Kelas ini belum memiliki materi.</p>
          )}
        </main>
      </div>
    </div>
  );
}
