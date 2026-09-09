'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/field';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, REMEMBERED_EMAIL_KEY } from '@/lib/api';
import { homePathFor, useAuth } from '@/lib/auth-context';

/**
 * Titik pendaratan setelah Google mengalihkan pengguna kembali.
 *
 * API mengirim token pada fragment URL (`#accessToken=…`) sehingga token
 * tidak pernah dikirim ke server maupun bocor lewat header Referer.
 * Halaman ini memindahkannya ke localStorage, lalu membersihkan URL.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('Tautan masuk tidak lengkap atau sudah kedaluwarsa.');
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    // Hapus token dari address bar agar tidak ikut ter-bookmark atau ter-share.
    window.history.replaceState(null, '', window.location.pathname);

    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    // Ingat email agar kunjungan berikutnya sudah terisi.
    localStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
    router.replace(homePathFor(user.role));
  }, [user, router]);

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm text-center">
        <Logo className="justify-center" />

        {error ? (
          <div className="mt-6 space-y-4">
            <Alert>{error}</Alert>
            <ButtonLink href="/login" block>
              Kembali ke halaman masuk
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Menyelesaikan proses masuk…</p>
          </div>
        )}
      </div>
    </div>
  );
}
