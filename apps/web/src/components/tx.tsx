'use client';

import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

/**
 * Menampilkan satu teks terjemahan di dalam Server Component.
 *
 * Halaman publik dirender di server demi SEO, sehingga tidak bisa memakai
 * hook. Komponen kecil ini menjadi jembatannya: server merender strukturnya,
 * teksnya diselesaikan di klien mengikuti bahasa yang dipilih.
 */
export function Tx({
  k,
  vars,
}: {
  k: TranslationKey;
  vars?: Record<string, string | number>;
}) {
  return <>{useT()(k, vars)}</>;
}
