'use client';

import { GoogleIcon } from '@/components/brand/icons';
import { API_URL } from '@/lib/api';

/**
 * Tombol "Lanjutkan dengan Google" mengikuti pedoman merek Google:
 * lambang "G" empat warna resmi (bukan emoji), latar putih, teks gelap.
 */
export function GoogleButton({ label = 'Lanjutkan dengan Google' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = `${API_URL}/auth/google`;
      }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-slate-200 bg-white
                 text-[15px] font-semibold text-navy transition hover:bg-slate-50
                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      <GoogleIcon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function AuthDivider({ label = 'atau' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
