import type { Metadata } from 'next';
import { Mail, MapPin } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/icons';
import { Card, CardBody } from '@/components/ui/card';
import { LeadForm } from '@/components/lead-form';
import { getSettings } from '@/lib/content';
import { waLink } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description:
    'Konsultasi gratis program pelatihan QA — untuk individu maupun penawaran corporate training.',
};

export const revalidate = 300;

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold text-navy sm:text-4xl dark:text-white">
          Mulai Perjalanan QA Anda
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Isi formulir di bawah, tim kami menghubungi Anda lewat WhatsApp dalam 1×24 jam
          kerja.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <a
                href={waLink(settings.whatsapp, 'Halo TestCraft, saya ingin bertanya.')}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 text-sm hover:text-primary"
              >
                <WhatsAppIcon className="h-6 w-6 shrink-0" />
                <span>
                  <span className="block font-semibold text-navy dark:text-white">
                    WhatsApp
                  </span>
                  <span className="text-slate-500">+{settings.whatsapp}</span>
                </span>
              </a>

              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-3 text-sm hover:text-primary"
              >
                <Mail className="h-6 w-6 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block font-semibold text-navy dark:text-white">Email</span>
                  <span className="block truncate text-slate-500">
                    {settings.contactEmail}
                  </span>
                </span>
              </a>

              {settings.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-6 w-6 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold text-navy dark:text-white">
                      Kantor
                    </span>
                    <span className="text-slate-500">{settings.address}</span>
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="font-display font-bold text-navy dark:text-white">
                Alur pendaftaran
              </h2>
              <ol className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {[
                  'Isi formulir — data langsung masuk ke tim Admission.',
                  'Tim menghubungi via WhatsApp untuk konsultasi & jadwal batch.',
                  'Setelah pembayaran dikonfirmasi, akun LMS aktif dan Anda bisa belajar.',
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <LeadForm whatsapp={settings.whatsapp} />
      </div>
    </section>
  );
}
