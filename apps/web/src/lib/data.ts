/**
 * Konten cadangan saat API belum tersedia (misalnya saat `next build`
 * dijalankan tanpa backend hidup). Semua data sebenarnya berasal dari CMS.
 */
import type { FaqDto, TestimonialDto } from '@testcraft/shared';

export const FALLBACK_SETTINGS = {
  brandName: 'TestCraft Indonesia',
  tagline: 'Learn. Build. Automate.',
  primaryColor: '#2563EB',
  contactEmail: 'testcraftindonesia@gmail.com',
  whatsapp: '6282395568743',
  socials: {} as Record<string, string>,
  defaultCurrency: 'IDR' as const,
  usdRate: 16000,
  taxPercent: 11,
  maintenanceMode: false,
};

export const FALLBACK_STATS = [
  { value: '28.400+', label: 'Peserta Aktif' },
  { value: '48', label: 'Kelas Expert' },
  { value: '24', label: 'Instruktur Industri' },
  { value: '12.400+', label: 'Sertifikat Terbit' },
];

export const FALLBACK_TESTIMONIALS: TestimonialDto[] = [];
export const FALLBACK_FAQS: FaqDto[] = [];

export const HEADER_NAV = [
  { label: 'Katalog', url: '/catalog' },
  { label: 'Jalur Belajar', url: '/paths' },
  { label: 'Harga', url: '/pricing' },
  { label: 'Corporate', url: '/corporate' },
  { label: 'Verifikasi Sertifikat', url: '/verify' },
];
