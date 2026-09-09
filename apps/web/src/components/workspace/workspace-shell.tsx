'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import type { Role } from '@testcraft/shared';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth, useRequireAuth } from '@/lib/auth-context';
import { cn, initials } from '@/lib/format';

export interface NavItem {
  href: string;
  /** Kunci kamus, bukan teks jadi — supaya menu ikut berganti bahasa. */
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Angka lencana, mis. jumlah tugas yang menunggu dinilai. */
  badge?: number;
  exact?: boolean;
}

export interface NavSection {
  titleKey?: TranslationKey;
  items: NavItem[];
}

/**
 * Kerangka area kerja: sidebar tetap di desktop, drawer di mobile.
 * Sekaligus menjaga akses — hanya role di `allowed` yang boleh masuk.
 */
export function WorkspaceShell({
  sections,
  allowed,
  titleKey,
  children,
}: {
  sections: NavSection[];
  allowed: Role[];
  titleKey: TranslationKey;
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth(allowed);
  const { logout } = useAuth();
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 bg-[#0F2438]">
        <Link href="/">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('nav.closeMenu')}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {sections.map((section, i) => (
          <div key={section.titleKey ?? i}>
            {section.titleKey && (
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t(section.titleKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                        active
                          ? 'bg-primary/15 text-primary border-r-2 border-primary'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                      {!!item.badge && item.badge > 0 && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                            active ? 'bg-primary/25 text-primary' : 'bg-danger text-white',
                          )}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-200">
              {user.name}
            </span>
            <span className="block truncate text-xs text-slate-500">{user.email}</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          block
          onClick={() => void logout()}
          className="text-slate-400 hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0B1220]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/5 bg-[#0F2438] lg:block">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/50 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs bg-[#0F2438] shadow-lift">
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-100/80 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('nav.openMenu')}
            className="grid h-10 w-10 place-items-center rounded-xl text-navy hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="truncate font-display text-lg font-bold text-navy dark:text-white">
            {t(titleKey)}
          </h1>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher className="hidden sm:block" />
            <Link
              href="/notifications"
              aria-label={t('nav.notifications')}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

/** Judul halaman di dalam area kerja. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-xl font-extrabold text-navy dark:text-white">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
