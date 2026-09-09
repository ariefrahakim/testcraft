'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, Search, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { LanguageSegmented, LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSegmented, ThemeToggle } from '@/components/theme-toggle';
import { ButtonLink, Button } from '@/components/ui/button';
import { homePathFor, useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { cn, initials } from '@/lib/format';

const NAV: Array<{ url: string; key: TranslationKey }> = [
  { url: '/catalog', key: 'nav.catalog' },
  { url: '/paths', key: 'nav.paths' },
  { url: '/pricing', key: 'nav.pricing' },
  { url: '/corporate', key: 'nav.corporate' },
  { url: '/verify', key: 'nav.verify' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const t = useT();

  // Tutup drawer setiap kali pindah halaman.
  useEffect(() => setOpen(false), [pathname]);

  // Kunci scroll body selama drawer mobile terbuka.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="relative sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent dark:border-slate-800 dark:bg-[#0B1220]/85">
      <nav className="container flex h-[68px] items-center gap-4">
        <Link href="/" aria-label={t('nav.home')}>
          <Logo />
        </Link>

        {/* Menu desktop */}
        <ul className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.url);
            return (
              <li key={item.url}>
                <Link
                  href={item.url}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-semibold transition',
                    active
                      ? 'bg-primary-light text-primary-dark dark:bg-primary/20 dark:text-primary-light'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                  )}
                >
                  {t(item.key)}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/catalog"
            aria-label={t('nav.searchCourses')}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          <ThemeToggle className="hidden sm:grid" />
          <LanguageSwitcher className="hidden sm:block" />

          {!loading && !user && (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <ButtonLink href="/login" variant="ghost" size="sm">
                {t('nav.login')}
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                {t('nav.register')}
              </ButtonLink>
            </div>
          )}

          {user && (
            <Link
              href={homePathFor(user.role)}
              className="ml-1 hidden items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 sm:flex"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {initials(user.name)}
              </span>
              <span className="max-w-[9rem] truncate text-sm font-semibold text-navy dark:text-slate-100">
                {user.name}
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('nav.openMenu')}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl text-navy hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/50 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-slide-in flex-col bg-white shadow-lift dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('nav.closeMenu')}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {user && (
                <Link
                  href={homePathFor(user.role)}
                  className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-navy dark:text-white">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {user.email}
                    </span>
                  </span>
                </Link>
              )}

              <ul className="space-y-1">
                {NAV.map((item) => (
                  <li key={item.url}>
                    <Link
                      href={item.url}
                      className="block rounded-xl px-3 py-3 text-[15px] font-semibold text-navy hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Preferensi tampilan — di mobile ditampilkan penuh, bukan ikon. */}
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('theme.label')}
                  </p>
                  <ThemeSegmented className="w-full" />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('lang.label')}
                  </p>
                  <LanguageSegmented />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
              {user ? (
                <Button variant="outline" block onClick={() => void logout()}>
                  <LogOut className="h-4 w-4" /> {t('nav.logout')}
                </Button>
              ) : (
                <>
                  <ButtonLink href="/register" block>
                    {t('nav.register')}
                  </ButtonLink>
                  <ButtonLink href="/login" variant="outline" block>
                    {t('nav.login')}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
