import type { Metadata } from 'next';
import { CourseCard } from '@/components/course-card';
import { Tx } from '@/components/tx';
import { CatalogFilters } from '@/components/catalog-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { getCategories, getCourses } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Katalog Kelas',
  description:
    'Jelajahi kelas software testing, QA automation, API testing, performance testing, dan AI for QA.',
};

export const revalidate = 60;

interface SearchParams {
  q?: string;
  category?: string;
  level?: string;
  sort?: string;
  page?: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page ?? 1);
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.level) params.set('level', searchParams.level);
  if (searchParams.sort) params.set('sort', searchParams.sort);

  const [{ data: courses, meta }, categories] = await Promise.all([
    getCourses(`?${params.toString()}`),
    getCategories(),
  ]);

  return (
    <div className="container py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl dark:text-white">
          <Tx k="catalog.title" />
        </h1>
        <p className="mt-1.5 text-slate-500">
          {meta.total} <Tx k="catalog.subtitle" />
        </p>
      </header>

      <CatalogFilters categories={categories} />

      {courses.length === 0 ? (
        <EmptyState
          title={<Tx k="catalog.empty" />}
          description={<Tx k="catalog.emptyHint" />}
          action={
            <ButtonLink href="/catalog" variant="outline" size="sm">
              <Tx k="catalog.resetFilter" />
            </ButtonLink>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Navigasi halaman"
        >
          <ButtonLink
            href={buildHref(searchParams, page - 1)}
            variant="outline"
            size="sm"
            aria-disabled={!meta.hasPrev}
            className={!meta.hasPrev ? 'pointer-events-none opacity-40' : ''}
          >
            <Tx k="catalog.prev" />
          </ButtonLink>
          <span className="text-sm text-slate-500">
            <Tx k="catalog.pageOf" vars={{ page: meta.page, total: meta.totalPages }} />
          </span>
          <ButtonLink
            href={buildHref(searchParams, page + 1)}
            variant="outline"
            size="sm"
            aria-disabled={!meta.hasNext}
            className={!meta.hasNext ? 'pointer-events-none opacity-40' : ''}
          >
            <Tx k="catalog.next" />
          </ButtonLink>
        </nav>
      )}
    </div>
  );
}

function buildHref(params: SearchParams, page: number): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && k !== 'page') sp.set(k, v);
  });
  sp.set('page', String(Math.max(1, page)));
  return `/catalog?${sp.toString()}`;
}
