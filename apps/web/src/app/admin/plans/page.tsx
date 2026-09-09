'use client';

import { Badge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';
import { formatIDR } from '@/lib/format';

interface Plan extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  priceIDR: number;
  priceUSD: number;
  interval: string;
  highlighted: boolean;
  active: boolean;
  order: number;
}

const INTERVAL_KEY = {
  ONE_TIME: 'adm.oneTime',
  MONTHLY: 'adm.monthly',
  YEARLY: 'adm.yearly',
} as const;

const COLUMNS: ColumnSpec<Plan>[] = [
  {
    key: 'name',
    labelKey: 'adm.plan',
    render: (p) => (
      <span className="flex items-center gap-2">
        <span className="font-semibold text-navy dark:text-white">{p.name}</span>
        {p.highlighted && <Badge tone="blue">★</Badge>}
      </span>
    ),
  },
  {
    key: 'priceIDR',
    labelKey: 'adm.priceIDR',
    align: 'right',
    render: (p) => (p.priceIDR === 0 ? <ContactUs /> : formatIDR(p.priceIDR)),
  },
  { key: 'priceUSD', labelKey: 'adm.priceUSD', align: 'right', render: (p) => `$${p.priceUSD}` },
  {
    key: 'interval',
    labelKey: 'adm.interval',
    render: (p) => <IntervalLabel value={p.interval} />,
  },
  {
    key: 'active',
    labelKey: 'table.status',
    render: (p) => (
      <Badge tone={p.active ? 'green' : 'slate'}>{p.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
    ),
  },
];

const FIELDS: FieldSpec[] = [
  { name: 'name', labelKey: 'adm.planName', type: 'text', required: true },
  { name: 'slug', labelKey: 'adm.slug', type: 'text', required: true, createOnly: true, hintKey: 'adm.planSlugHint' },
  { name: 'description', labelKey: 'adm.shortDescription', type: 'text', span: 2 },
  { name: 'priceIDR', labelKey: 'adm.priceIDR', type: 'currency', required: true, hintKey: 'adm.priceIdrHint' },
  { name: 'priceUSD', labelKey: 'adm.priceUSD', type: 'currency', required: true },
  { name: 'compareAtIDR', labelKey: 'adm.compareAtIdr', type: 'currency' },
  {
    name: 'interval',
    labelKey: 'adm.billingInterval',
    type: 'select',
    options: [
      { value: 'ONE_TIME', labelKey: 'adm.oneTime' },
      { value: 'MONTHLY', labelKey: 'adm.monthly' },
      { value: 'YEARLY', labelKey: 'adm.yearly' },
    ],
  },
  {
    name: 'features',
    labelKey: 'adm.features',
    type: 'list',
    span: 2,
    hintKey: 'adm.featuresHint',
  },
  { name: 'order', labelKey: 'adm.displayOrder', type: 'number' },
  { name: 'highlighted', labelKey: 'adm.markPopular', type: 'boolean' },
  { name: 'active', labelKey: 'adm.showOnSite', type: 'boolean' },
];

/** Dipisah jadi komponen agar bisa memakai hook di dalam definisi kolom. */
function IntervalLabel({ value }: { value: string }) {
  const t = useT();
  const key = INTERVAL_KEY[value as keyof typeof INTERVAL_KEY];
  return <>{key ? t(key) : value}</>;
}

function ContactUs() {
  return <>{useT()('adm.contactUs')}</>;
}

export default function PlansPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.plansTitle')}
        description={t('adm.plansSubtitle')}
      />
      <ResourceManager<Plan>
        titleKey="adm.planList"
        endpoint="/cms/pricing-plans"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ interval: 'ONE_TIME', active: true, order: 0 }}
      />
    </>
  );
}
