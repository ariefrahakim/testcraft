'use client';

import { Image as ImageIcon } from 'lucide-react';
import type { MediaAssetDto } from '@testcraft/shared';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

export default function AdminMediaPage() {
  const t = useT();
  const { data, loading } = useApi<MediaAssetDto[]>('/cms/media');
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={t('adm.mediaTitle')}
        description={t('adm.mediaSubtitle')}
      />

      <Card>
        <CardHeader
          title={t('adm.mediaLibrary')}
          description={t('adm.filesCount', { count: rows.length })}
        />
        {loading ? (
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" />}
            title={t('adm.noMedia')}
            description={t('adm.noMediaHint')}
          />
        ) : (
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((m) => (
              <figure
                key={m.id}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.filename}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="p-2">
                  <span className="block truncate text-xs font-semibold text-navy dark:text-white">
                    {m.filename}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {formatDate(m.createdAt)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </CardBody>
        )}
      </Card>
    </>
  );
}
