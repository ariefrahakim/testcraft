import type { Metadata } from 'next';
import { getSettings } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Ketentuan penggunaan layanan pembelajaran TestCraft Indonesia.',
};

export const revalidate = 3600;

const SECTIONS = [
  {
    title: 'Penerimaan ketentuan',
    body: 'Dengan membuat akun atau membeli kelas, Anda menyetujui ketentuan ini. Bila tidak setuju, mohon tidak menggunakan layanan kami.',
  },
  {
    title: 'Akun',
    body: 'Anda bertanggung jawab menjaga kerahasiaan kredensial akun. Satu akun diperuntukkan bagi satu orang; berbagi akun dapat menyebabkan penonaktifan tanpa pengembalian dana.',
  },
  {
    title: 'Akses materi',
    body: 'Pembelian per kelas memberi akses selama akun aktif, termasuk pembaruan materi. Kami dapat memperbarui atau mengganti materi untuk menjaga relevansinya dengan industri.',
  },
  {
    title: 'Hak kekayaan intelektual',
    body: 'Seluruh video, dokumen, kode, dan soal latihan adalah milik TestCraft Indonesia. Anda boleh memakainya untuk keperluan belajar pribadi, tetapi tidak boleh menyebarluaskan, menjual ulang, atau menayangkannya kembali.',
  },
  {
    title: 'Pembayaran & pengembalian dana',
    body: 'Pembayaran diproses melalui penyedia resmi (Midtrans/Xendit). Permintaan pengembalian dana dapat diajukan maksimal 7 hari setelah pembelian selama progres belajar belum melampaui 20% materi.',
  },
  {
    title: 'Sertifikat',
    body: 'Sertifikat diterbitkan setelah seluruh materi tuntas dan nilai kuis akhir memenuhi ambang kelulusan. Setiap sertifikat memiliki nomor unik yang dapat diverifikasi publik pada halaman /verify.',
  },
  {
    title: 'Perilaku peserta',
    body: 'Kami menjaga ruang belajar yang aman. Pelecehan, plagiarisme tugas, dan penyebaran materi berbayar dapat berujung pada penonaktifan akun.',
  },
  {
    title: 'Perubahan ketentuan',
    body: 'Ketentuan dapat diperbarui sewaktu-waktu. Perubahan material akan kami beritahukan lewat email atau notifikasi di dalam aplikasi.',
  },
];

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <article className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-extrabold text-navy dark:text-white">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Berlaku untuk seluruh layanan {settings.brandName}.
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
        Pertanyaan mengenai ketentuan ini dapat dikirim ke{' '}
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
