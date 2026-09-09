'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { BannerDto } from '@testcraft/shared';

const TONES: Record<string, string> = {
  promo: 'bg-primary text-white',
  warning: 'bg-warning text-navy',
  info: 'bg-navy text-white',
};

/** Banner pengumuman dari CMS; penutupan diingat per-key di sesi browser. */
export function PromoBanner({ banner }: { banner: BannerDto }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(`tc.banner.${banner.key}`) === '1');
  }, [banner.key]);

  if (dismissed) return null;

  return (
    <div className={TONES[banner.variant] ?? TONES.info}>
      <div className="container flex items-center gap-3 py-2.5 text-sm">
        <p className="flex-1 font-medium">
          <span className="font-bold">{banner.title}</span>
          {banner.body && <span className="hidden sm:inline"> — {banner.body}</span>}
        </p>
        {banner.ctaLabel && banner.ctaUrl && (
          <Link
            href={banner.ctaUrl}
            className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30"
          >
            {banner.ctaLabel}
          </Link>
        )}
        <button
          type="button"
          aria-label="Tutup pengumuman"
          onClick={() => {
            sessionStorage.setItem(`tc.banner.${banner.key}`, '1');
            setDismissed(true);
          }}
          className="shrink-0 rounded-lg p-1 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
