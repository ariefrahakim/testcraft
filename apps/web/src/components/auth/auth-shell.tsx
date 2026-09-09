'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

const HIGHLIGHTS: TranslationKey[] = [
  'auth.highlight1',
  'auth.highlight2',
  'auth.highlight3',
];

/** Tata letak dua kolom untuk halaman masuk & daftar. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = useT();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel brand — disembunyikan di mobile agar form langsung terlihat. */}
      <aside className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <Link href="/" className="[&_span]:text-white">
          <Logo />
        </Link>
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Quality Software.
            <br />
            Confident Delivery.
          </h2>
          <ul className="mt-7 space-y-3.5">
            {HIGHLIGHTS.map((key) => (
              <li key={key} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/20">
                  <Check className="h-3 w-3 text-success" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} TestCraft Indonesia
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="lg:invisible">
              <Logo />
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-navy dark:text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </main>
    </div>
  );
}
