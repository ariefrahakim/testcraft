'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select } from '@/components/ui/field';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/format';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  courseCount: number;
}

const LEVELS: Array<{ value: string; key: TranslationKey }> = [
  { value: '', key: 'catalog.allLevels' },
  { value: 'BEGINNER', key: 'catalog.level.BEGINNER' },
  { value: 'INTERMEDIATE', key: 'catalog.level.INTERMEDIATE' },
  { value: 'ADVANCED', key: 'catalog.level.ADVANCED' },
];

const SORTS: Array<{ value: string; key: TranslationKey }> = [
  { value: 'popular', key: 'catalog.sort.popular' },
  { value: 'newest', key: 'catalog.sort.newest' },
  { value: 'rating', key: 'catalog.sort.rating' },
  { value: 'price_asc', key: 'catalog.sort.price_asc' },
  { value: 'price_desc', key: 'catalog.sort.price_desc' },
];

export function CatalogFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();

  const [q, setQ] = useState(params.get('q') ?? '');
  const activeCategory = params.get('category') ?? '';

  const push = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) sp.set(k, v);
        else sp.delete(k);
      });
      sp.delete('page'); // filter berubah → kembali ke halaman 1
      router.push(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router],
  );

  // Debounce pencarian agar tidak memanggil server tiap ketukan.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (q === current) return;
    const timer = setTimeout(() => push({ q }), 400);
    return () => clearTimeout(timer);
  }, [q, params, push]);

  const hasFilter = activeCategory || params.get('level') || params.get('q');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            aria-label={t('nav.searchCourses')}
            className="input pl-10"
          />
        </div>

        <div className="flex gap-3">
          <Select
            aria-label={t('catalog.allLevels')}
            value={params.get('level') ?? ''}
            onChange={(e) => push({ level: e.target.value })}
            className="flex-1 sm:w-40"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {t(l.key)}
              </option>
            ))}
          </Select>

          <Select
            aria-label={t('catalog.sortBy')}
            value={params.get('sort') ?? 'popular'}
            onChange={(e) => push({ sort: e.target.value })}
            className="flex-1 sm:w-48"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.key)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Chip kategori — bisa digeser horizontal di mobile. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        <FilterChip
          active={!activeCategory}
          onClick={() => push({ category: '' })}
          label={t('catalog.allCategories')}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            active={activeCategory === c.slug}
            onClick={() => push({ category: c.slug })}
            label={`${c.icon ?? ''} ${c.name}`.trim()}
            count={c.courseCount}
          />
        ))}
      </div>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            router.push(pathname);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-danger"
        >
          <X className="h-3.5 w-3.5" /> {t('catalog.clearFilters')}
        </button>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn('ml-1.5 text-xs', active ? 'text-white/70' : 'text-slate-400')}>
          {count}
        </span>
      )}
    </button>
  );
}

export { SlidersHorizontal };
