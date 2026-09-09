'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/format';

/** Tombol ringkas: sekali klik bergantian terang ⇄ gelap. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const t = useT();

  return (
    <button
      type="button"
      onClick={toggle}
      title={t('theme.toggle')}
      aria-label={t('theme.toggle')}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        className,
      )}
    >
      {resolved === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

const OPTIONS: Array<{ value: Theme; icon: typeof Sun; labelKey: 'theme.light' | 'theme.dark' | 'theme.system' }> = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
];

/** Tiga pilihan eksplisit — dipakai di drawer mobile & panel pengaturan. */
export function ThemeSegmented({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useT();

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className={cn(
        'inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            theme === o.value
              ? 'bg-primary text-white'
              : 'text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white',
          )}
        >
          <o.icon className="h-3.5 w-3.5" />
          {t(o.labelKey)}
        </button>
      ))}
    </div>
  );
}
