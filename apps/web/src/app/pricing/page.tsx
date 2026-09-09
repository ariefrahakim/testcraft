import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/brand/icons';
import { getFaqs, getPlans, getSettings } from '@/lib/content';
import { formatIDR, waLink } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Harga & Paket',
  description:
    'Pilihan paket belajar TestCraft: per kelas, bootcamp lengkap, atau pelatihan korporat.',
};

export const revalidate = 300;

export default async function PricingPage() {
  const [plans, settings, faqs] = await Promise.all([
    getPlans(),
    getSettings(),
    getFaqs(),
  ]);

  const pricingFaqs = faqs.filter((f) => f.group === 'pembayaran' || f.group === 'umum');

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-primary-light/40 to-transparent py-14 text-center dark:border-slate-800 dark:from-slate-900">
        <div className="container max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold text-navy sm:text-4xl dark:text-white">
            Harga &amp; Paket
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Terjangkau untuk Anda, berharga untuk karier Anda. Semua paket termasuk akses
            selamanya dan sertifikat ber-QR.
          </p>
        </div>
      </section>

      <section className="container py-12">
        {plans.length === 0 ? (
          <p className="text-center text-slate-500">
            Paket harga belum dipublikasikan. Admin dapat mengaturnya di CMS → Paket Harga.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  p.highlighted
                    ? 'border-primary bg-primary text-white shadow-lift lg:-mt-4 lg:mb-4'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {p.highlighted && (
                  <span className="mb-3 self-start rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                    Paling Populer
                  </span>
                )}

                <h2
                  className={`font-display text-xl font-bold ${
                    p.highlighted ? '' : 'text-navy dark:text-white'
                  }`}
                >
                  {p.name}
                </h2>
                {p.description && (
                  <p
                    className={`mt-1 text-sm ${p.highlighted ? 'text-white/80' : 'text-slate-500'}`}
                  >
                    {p.description}
                  </p>
                )}

                <p className="mt-5 font-display text-3xl font-extrabold">
                  {p.priceIDR === 0 ? 'Hubungi Kami' : formatIDR(p.priceIDR)}
                </p>
                {p.compareAtIDR && p.compareAtIDR > p.priceIDR && (
                  <p
                    className={`text-sm line-through ${
                      p.highlighted ? 'text-white/60' : 'text-slate-400'
                    }`}
                  >
                    {formatIDR(p.compareAtIDR)}
                  </p>
                )}
                {p.interval !== 'ONE_TIME' && (
                  <p className={`text-sm ${p.highlighted ? 'text-white/70' : 'text-slate-500'}`}>
                    per {p.interval === 'MONTHLY' ? 'bulan' : 'tahun'}
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check
                        className={`h-4 w-4 shrink-0 ${p.highlighted ? '' : 'text-success'}`}
                      />
                      <span
                        className={p.highlighted ? '' : 'text-slate-600 dark:text-slate-300'}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={
                    p.priceIDR === 0
                      ? waLink(
                          settings.whatsapp,
                          `Halo TestCraft, saya ingin penawaran paket ${p.name}.`,
                        )
                      : '/catalog'
                  }
                  variant={p.highlighted ? 'secondary' : 'primary'}
                  block
                  className="mt-6"
                >
                  {p.priceIDR === 0 ? 'Minta Penawaran' : 'Mulai Belajar'}
                </ButtonLink>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Harga sudah termasuk PPN {settings.taxPercent}%. Tersedia cicilan 0% via
          Midtrans/Xendit.
        </p>
      </section>

      {pricingFaqs.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="container max-w-3xl">
            <h2 className="mb-6 text-center font-display text-2xl font-extrabold text-navy dark:text-white">
              Pertanyaan Seputar Pembayaran
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {pricingFaqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy dark:text-white">
                    {f.question}
                    <span className="shrink-0 text-primary transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-12 text-center">
        <ButtonLink
          href={waLink(settings.whatsapp, 'Halo TestCraft, saya ingin konsultasi paket belajar.')}
          variant="whatsapp"
          size="lg"
          target="_blank"
        >
          <WhatsAppIcon className="h-5 w-5" /> Konsultasi Gratis
        </ButtonLink>
      </section>
    </>
  );
}
