'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';

interface Testimonial extends Record<string, unknown> {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  rating: number;
  featured: boolean;
}

const COLUMNS: ColumnSpec<Testimonial>[] = [
  {
    key: 'name',
    labelKey: 'adm.alumni',
    render: (t) => (
      <span>
        <span className="block font-semibold text-navy dark:text-white">{t.name}</span>
        <span className="block text-xs text-slate-500">
          {[t.role, t.company].filter(Boolean).join(' · ') || '—'}
        </span>
      </span>
    ),
  },
  {
    key: 'quote',
    labelKey: 'adm.quote',
    render: (t) => <span className="line-clamp-2 max-w-md text-slate-600">{t.quote}</span>,
  },
  {
    key: 'rating',
    labelKey: 'table.rating',
    align: 'right',
    render: (t) => (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
        <Star className="h-3.5 w-3.5 fill-current" />
        {t.rating}
      </span>
    ),
  },
  {
    key: 'featured',
    labelKey: 'adm.featured',
    render: (row) => <YesNo value={row.featured} />,
  },
];

const FIELDS: FieldSpec[] = [
  { name: 'name', labelKey: 'adm.name', type: 'text', required: true },
  { name: 'role', labelKey: 'adm.jobTitle', type: 'text', placeholder: 'QA Engineer' },
  { name: 'company', labelKey: 'adm.company', type: 'text' },
  { name: 'avatarUrl', labelKey: 'adm.photoUrl', type: 'text' },
  { name: 'quote', labelKey: 'adm.quote', type: 'textarea', required: true, span: 2 },
  { name: 'rating', labelKey: 'adm.ratingField', type: 'number' },
  { name: 'order', labelKey: 'adm.displayOrder', type: 'number' },
  { name: 'featured', labelKey: 'adm.showOnHome', type: 'boolean' },
];

function YesNo({ value }: { value: boolean }) {
  const t = useT();
  return <Badge tone={value ? 'green' : 'slate'}>{t(value ? 'adm.yes' : 'adm.no')}</Badge>;
}

export default function TestimonialsPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.testimonialsTitle')}
        description={t('adm.testimonialsSubtitle')}
      />
      <ResourceManager<Testimonial>
        titleKey="adm.testimonialList"
        endpoint="/cms/testimonials"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ rating: 5, featured: true, order: 0 }}
      />
    </>
  );
}
