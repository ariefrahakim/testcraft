import type { Metadata } from 'next';
import { getSettings } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Bagaimana TestCraft Indonesia mengumpulkan dan melindungi data Anda.',
};

export const revalidate = 3600;

const SECTIONS = [
  {
    title: 'Data yang kami kumpulkan',
    body: 'Nama, email, nomor telepon, dan data progres belajar (materi yang diselesaikan, nilai kuis, tugas yang dikirim). Untuk pembelian, kami menyimpan nomor invoice dan status pembayaran — bukan nomor kartu Anda.',
  },
  {
    title: 'Cara kami memakainya',
    body: 'Menyediakan akses kelas, mencatat progres, menerbitkan sertifikat, memproses pembayaran, dan mengirim informasi terkait kelas yang Anda ikuti.',
  },
  {
    title: 'Kata sandi',
    body: 'Kata sandi disimpan dalam bentuk hash Argon2id — tidak dapat dibaca kembali, termasuk oleh tim kami. Kami tidak pernah meminta kata sandi Anda lewat email atau WhatsApp.',
  },
  {
    title: 'Pembayaran',
    body: 'Transaksi diproses penyedia berlisensi (Midtrans/Xendit). Data kartu dan kredensial perbankan diproses langsung oleh mereka dan tidak pernah menyentuh server kami.',
  },
  {
    title: 'Berbagi data',
    body: 'Kami tidak menjual data Anda. Data hanya dibagikan kepada penyedia layanan yang kami perlukan untuk beroperasi (pembayaran, penyimpanan berkas, pengiriman email) dan hanya sebatas yang dibutuhkan.',
  },
  {
    title: 'Data peserta korporat',
    body: 'Bila Anda mengikuti kelas lewat paket perusahaan, administrator perusahaan Anda dapat melihat progres belajar dan status kelulusan Anda pada kelas yang mereka tugaskan.',
  },
  {
    title: 'Sertifikat yang terverifikasi publik',
    body: 'Halaman verifikasi hanya menampilkan nama penerima, judul kelas, nilai, dan tanggal terbit. Email dan data kontak Anda tidak pernah ditampilkan.',
  },
  {
    title: 'Hak Anda',
    body: 'Anda dapat meminta salinan, perbaikan, atau penghapusan data pribadi Anda kapan saja. Sebagian data transaksi tetap kami simpan bila diwajibkan peraturan perpajakan.',
  },
  {
    title: 'Cookie',
    body: 'Kami memakai penyimpanan lokal peramban untuk menjaga sesi login Anda. Tidak ada cookie iklan pihak ketiga.',
  },
];

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <article className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-extrabold text-navy dark:text-white">
        Kebijakan Privasi
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Bagaimana {settings.brandName} memperlakukan data Anda.
      </p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((s, i) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-bold text-navy dark:text-white">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60">
        Permintaan terkait data pribadi dapat dikirim ke{' '}
        <a
          href={`mailto:${settings.contactEmail}`}
          className="font-semibold text-primary hover:underline"
        >
          {settings.contactEmail}
        </a>
        .
      </p>
    </article>
  );
}
