import type { Metadata } from 'next';
import { Award, Globe2, Rocket, Target, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { getSettings } from '@/lib/content';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'TestCraft Indonesia — akademi software testing yang didirikan praktisi QA senior dari perusahaan teknologi terbesar Indonesia.',
};

export const revalidate = 300;

interface InstructorRow {
  id: string;
  headline: string;
  bio: string;
  expYears: number;
  rating: number;
  totalStudents: number;
  user: { name: string; avatarUrl: string | null };
}

const FACTS = [
  { icon: Users, value: '28.400+', label: 'Alumni & peserta aktif' },
  { icon: Award, value: '4,8/5', label: 'Rata-rata rating alumni' },
  { icon: Rocket, value: '50+', label: 'Klien korporat' },
  { icon: Globe2, value: '3 negara', label: 'Indonesia, Singapura, Malaysia' },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const instructors = await api
    .get<InstructorRow[]>('/instructors', { revalidate: 300 })
    .catch(() => [] as InstructorRow[]);

  return (
    <>
      <section className="bg-brand-gradient py-16 text-white">
        <div className="container max-w-3xl text-center">
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Mencetak QA engineer kelas dunia dari Indonesia
          </h1>
          <p className="mt-4 text-white/85">
            {settings.brandName} didirikan praktisi QA senior dari perusahaan teknologi
            terbesar Indonesia. Kami percaya kualitas software dimulai dari kualitas
            manusianya.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FACTS.map((f) => (
            <Card key={f.label} className="p-5 text-center">
              <f.icon className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 font-display text-2xl font-extrabold text-navy dark:text-white">
                {f.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{f.label}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardBody className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display font-bold text-navy dark:text-white">Visi</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Menjadi pusat keunggulan software quality engineering di Asia Tenggara.
                </p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success-light text-emerald-700">
                <Rocket className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display font-bold text-navy dark:text-white">Misi</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Menyediakan pendidikan QA berkualitas industri yang terjangkau, praktis,
                  dan berdampak nyata pada karier.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {instructors.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="container">
            <h2 className="mb-7 text-center font-display text-2xl font-extrabold text-navy dark:text-white">
              Instruktur Kami
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {instructors.map((i) => (
                <Card key={i.id} className="text-center">
                  <CardBody>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-bold text-white">
                      {i.user.name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <p className="mt-3 font-display font-bold text-navy dark:text-white">
                      {i.user.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{i.headline}</p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {i.bio}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-primary">
                      {i.expYears} tahun pengalaman · ⭐ {i.rating.toFixed(1)}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-12 text-center">
        <h2 className="font-display text-2xl font-extrabold text-navy dark:text-white">
          Ingin tahu lebih jauh?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Tim kami siap membantu memilih program yang paling sesuai dengan tujuan karier
          Anda.
        </p>
        <ButtonLink href="/contact" size="lg" className="mt-6">
          Hubungi Kami
        </ButtonLink>
      </section>
    </>
  );
}
