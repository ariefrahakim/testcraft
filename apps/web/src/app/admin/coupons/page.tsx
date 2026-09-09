'use client';

import { Badge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';
import { formatDate, formatIDR } from '@/lib/format';

interface Coupon extends Record<string, unknown> {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENT' | 'FIXED_IDR';
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

const COLUMNS: ColumnSpec<Coupon>[] = [
  {
    key: 'code',
    labelKey: 'adm.couponCode',
    render: (c) => (
      <span className="font-mono font-bold text-navy dark:text-white">{c.code}</span>
    ),
  },
  {
    key: 'value',
    labelKey: 'adm.discount',
    render: (c) =>
      c.discountType === 'PERCENT' ? `${c.value}%` : formatIDR(c.value),
  },
  {
    key: 'usage',
    labelKey: 'adm.used',
    align: 'right',
    render: (c) => `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ''}`,
  },
  {
    key: 'expiresAt',
    labelKey: 'adm.expiresAt',
    render: (c) => (c.expiresAt ? formatDate(c.expiresAt) : '—'),
  },
  {
    key: 'active',
    labelKey: 'table.status',
    render: (c) => (
      <Badge tone={c.active ? 'green' : 'slate'}>
        {c.active ? 'ACTIVE' : 'INACTIVE'}
      </Badge>
    ),
  },
];

const FIELDS: FieldSpec[] = [
  { name: 'code', labelKey: 'adm.couponCode', type: 'text', required: true, placeholder: 'MERDEKA50' },
  {
    name: 'discountType',
    labelKey: 'adm.discountType',
    type: 'select',
    required: true,
    options: [
      { value: 'PERCENT', labelKey: 'adm.discountPercent' },
      { value: 'FIXED_IDR', labelKey: 'adm.discountFixed' },
    ],
  },
  {
    name: 'value',
    labelKey: 'adm.discountValue',
    type: 'currency',
    required: true,
    hintKey: 'adm.discountValueHint',
  },
  { name: 'maxUses', labelKey: 'adm.maxUses', type: 'number', hintKey: 'adm.maxUsesHint' },
  { name: 'maxUsesPerUser', labelKey: 'adm.maxPerUser', type: 'number' },
  { name: 'minPurchaseIDR', labelKey: 'adm.minPurchase', type: 'currency' },
  { name: 'startsAt', labelKey: 'adm.startsAt', type: 'date' },
  { name: 'expiresAt', labelKey: 'adm.expiresAt', type: 'date' },
  { name: 'description', labelKey: 'adm.note', type: 'textarea', span: 2 },
  { name: 'active', labelKey: 'adm.activateCoupon', type: 'boolean' },
];

export default function CouponsPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.couponsTitle')}
        description={t('adm.couponsSubtitle')}
      />
      <ResourceManager<Coupon>
        titleKey="adm.couponList"
        endpoint="/cms/coupons"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ discountType: 'PERCENT', active: true, maxUsesPerUser: 1 }}
        emptyTitleKey="adm.noCoupons"
        emptyDescriptionKey="adm.noCouponsHint"
      />
    </>
  );
}
