import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatIDR = (n: number) =>
  'Rp' + Math.round(n).toLocaleString('id-ID');

export const formatUSD = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');

export const formatNumber = (n: number) => n.toLocaleString('id-ID');

/** 1920 menit → "32 jam". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.round(minutes / 60);
  return `${hours} jam`;
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Pemula',
  INTERMEDIATE: 'Menengah',
  ADVANCED: 'Mahir',
};

export const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

/** Persentase diskon dari harga coret. */
export function discountPct(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
