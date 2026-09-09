'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/icons';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { waLink } from '@/lib/format';

const INTERESTS = [
  'Belum ditentukan',
  'QA Bootcamp',
  'Playwright Automation Testing',
  'ISTQB Foundation Preparation',
  'Selenium WebDriver with Java',
  'Postman API Testing',
  'AI for Software Testing',
  'Performance Testing',
  'Corporate Training',
];

/** Formulir prospek — mengirim ke POST /leads (endpoint publik). */
export function LeadForm({ whatsapp }: { whatsapp: string }) {
  const t = useT();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: INTERESTS[0],
    message: '',
  });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.email && !form.phone) {
      setError(t('error.contactRequired'));
      return;
    }
    if (!agree) {
      setError(t('error.mustAgree'));
      return;
    }

    setBusy(true);
    try {
      await api.post('/leads', {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        interest: form.interest,
        message: form.message.trim() || undefined,
        source: 'contact-page',
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardBody className="space-y-4 py-12 text-center">
          <p className="font-display text-xl font-extrabold text-navy dark:text-white">
            Terima kasih, {form.name.split(' ')[0]}! 🎉
          </p>
          <p className="mx-auto max-w-sm text-sm text-slate-500">
            Data Anda sudah masuk ke tim Admission. Kami menghubungi Anda lewat WhatsApp
            dalam 1×24 jam kerja.
          </p>
          <ButtonLink
            href={waLink(whatsapp, `Halo TestCraft, saya ${form.name} baru mengisi formulir.`)}
            variant="whatsapp"
            target="_blank"
          >
            <WhatsAppIcon className="h-5 w-5" /> Chat Sekarang
          </ButtonLink>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Formulir Pendaftaran"
        description="Isi email atau nomor WhatsApp — salah satu wajib."
      />
      <CardBody>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert>{error}</Alert>}

          <Field label="Nama lengkap" htmlFor="lead-name" required>
            <Input
              id="lead-name"
              autoComplete="name"
              placeholder="Nama Anda"
              value={form.name}
              onChange={set('name')}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="lead-email">
              <Input
                id="lead-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={set('email')}
              />
            </Field>
            <Field label="No. WhatsApp" htmlFor="lead-phone">
              <Input
                id="lead-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="0812xxxxxxx"
                value={form.phone}
                onChange={set('phone')}
              />
            </Field>
          </div>

          <Field label="Program yang diminati" htmlFor="lead-interest">
            <Select id="lead-interest" value={form.interest} onChange={set('interest')}>
              {INTERESTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Catatan" htmlFor="lead-message" hint="Opsional">
            <Textarea
              id="lead-message"
              rows={3}
              placeholder="Pertanyaan atau jadwal yang diinginkan"
              value={form.message}
              onChange={set('message')}
            />
          </Field>

          <Checkbox
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            label="Saya setuju dihubungi tim TestCraft sesuai Kebijakan Privasi."
          />

          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {busy ? 'Mengirim…' : 'Kirim Pendaftaran'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
