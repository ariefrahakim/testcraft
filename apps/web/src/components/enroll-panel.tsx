'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Award, Infinity as InfinityIcon, Loader2, MessageCircle, Smartphone } from 'lucide-react';
import type { CourseDetailDto } from '@testcraft/shared';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/field';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { discountPct, formatIDR } from '@/lib/format';

const PERKS = [
  { icon: InfinityIcon, label: 'Akses selamanya + pembaruan materi' },
  { icon: Award, label: 'Sertifikat dengan QR verifikasi' },
  { icon: MessageCircle, label: 'Forum diskusi & tanya instruktur' },
  { icon: Smartphone, label: 'Bisa diakses dari HP dan desktop' },
];

export function EnrollPanel({ course }: { course: CourseDetailDto }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const off = discountPct(course.priceIDR, course.compareAtIDR);

  async function handleEnroll() {
    if (!user) {
      router.push(`/login?next=/courses/${course.slug}`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (course.isFree || course.priceIDR === 0) {
        await api.post('/enrollments', { courseId: course.id }, { auth: true });
        router.push('/dashboard');
        return;
      }
      const payment = await api.post<{ invoiceNo: string }>(
        '/payments/checkout',
        { courseIds: [course.id] },
        { auth: true },
      );
      router.push(`/checkout/${payment.invoiceNo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-navy shadow-lift dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div className="grid h-32 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-success/10 text-5xl">
          <span aria-hidden>{course.icon ?? '🎓'}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          {course.isFree || course.priceIDR === 0 ? (
            <span className="font-display text-3xl font-extrabold text-success">Gratis</span>
          ) : (
            <>
              <span className="font-display text-3xl font-extrabold">
                {formatIDR(course.priceIDR)}
              </span>
              {off > 0 && (
                <>
                  <span className="text-slate-400 line-through">
                    {formatIDR(course.compareAtIDR!)}
                  </span>
                  <span className="rounded-md bg-danger-light px-1.5 py-0.5 text-xs font-bold text-red-700">
                    -{off}%
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <Button data-testid="enroll-button" size="lg" block className="mt-4" onClick={handleEnroll} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {course.isFree || course.priceIDR === 0 ? 'Mulai Belajar Gratis' : 'Beli Kelas Ini'}
        </Button>

        <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
          {PERKS.map((p) => (
            <li key={p.label} className="flex items-center gap-2.5">
              <p.icon className="h-4 w-4 shrink-0 text-primary" />
              {p.label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
