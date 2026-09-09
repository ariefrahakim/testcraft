import type { Metadata } from 'next';
import { BarChart3, Building2, FileSpreadsheet, GraduationCap, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { WhatsAppIcon } from '@/components/brand/icons';
import { getSettings } from '@/lib/content';
import { waLink } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Corporate Training',
  description:
    'Program upskilling QA untuk tim perusahaan: kurikulum custom, dashboard progres, dan penagihan lewat invoice.',
};

const BENEFITS = [
  {
    icon: Users,
    title: 'Kuota kursi fleksibel',
    body: 'Beli sejumlah kursi, tugaskan ke karyawan kapan pun, dan pindahkan bila ada rotasi tim.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard progres tim',
    body: 'Pantau penyelesaian materi, nilai kuis, dan sertifikat setiap karyawan dalam satu layar.',
  },
  {
    icon: GraduationCap,
    title: 'Kurikulum custom',
    body: 'Kami rancang jalur belajar sesuai stack dan tingkat kematangan QA perusahaan Anda.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Invoice & PO',
    body: 'Penagihan resmi lewat invoice, mendukung proses purchase order dan laporan berkala.',
  },
];

export default async function CorporatePage() {
  const settings = await getSettings();

  return (
    <>
      <section className="bg-brand-gradient py-16 text-white sm:py-20">
        <div className="container max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
            <Building2 className="h-4 w-4" /> Corporate Training
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Tingkatkan kualitas rilis dengan tim QA yang terlatih
          </h1>
          <p className="mt-4 text-white/85">
            Program upskilling untuk tim engineering Anda — dari manual testing sampai AI for
            QA, dengan pendampingan praktisi industri.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href={waLink(
                settings.whatsapp,
                'Halo TestCraft, saya ingin penawaran corporate training.',
              )}
              variant="whatsapp"
              size="lg"
              target="_blank"
            >
              <WhatsAppIcon className="h-5 w-5" /> Minta Penawaran
            </ButtonLink>
            <ButtonLink href="/catalog" variant="outline" size="lg" className="bg-white/10 text-white">
              Lihat Katalog Kelas
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <Card key={b.title}>
              <CardBody className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-navy dark:text-white">
                    {b.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {b.body}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <h2 className="font-display text-xl font-extrabold text-navy dark:text-white">
              Diskusikan kebutuhan tim Anda
            </h2>
            <p className="max-w-xl text-slate-500">
              Ceritakan jumlah peserta dan target kompetensinya — kami kirimkan proposal
              beserta rencana kurikulum dalam 1×24 jam kerja.
            </p>
            <ButtonLink
              href={waLink(
                settings.whatsapp,
                'Halo TestCraft, saya ingin konsultasi corporate training.',
              )}
              variant="whatsapp"
              target="_blank"
            >
              <WhatsAppIcon className="h-5 w-5" /> Konsultasi Gratis
            </ButtonLink>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
