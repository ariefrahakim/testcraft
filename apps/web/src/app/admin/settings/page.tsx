'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { SiteSettingsDto } from '@testcraft/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Checkbox, Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';

export default function SiteSettingsPage() {
  const t = useT();
  const { data, loading, reload } = useApi<SiteSettingsDto>('/cms/settings');
  const [form, setForm] = useState<SiteSettingsDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function set<K extends keyof SiteSettingsDto>(key: K, value: SiteSettingsDto[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage(null);
    setBusy(true);
    try {
      await api.patch('/cms/settings', form, { auth: true });
      setMessage({ tone: 'success', text: t('adm.settingsSaved') });
      reload();
    } catch (err) {
      setMessage({
        tone: 'danger',
        text: err instanceof Error ? err.message : t('crud.saveFailed'),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
    );
  }

  return (
    <>
      <PageHeader
        title={t('adm.settingsTitle')}
        description={t('adm.settingsSubtitle')}
      />

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader title={t('adm.brandIdentity')} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('adm.brandName')} htmlFor="brandName" required>
              <Input
                id="brandName"
                value={form.brandName}
                onChange={(e) => set('brandName', e.target.value)}
                required
              />
            </Field>
            <Field label={t('adm.tagline')} htmlFor="tagline">
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
              />
            </Field>
            <Field
              label={t('adm.primaryColor')}
              htmlFor="primaryColor"
              hint={t('adm.primaryColorHint')}
            >
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                />
                <span
                  className="h-11 w-11 shrink-0 rounded-lg border border-slate-200"
                  style={{ background: form.primaryColor }}
                  aria-hidden
                />
              </div>
            </Field>
            <Field label={t('adm.logoUrl')} htmlFor="logoUrl">
              <Input
                id="logoUrl"
                value={form.logoUrl ?? ''}
                onChange={(e) => set('logoUrl', e.target.value)}
                placeholder={t('adm.logoUrlPlaceholder')}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('adm.contactSection')} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('auth.email')} htmlFor="contactEmail" required>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                required
              />
            </Field>
            <Field
              label="WhatsApp"
              htmlFor="whatsapp"
              hint={t('adm.whatsappHint')}
            >
              <Input
                id="whatsapp"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
              />
            </Field>
            <Field label={t('adm.address')} htmlFor="address">
              <Input
                id="address"
                value={form.address ?? ''}
                onChange={(e) => set('address', e.target.value)}
              />
            </Field>
            <Field label="LinkedIn" htmlFor="linkedin">
              <Input
                id="linkedin"
                value={form.socials?.linkedin ?? ''}
                onChange={(e) =>
                  set('socials', { ...(form.socials ?? {}), linkedin: e.target.value })
                }
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t('adm.currencyTax')}
            description={t('adm.currencyTaxHint')}
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Field label={t('adm.mainCurrency')} htmlFor="defaultCurrency">
              <Select
                id="defaultCurrency"
                value={form.defaultCurrency}
                onChange={(e) =>
                  set('defaultCurrency', e.target.value as SiteSettingsDto['defaultCurrency'])
                }
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
            <Field label={t('adm.usdRate')} htmlFor="usdRate">
              <Input
                id="usdRate"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.usdRate}
                onChange={(e) => set('usdRate', Number(e.target.value))}
              />
            </Field>
            <Field label={t('adm.taxPercent')} htmlFor="taxPercent">
              <Input
                id="taxPercent"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={form.taxPercent}
                onChange={(e) => set('taxPercent', Number(e.target.value))}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('adm.maintenance')} />
          <CardBody>
            <Checkbox
              label={t('adm.maintenanceLabel')}
              checked={form.maintenanceMode}
              onChange={(e) => set('maintenanceMode', e.target.checked)}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> {t('adm.saveSettings')}
          </Button>
        </div>
      </form>
    </>
  );
}
