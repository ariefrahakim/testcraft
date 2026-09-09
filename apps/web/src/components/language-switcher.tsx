'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { LOCALE_LABEL, LOCALES, useI18n, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/format';

/** Dropdown bendera + kode bahasa, mengikuti pola di situs perusahaan. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('lang.select')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <span aria-hidden className="text-base leading-none">
          {LOCALE_LABEL[locale].flag}
        </span>
        {LOCALE_LABEL[locale].short}
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.label')}
          className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift dark:border-slate-700 dark:bg-slate-900"
        >
          {LOCALES.map((l: Locale) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={locale === l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-navy transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span aria-hidden className="text-base leading-none">
                  {LOCALE_LABEL[l].flag}
                </span>
                <span className="flex-1">{LOCALE_LABEL[l].name}</span>
                {locale === l && <Check className="h-4 w-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Versi tombol berjajar untuk drawer mobile. */
export function LanguageSegmented({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="radiogroup"
      aria-label={t('lang.label')}
      className={cn(
        'inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
    >
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          onClick={() => setLocale(l)}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            locale === l
              ? 'bg-primary text-white'
              : 'text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white',
          )}
        >
          <span aria-hidden>{LOCALE_LABEL[l].flag}</span>
          {LOCALE_LABEL[l].short}
        </button>
      ))}
    </div>
  );
}
