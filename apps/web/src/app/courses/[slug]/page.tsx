import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  Clock,
  FileText,
  Lock,
  PlayCircle,
  Star,
  Users,
} from 'lucide-react';
import type { CourseDetailDto } from '@testcraft/shared';
import { EnrollPanel } from '@/components/enroll-panel';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  discountPct,
  formatDuration,
  formatNumber,
  formatSeconds,
  LEVEL_LABEL,
} from '@/lib/format';

export const revalidate = 60;

async function getCourse(slug: string): Promise<CourseDetailDto | null> {
  try {
    return await api.get<CourseDetailDto>(`/courses/${slug}`, { revalidate: 60 });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: 'Kelas tidak ditemukan' };
  return {
    title: course.title,
    description: course.subtitle ?? course.description.slice(0, 155),
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const off = discountPct(course.priceIDR, course.compareAtIDR);
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-navy py-10 text-white dark:border-slate-800">
        <div className="container grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{course.category.name}</Badge>
              <Badge tone="slate">{LEVEL_LABEL[course.level] ?? course.level}</Badge>
              {course.isBestseller && <Badge tone="amber">Terlaris</Badge>}
              {off > 0 && <Badge tone="red">Diskon {off}%</Badge>}
            </div>

            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-4xl">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-3 max-w-2xl text-slate-300">{course.subtitle}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                {course.rating.toFixed(1)}
                <span className="font-normal text-slate-400">
                  ({formatNumber(course.reviewCount)} ulasan)
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {formatNumber(course.studentCount)} peserta
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(course.durationMin)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" />
                {totalLessons} materi
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-300">
              Instruktur{' '}
              <span className="font-semibold text-white">{course.instructor.name}</span>
              {course.instructor.headline && ` · ${course.instructor.headline}`}
            </p>
          </div>

          {/* Panel enroll — sticky di desktop, menempel bawah di mobile. */}
          <EnrollPanel course={course} />
        </div>
      </section>

      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {course.outcomes.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-navy dark:text-white">
                Yang akan Anda kuasai
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-success" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl font-bold text-navy dark:text-white">
              Kurikulum
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {course.modules.length} modul · {totalLessons} materi ·{' '}
              {formatDuration(course.durationMin)}
            </p>

            <div className="mt-4 space-y-3">
              {course.modules.map((m) => (
                <details
                  key={m.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  open={m.order === 1}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy dark:text-white">{m.title}</p>
                      <p className="text-xs text-slate-500">
                        {m.lessons.length} materi{m.hasQuiz && ' · 1 kuis'}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-primary transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                    {m.lessons.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-3 px-4 py-3 text-sm"
                      >
                        {l.isPreview ? (
                          <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Lock className="h-4 w-4 shrink-0 text-slate-300" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                          {l.title}
                        </span>
                        {l.isPreview && <Badge tone="green">Pratinjau</Badge>}
                        <span className="shrink-0 tabular-nums text-xs text-slate-400">
                          {formatSeconds(l.durationSec)}
                        </span>
                      </li>
                    ))}
                    {m.hasQuiz && (
                      <li className="flex items-center gap-3 px-4 py-3 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-amber-500" />
                        <span className="flex-1 text-slate-600 dark:text-slate-300">
                          Kuis modul
                        </span>
                      </li>
                    )}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-navy dark:text-white">
              Deskripsi
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
              {course.description}
            </p>
          </section>

          {course.prerequisites.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-navy dark:text-white">
                Prasyarat
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-slate-600 dark:text-slate-300">
                {course.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
