'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';

/**
 * Navbar & footer publik hanya untuk halaman marketing / siswa.
 * Area kerja (admin, instruktur, player belajar) memakai chrome-nya sendiri,
 * jadi di sana keduanya disembunyikan.
 */
const BARE_PREFIXES = [
  '/admin',
  '/instructor',
  '/dashboard',
  '/learn',
  '/notifications',
  '/login',
  '/register',
  '/forgot-password',
  '/verify',
];

export function SiteChrome({
  footer,
  children,
}: {
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = BARE_PREFIXES.some((p) => pathname.startsWith(p));

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
