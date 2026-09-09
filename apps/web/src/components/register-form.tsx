'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthDivider, GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { Alert, Checkbox, Field, Input, PasswordInput } from '@/components/ui/field';
import { homePathFor, useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

export function RegisterForm() {
  const { register } = useAuth();
  const t = useT();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) return setError(t('error.nameRequired'));
    if (!email) return setError(t('error.emailRequired'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError(t('error.emailInvalid'));
    }
    if (!form.password) return setError(t('error.passwordRequired'));
    if (form.password.length < 8) return setError(t('error.passwordTooShort'));
    if (!agree) return setError(t('error.mustAgree'));

    setSubmitting(true);
    try {
      const user = await register({
        name,
        email,
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      router.push(homePathFor(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.registerFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('auth.loginHere')}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton label={t('auth.googleRegister')} />
        <AuthDivider label={t('auth.or')} />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <Alert>{error}</Alert>}

          <Field label={t('auth.fullName')} htmlFor="name" required>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder={t('auth.fullNamePlaceholder')}
              value={form.name}
              onChange={set('name')}
              required
            />
          </Field>

          <Field label={t('auth.email')} htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('auth.emailPlaceholder')}
              value={form.email}
              onChange={set('email')}
              required
            />
          </Field>

          <Field label={t('auth.whatsapp')} htmlFor="phone" hint={t('auth.whatsappHint')}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+62 812-3456-7890"
              value={form.phone}
              onChange={set('phone')}
            />
          </Field>

          <Field
            label={t('auth.password')}
            htmlFor="new-password"
            required
            hint={t('auth.passwordHint')}
          >
            <PasswordInput
              id="new-password"
              name="password"
              autoComplete="new-password"
              placeholder={t('auth.newPasswordPlaceholder')}
              value={form.password}
              onChange={set('password')}
              required
            />
          </Field>

          <Checkbox
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            label={
              <span>
                {t('auth.agree')}{' '}
                <Link href="/terms" className="font-semibold text-primary hover:underline">
                  {t('footer.terms')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" className="font-semibold text-primary hover:underline">
                  {t('footer.privacy')}
                </Link>
              </span>
            }
          />

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t('auth.creating') : t('auth.submitRegister')}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
