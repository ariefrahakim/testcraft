'use client';

import {
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/card';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatIDR, formatNumber } from '@/lib/format';

interface Overview {
  students: number;
  instructors: number;
  publishedCourses: number;
  enrollments: number;
  certificates: number;
  revenueTotalIDR: number;
  revenue30dIDR: number;
  orders30d: number;
  pendingPayments: number;
  unhandledLeads: number;
}

interface TopCourse {
  id: string;
  title: string;
  icon: string | null;
  studentCount: number;
  rating: number;
  priceIDR: number;
}

export default function AdminOverview() {
  const t = useT();
  const { data, loading } = useApi<Overview>('/analytics/overview');
  const { data: top } = useApi<TopCourse[]>('/analytics/top-courses');

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#12283E] via-[#16506B] to-primary p-6 text-white shadow-lift">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-light/80">{t('adm.overviewSubtitle')}</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">{t('adm.overviewTitle')}</h2>
          </div>
          <ButtonLink href="/admin/pricing" size="sm" className="bg-white text-navy hover:bg-primary-light shrink-0">
            {t('adm.managePricing')}
          </ButtonLink>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('adm.revenue30d')}
            value={formatIDR(data?.revenue30dIDR ?? 0)}
            hint={t('adm.ordersCount', { count: data?.orders30d ?? 0 })}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            label={t('adm.revenueTotal')}
            value={formatIDR(data?.revenueTotalIDR ?? 0)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.students')}
            value={formatNumber(data?.students ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.instructors')}
            value={data?.instructors ?? 0}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.publishedCourses')}
            value={data?.publishedCourses ?? 0}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.enrollments')}
            value={formatNumber(data?.enrollments ?? 0)}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.certificatesIssued')}
            value={formatNumber(data?.certificates ?? 0)}
            icon={<Award className="h-5 w-5" />}
          />
          <StatCard
            label={t('adm.unhandledLeads')}
            value={data?.unhandledLeads ?? 0}
            icon={<UserCog className="h-5 w-5" />}
            tone={data?.unhandledLeads ? 'warning' : 'primary'}
          />
        </div>
      )}

      <Card className="mt-5">
        <CardHeader
          title={t('adm.topCourses')}
          description={t('adm.topCoursesHint')}
        />
        <CardBody className="overflow-x-auto">
          <table className="table-responsive">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="pb-2 pr-4 font-semibold">{t('table.class')}</th>
                <th className="pb-2 pr-4 text-right font-semibold">{t('table.participants')}</th>
                <th className="pb-2 pr-4 text-right font-semibold">{t('table.rating')}</th>
                <th className="pb-2 text-right font-semibold">{t('table.price')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(top ?? []).map((c) => (
                <tr key={c.id}>
                  <td data-label={t('table.class')} className="py-3 pr-4">
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden>{c.icon ?? '🎓'}</span>
                      <span className="font-semibold text-navy dark:text-white">
                        {c.title}
                      </span>
                    </span>
                  </td>
                  <td data-label={t('table.participants')} className="py-3 pr-4 text-right tabular-nums">
                    {formatNumber(c.studentCount)}
                  </td>
                  <td data-label={t('table.rating')} className="py-3 pr-4 text-right tabular-nums">
                    {c.rating.toFixed(1)}
                  </td>
                  <td data-label={t('table.price')} className="py-3 text-right tabular-nums">
                    {formatIDR(c.priceIDR)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </>
  );
}
