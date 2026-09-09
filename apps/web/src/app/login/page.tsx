'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthDivider, GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { Alert, Checkbox, Field, Input, PasswordInput } from '@/components/ui/field';
import { homePathFor, useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

/** Pesan untuk `?error=` yang dikirim balik oleh alur OAuth. */
const OAUTH_ERRORS: Record<string, Record<'id' | 'en', string>> = {
  google_not_configured: {
    id: 'Masuk dengan Google belum diaktifkan pada server ini. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di apps/api/.env, lalu jalankan ulang API.',
    en: 'Google sign-in is not enabled on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in apps/api/.env, then restart the API.',
  },
  google_failed: {
    id: 'Proses masuk dengan Google dibatalkan atau gagal. Silakan coba lagi.',
    en: 'Google sign-in was cancelled or failed. Please try again.',
  },
  account_inactive: {
    id: 'Akun Anda dinonaktifkan. Hubungi admin untuk mengaktifkannya kembali.',
    en: 'Your account has been deactivated. Contact an admin to reactivate it.',
  },
};

function LoginForm() {
  const { login, rememberedEmail, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useI18n();

  const next = params.get('next');
  const oauthError = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill hanya bila pengguna pernah mencentang "Ingat saya" di perangkat ini.
  // Password tidak pernah kami simpan — itu urusan password manager browser.
  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, [rememberedEmail]);

  useEffect(() => {
    if (user) router.replace(next ?? homePathFor(user.role));
  }, [user, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Divalidasi lebih dulu di klien agar pengguna tidak menunggu bolak-balik
    // ke server hanya untuk isian yang jelas kosong.
    const trimmed = email.trim();
    if (!trimmed) return setError(t('error.emailRequired'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return setError(t('error.emailInvalid'));
    }
    if (!password) return setError(t('error.passwordRequired'));

    setSubmitting(true);
    try {
      const loggedIn = await login(trimmed, password, remember);
      router.push(next ?? homePathFor(loggedIn.role));
    } catch (err) {
      // Pesan dari API sudah mengikuti Accept-Language, jadi bisa langsung dipakai.
      setError(err instanceof Error ? err.message : t('error.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const googleNotConfigured = oauthError === 'google_not_configured';
  const banner = error || (oauthError && !googleNotConfigured ? OAUTH_ERRORS[oauthError]?.[locale] : '');

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t('auth.registerFree')}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {banner && <Alert data-testid="login-error">{banner}</Alert>}

        {!googleNotConfigured && (
          <>
            <GoogleButton label={t('auth.googleLogin')} />
            <AuthDivider label={t('auth.or')} />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label={t('auth.email')} htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label={t('auth.password')} htmlFor="password" required>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <div className="flex items-center justify-between">
            <Checkbox
              label={t('auth.remember')}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t('auth.forgot')}
            </Link>
          </div>

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t('auth.processing') : t('auth.submitLogin')}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
