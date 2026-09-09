'use client';

import { Badge, StatusBadge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';

interface Faq extends Record<string, unknown> {
  id: string;
  question: string;
  answer: string;
  group: string;
  order: number;
  published: boolean;
}

const COLUMNS: ColumnSpec<Faq>[] = [
  {
    key: 'question',
    labelKey: 'adm.question',
    render: (f) => (
      <span className="font-semibold text-navy dark:text-white">{f.question}</span>
    ),
  },
  {
    key: 'answer',
    labelKey: 'adm.answer',
    render: (f) => <span className="line-clamp-2 max-w-md text-slate-600">{f.answer}</span>,
  },
  { key: 'group', labelKey: 'adm.group', render: (f) => <Badge tone="slate">{f.group}</Badge> },
  {
    key: 'published',
    labelKey: 'table.status',
    render: (f) => (
      <StatusBadge status={f.published ? 'PUBLISHED' : 'DRAFT'} />
    ),
  },
];

const FIELDS: FieldSpec[] = [
  { name: 'question', labelKey: 'adm.question', type: 'text', required: true, span: 2 },
  { name: 'answer', labelKey: 'adm.answer', type: 'textarea', required: true, span: 2 },
  { name: 'group', labelKey: 'adm.group', type: 'text', placeholder: 'umum / pembayaran' },
  { name: 'order', labelKey: 'adm.order', type: 'number' },
  { name: 'published', labelKey: 'adm.publish', type: 'boolean' },
];

export default function FaqsPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.faqsTitle')}
        description={t('adm.faqsSubtitle')}
      />
      <ResourceManager<Faq>
        titleKey="adm.faqList"
        endpoint="/cms/faqs"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ group: 'umum', published: true, order: 0 }}
      />
    </>
  );
}
