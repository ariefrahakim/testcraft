'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Field, Input, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const t = useT();
  const [form, setForm] = useState({ name: '', phone: '', bio: '', avatarUrl: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        bio: '',
        avatarUrl: user.avatarUrl ?? '',
      });
    }
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      await api.patch('/users/me', form, { auth: true });
      await refreshUser();
      setMessage({ tone: 'success', text: t('profile.saved') });
    } catch (err) {
      setMessage({
        tone: 'danger',
        text: err instanceof Error ? err.message : t('error.generic'),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <form onSubmit={save}>
        <Card>
          <CardHeader title={t('profile.personalData')} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('auth.fullName')} htmlFor="name" required>
              <Input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label={t('auth.email')} htmlFor="email" hint={t('profile.emailLocked')}>
              <Input id="email" value={user?.email ?? ''} disabled />
            </Field>
            <Field label={t('auth.whatsapp')} htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+62 812-3456-7890"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field label={t('profile.avatarUrl')} htmlFor="avatarUrl">
              <Input
                id="avatarUrl"
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t('profile.bio')} htmlFor="bio">
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder={t('profile.bioPlaceholder')}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> {t('profile.save')}
          </Button>
        </div>
      </form>
    </>
  );
}
