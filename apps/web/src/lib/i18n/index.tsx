'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  dictionaries,
  LOCALES,
  type Locale,
  type TranslationKey,
} from './dictionaries';

export { LOCALE_LABEL, LOCALES, type Locale } from './dictionaries';

export const LOCALE_KEY = 'tc.locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Menerjemahkan kunci; `vars` mengisi placeholder `{nama}`. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Skrip pra-paint: menyetel atribut lang agar pembaca layar langsung benar. */
export const LOCALE_INIT_SCRIPT = `
(function(){
  try {
    var l = localStorage.getItem('${LOCALE_KEY}');
    if (l === 'id' || l === 'en') document.documentElement.lang = l;
  } catch (e) {}
})();
`;

function detectLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  // Bahasa Indonesia adalah default; hanya beralih ke Inggris bila peramban
  // sama sekali tidak menyebut bahasa Indonesia/Melayu.
  const prefers = navigator.languages ?? [navigator.language];
  const wantsId = prefers.some((l) => /^(id|ms)/i.test(l));
  return wantsId ? 'id' : prefers.some((l) => /^en/i.test(l)) ? 'en' : 'id';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    const next = detectLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next);
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      // Bahasa Indonesia dipakai sebagai cadangan bila kunci belum diterjemahkan.
      const template = dictionaries[locale][key] ?? dictionaries.id[key] ?? key;
      if (!vars) return template;
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n harus dipakai di dalam <I18nProvider>');
  return ctx;
}

/** Pintasan bila hanya butuh fungsi terjemahan. */
export function useT() {
  return useI18n().t;
}

/**
 * Mengambil nilai konten CMS sesuai bahasa aktif.
 *
 * Blok konten disimpan sebagai JSON, sehingga terjemahan bisa ditambahkan
 * tanpa migrasi database: cukup isi kunci bersufiks `_en` di CMS, mis.
 * `{ "heading": "Kuasai…", "heading_en": "Master…" }`. Bila kunci Inggris
 * belum ada, teks Indonesia yang dipakai — halaman tidak pernah kosong.
 */
export function pickLocalized(
  data: Record<string, unknown> | null | undefined,
  key: string,
  locale: Locale,
): string {
  if (!data) return '';
  if (locale !== 'id') {
    const translated = data[`${key}_${locale}`];
    if (typeof translated === 'string' && translated.trim()) return translated;
  }
  const base = data[key];
  return typeof base === 'string' ? base : '';
}
