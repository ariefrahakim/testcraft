'use client';

import { StatusBadge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

interface Banner extends Record<string, unknown> {
  id: string;
  key: string;
  title: string;
  variant: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

const COLUMNS: ColumnSpec<Banner>[] = [
  {
    key: 'title',
    labelKey: 'adm.banner',
    render: (b) => (
      <span>
        <span className="block font-semibold text-navy dark:text-white">{b.title}</span>
        <span className="block font-mono text-xs text-slate-500">{b.key}</span>
      </span>
    ),
  },
  { key: 'variant', labelKey: 'adm.style', render: (b) => b.variant },
  {
    key: 'period',
    labelKey: 'adm.period',
    render: (b) =>
      b.startsAt || b.endsAt
        ? `${b.startsAt ? formatDate(b.startsAt) : '—'} s/d ${b.endsAt ? formatDate(b.endsAt) : '—'}`
        : <AlwaysLabel />,
  },
  {
    key: 'active',
    labelKey: 'table.status',
    render: (b) => (
      <StatusBadge status={b.active ? 'ACTIVE' : 'INACTIVE'} />
    ),
  },
];

const FIELDS: FieldSpec[] = [
  {
    name: 'key',
    labelKey: 'adm.placementKey',
    type: 'text',
    required: true,
    createOnly: true,
    hintKey: 'adm.placementKeyHint',
  },
  { name: 'title', labelKey: 'adm.bannerTitle', type: 'text', required: true },
  { name: 'body', labelKey: 'adm.bannerBody', type: 'textarea', span: 2 },
  { name: 'ctaLabel', labelKey: 'adm.ctaLabel', type: 'text' },
  { name: 'ctaUrl', labelKey: 'adm.ctaUrl', type: 'text' },
  {
    name: 'variant',
    labelKey: 'adm.styleVariant',
    type: 'select',
    options: [
      { value: 'promo', labelKey: 'adm.variantPromo' },
      { value: 'info', labelKey: 'adm.variantInfo' },
      { value: 'warning', labelKey: 'adm.variantWarning' },
    ],
  },
  { name: 'startsAt', labelKey: 'adm.startShowing', type: 'date' },
  { name: 'endsAt', labelKey: 'adm.stopShowing', type: 'date' },
  { name: 'active', labelKey: 'adm.publishBanner', type: 'boolean' },
];

function AlwaysLabel() {
  return <>{useT()('adm.always')}</>;
}

export default function BannersPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.bannersTitle')}
        description={t('adm.bannersSubtitle')}
      />
      <ResourceManager<Banner>
        titleKey="adm.bannerList"
        endpoint="/cms/banners"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ variant: 'promo', active: true }}
      />
    </>
  );
}
