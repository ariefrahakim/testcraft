'use client';

import { Badge } from '@/components/ui/badge';
import { ResourceManager, type ColumnSpec, type FieldSpec } from '@/components/admin/resource-manager';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useT } from '@/lib/i18n';

interface Category extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order: number;
  featured: boolean;
  courseCount: number;
}

const COLUMNS: ColumnSpec<Category>[] = [
  {
    key: 'name',
    labelKey: 'menu.categories',
    render: (c) => (
      <span className="flex items-center gap-2 font-semibold text-navy dark:text-white">
        <span aria-hidden>{c.icon ?? '📁'}</span>
        {c.name}
      </span>
    ),
  },
  {
    key: 'slug',
    labelKey: 'adm.slug',
    render: (c) => <span className="font-mono text-xs text-slate-500">{c.slug}</span>,
  },
  { key: 'courseCount', labelKey: 'adm.publishedClasses', align: 'right', render: (c) => c.courseCount },
  {
    key: 'featured',
    labelKey: 'adm.featured',
    render: (c) => <YesNo value={c.featured} />,
  },
];

const FIELDS: FieldSpec[] = [
  { name: 'name', labelKey: 'adm.categoryName', type: 'text', required: true },
  { name: 'slug', labelKey: 'adm.slug', type: 'text', required: true, hintKey: 'adm.slugHint' },
  { name: 'icon', labelKey: 'adm.iconEmoji', type: 'text', placeholder: '🔗' },
  { name: 'order', labelKey: 'adm.displayOrder', type: 'number' },
  { name: 'featured', labelKey: 'adm.featuredCategory', type: 'boolean' },
];

function YesNo({ value }: { value: boolean }) {
  const t = useT();
  return <Badge tone={value ? 'green' : 'slate'}>{t(value ? 'adm.yes' : 'adm.no')}</Badge>;
}

export default function CategoriesPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('adm.categoriesTitle')}
        description={t('adm.categoriesSubtitle')}
      />
      <ResourceManager<Category>
        titleKey="adm.categoryList"
        endpoint="/categories"
        columns={COLUMNS}
        fields={FIELDS}
        defaults={{ order: 0, featured: false }}
      />
    </>
  );
}
