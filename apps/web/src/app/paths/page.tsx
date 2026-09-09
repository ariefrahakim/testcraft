import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getLearningPaths } from '@/lib/content';
import { formatDuration, formatIDR, LEVEL_LABEL } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Jalur Belajar',
  description:
    'Rangkaian kelas berurutan dari pemula sampai siap kerja: QA Automation Engineer, API Testing Specialist, dan AI-Powered QA Engineer.',
};

export const revalidate = 300;

export default async function LearningPathsPage() {
  const paths = await getLearningPaths();

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-primary-light/40 to-transparent py-14 text-center dark:border-slate-800 dark:from-slate-900">
        <div className="container max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold text-navy sm:text-4xl dark:text-white">
            Jalur Belajar Terstruktur
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Bingung mulai dari mana? Ikuti urutan kelas yang sudah dirancang membawa Anda
            dari pemula sampai siap kerja.
          </p>
        </div>
      </section>

      <section className="container py-12">
        {paths.length === 0 ? (
          <EmptyState
            title="Belum ada jalur belajar"
            description="Jalur belajar akan tampil setelah admin menyusunnya."
            action={
              <ButtonLink href="/catalog" size="sm">
                Lihat Katalog
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-8">
            {paths.map((path) => (
              <article
                key={path.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center dark:border-slate-800">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-light text-3xl">
                    {path.icon ?? '🎯'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-extrabold text-navy dark:text-white">
                      {path.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{path.description}</p>
                  </div>
                  <Badge tone="blue" className="shrink-0 self-start sm:self-center">
                    <Clock className="h-3.5 w-3.5" />
                    {path.months} bulan · {path.steps.length} kelas
                  </Badge>
                </div>

                <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                  {path.steps.map((step, i) => (
                    <li key={step.course.slug}>
                      <Link
                        href={`/courses/${step.course.slug}`}
                        className="flex items-center gap-4 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-navy dark:text-white">
                            {step.course.title}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {LEVEL_LABEL[step.course.level] ?? step.course.level}
                            {step.course.durationMin > 0 &&
                              ` · ${formatDuration(step.course.durationMin)}`}
                          </span>
                        </span>
                        <span className="hidden shrink-0 text-sm font-semibold text-navy sm:block dark:text-white">
                          {formatIDR(step.course.priceIDR)}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
