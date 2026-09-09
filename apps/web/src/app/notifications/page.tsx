'use client';

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi } from '@/lib/use-api';
import { useRequireAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/format';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  useRequireAuth();
  const { data, loading } = useApi<NotificationRow[]>('/notifications');
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <Card>
        <CardHeader title="Notifikasi" description="Kabar terbaru tentang kelas dan tugas Anda" />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Belum ada notifikasi"
            description="Pemberitahuan tugas dinilai, pembayaran, dan kelas baru akan tampil di sini."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? '#'}
                  className={cn(
                    'flex gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    !n.read && 'bg-primary-light/40',
                  )}
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy dark:text-white">
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="block text-sm text-slate-600 dark:text-slate-300">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-slate-400">
                      {formatDate(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
