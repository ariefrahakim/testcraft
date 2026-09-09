import Link from 'next/link';
import { ArrowRight, Check, Quote, Star } from 'lucide-react';
import type { ContentBlockDto } from '@testcraft/shared';
import { CourseCard } from '@/components/course-card';
import { MarketingStat } from '@/components/stat-card';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getCourses,
  getFaqs,
  getLearningPaths,
  getPlans,
  getTestimonials,
} from '@/lib/content';
import { formatIDR } from '@/lib/format';

/** Ambil string dari payload blok yang bertipe bebas (Json di DB). */
const str = (data: Record<string, unknown>, key: string, fallback = '') =>
  typeof data[key] === 'string' ? (data[key] as string) : fallback;

const num = (data: Record<string, unknown>, key: string, fallback: number) =>
  typeof data[key] === 'number' ? (data[key] as number) : fallback;

/**
 * Merender satu blok konten CMS. Setiap `BlockType` punya bentuk `data`
 * sendiri; blok yang tidak dikenal sengaja diabaikan agar penambahan tipe
 * baru di CMS tidak merusak halaman produksi.
 */
export async function BlockRenderer({ block }: { block: ContentBlockDto }) {
  if (!block.visible) return null;
  const d = block.data ?? {};

  switch (block.type) {
    case 'HERO':
      return <HeroBlock data={d} />;
    case 'STATS':
      return <StatsBlock data={d} />;
    case 'COURSE_GRID':
      return <CourseGridBlock data={d} />;
    case 'LEARNING_PATHS':
      return <LearningPathsBlock data={d} />;
    case 'TESTIMONIALS':
      return <TestimonialsBlock data={d} />;
    case 'FAQ':
      return <FaqBlock data={d} />;
    case 'PRICING_TABLE':
      return <PricingBlock data={d} />;
    case 'CTA':
      return <CtaBlock data={d} />;
    case 'RICH_TEXT':
      return (
        <Section>
          <div
            className="prose prose-slate mx-auto max-w-3xl dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: str(d, 'html') }}
          />
        </Section>
      );
    default:
      return null;
  }
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`container py-14 sm:py-16 ${className}`}>{children}</section>;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  if (!title) return null;
  return (
    <div className="mb-8 text-center">
      <h2 className="font-display text-2xl font-extrabold text-navy sm:text-3xl dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-2xl text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

/* -------------------------------- Blok -------------------------------- */

function HeroBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-primary-light/40 to-transparent dark:border-slate-800 dark:from-slate-900">
      <div className="container py-16 text-center sm:py-24">
        <Badge tone="blue" className="mb-5">
          Quality Software. Confident Delivery.
        </Badge>
        <h1 className="mx-auto max-w-4xl font-display text-3xl font-extrabold leading-tight text-navy sm:text-5xl dark:text-white">
          {str(data, 'heading', 'Kuasai Software Testing dari Nol sampai Mahir')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          {str(data, 'subheading')}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {str(data, 'ctaLabel') && (
            <ButtonLink href={str(data, 'ctaUrl', '/catalog')} size="lg">
              {str(data, 'ctaLabel')} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )}
          {str(data, 'secondaryCtaLabel') && (
            <ButtonLink
              href={str(data, 'secondaryCtaUrl', '/contact')}
              variant="outline"
              size="lg"
            >
              {str(data, 'secondaryCtaLabel')}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}

function StatsBlock({ data }: { data: Record<string, unknown> }) {
  const items = Array.isArray(data.items)
    ? (data.items as Array<{ value: string; label: string }>)
    : [];
  if (!items.length) return null;

  return (
    <Section className="!py-10">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((s) => (
          <MarketingStat key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
    </Section>
  );
}

async function CourseGridBlock({ data }: { data: Record<string, unknown> }) {
  const limit = num(data, 'limit', 6);
  const filter = str(data, 'filter');
  const query =
    filter === 'featured'
      ? `?featured=true&limit=${limit}`
      : `?limit=${limit}&sort=popular`;
  const { data: courses } = await getCourses(query);
  if (!courses.length) return null;

  return (
    <Section>
      <SectionHeading
        title={str(data, 'heading', 'Kelas Unggulan')}
        subtitle={str(data, 'subheading')}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <ButtonLink href="/catalog" variant="outline">
          Lihat Semua Kelas <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Section>
  );
}

async function LearningPathsBlock({ data }: { data: Record<string, unknown> }) {
  const paths = await getLearningPaths();
  if (!paths.length) return null;

  return (
    <Section className="bg-white dark:bg-slate-900">
      <SectionHeading
        title={str(data, 'heading', 'Jalur Belajar Terstruktur')}
        subtitle="Rangkaian kelas berurutan yang membawa Anda dari pemula sampai siap kerja."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {paths.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-5 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <span className="text-3xl" aria-hidden>
              {p.icon ?? '🎯'}
            </span>
            <h3 className="mt-3 font-display text-lg font-bold text-navy dark:text-white">
              {p.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{p.description}</p>
            <Badge tone="blue" className="mt-3 self-start">
              {p.months} bulan · {p.steps.length} kelas
            </Badge>
            <ol className="mt-4 space-y-2 text-sm">
              {p.steps.map((s, i) => (
                <li key={s.course.slug} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <Link
                    href={`/courses/${s.course.slug}`}
                    className="text-slate-600 hover:text-primary dark:text-slate-300"
                  >
                    {s.course.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Section>
  );
}

async function TestimonialsBlock({ data }: { data: Record<string, unknown> }) {
  const testimonials = await getTestimonials();
  if (!testimonials.length) return null;

  return (
    <Section>
      <SectionHeading title={str(data, 'heading', 'Apa Kata Alumni')} />
      <div className="grid gap-4 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <Quote className="h-6 w-6 text-primary/30" aria-hidden />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              “{t.quote}”
            </blockquote>
            <div className="mt-4 flex items-center gap-1 text-amber-500" aria-label={`${t.rating} dari 5`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <figcaption className="mt-2 text-sm">
              <span className="font-bold text-navy dark:text-white">{t.name}</span>
              {(t.role || t.company) && (
                <span className="block text-xs text-slate-500">
                  {[t.role, t.company].filter(Boolean).join(' · ')}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

async function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const faqs = await getFaqs();
  if (!faqs.length) return null;

  return (
    <Section className="bg-white dark:bg-slate-900">
      <SectionHeading title={str(data, 'heading', 'Pertanyaan yang Sering Diajukan')} />
      <div className="mx-auto max-w-3xl divide-y divide-slate-200 dark:divide-slate-800">
        {faqs.map((f) => (
          <details key={f.id} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy dark:text-white">
              {f.question}
              <span className="shrink-0 text-primary transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

async function PricingBlock({ data }: { data: Record<string, unknown> }) {
  const plans = await getPlans();
  if (!plans.length) return null;

  return (
    <Section>
      <SectionHeading title={str(data, 'heading', 'Pilih Paket yang Sesuai')} />
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-2xl border p-6 ${
              p.highlighted
                ? 'border-primary bg-primary text-white shadow-lift'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            {p.highlighted && (
              <span className="mb-3 self-start rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                Paling Populer
              </span>
            )}
            <h3
              className={`font-display text-lg font-bold ${p.highlighted ? '' : 'text-navy dark:text-white'}`}
            >
              {p.name}
            </h3>
            {p.description && (
              <p className={`mt-1 text-sm ${p.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                {p.description}
              </p>
            )}
            <p className="mt-4 font-display text-3xl font-extrabold">
              {p.priceIDR === 0 ? 'Hubungi Kami' : formatIDR(p.priceIDR)}
            </p>
            {p.compareAtIDR && (
              <p className={`text-sm line-through ${p.highlighted ? 'text-white/60' : 'text-slate-400'}`}>
                {formatIDR(p.compareAtIDR)}
              </p>
            )}
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check
                    className={`h-4 w-4 shrink-0 ${p.highlighted ? '' : 'text-success'}`}
                  />
                  <span className={p.highlighted ? '' : 'text-slate-600 dark:text-slate-300'}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={p.priceIDR === 0 ? '/corporate' : '/catalog'}
              variant={p.highlighted ? 'secondary' : 'primary'}
              block
              className="mt-6"
            >
              {p.priceIDR === 0 ? 'Konsultasi' : 'Mulai Belajar'}
            </ButtonLink>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section>
      <div className="rounded-2xl bg-navy px-6 py-12 text-center text-white sm:px-12">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
          {str(data, 'heading')}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-300">{str(data, 'body')}</p>
        {str(data, 'ctaLabel') && (
          <ButtonLink
            href={str(data, 'ctaUrl', '/catalog')}
            variant="whatsapp"
            size="lg"
            className="mt-6"
          >
            {str(data, 'ctaLabel')}
          </ButtonLink>
        )}
      </div>
    </Section>
  );
}
