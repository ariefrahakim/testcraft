import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — TestCraft Indonesia',
  description:
    'Syarat & Ketentuan layanan pelatihan TestCraft Indonesia: pendaftaran, pembayaran, pembatalan, akses materi, sertifikat, dan layanan persiapan karier.',
}

const sections = [
  {
    title: '1. Pendaftaran',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Pendaftaran dianggap sah setelah formulir diterima, tim Admission melakukan konfirmasi, dan
        pembayaran (penuh atau cicilan pertama) diterima. Peserta wajib memberikan data yang benar
        dan dapat dihubungi.
      </p>
    ),
  },
  {
    title: '2. Pembayaran',
    content: (
      <ul style={{ margin: '10px 0 0 20px' }}>
        {[
          'Pembayaran penuh maupun cicilan dilakukan melalui kanal resmi yang diinformasikan tim Admission.',
          'Skema cicilan 0% mengikuti syarat penyedia pembayaran yang digunakan.',
          'Harga yang tercantum di situs dapat berubah sewaktu-waktu; harga yang berlaku adalah harga pada saat konfirmasi pendaftaran.',
        ].map((item) => (
          <li key={item} style={{ color: '#475569', fontSize: 15, marginBottom: 6 }}>
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: '3. Pembatalan & pengembalian dana',
    content: (
      <ul style={{ margin: '10px 0 0 20px' }}>
        {[
          'Pembatalan lebih dari 7 hari sebelum kelas dimulai: pengembalian 100% dikurangi biaya administrasi.',
          'Pembatalan 1–7 hari sebelum kelas dimulai: pengembalian 50%.',
          'Setelah kelas dimulai: tidak ada pengembalian dana, namun peserta dapat menunda ke batch berikutnya satu kali.',
        ].map((item) => (
          <li key={item} style={{ color: '#475569', fontSize: 15, marginBottom: 6 }}>
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: '4. Akses materi & akun LMS',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Akun LMS bersifat pribadi dan tidak dapat dipindahtangankan atau dibagikan. Materi,
        rekaman, dan kode latihan hanya untuk penggunaan pribadi peserta. Penyebarluasan atau
        penjualan ulang materi mengakibatkan penonaktifan akun tanpa pengembalian dana.
      </p>
    ),
  },
  {
    title: '5. Kehadiran & mengulang batch',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Fasilitas mengulang batch bootcamp diberikan kepada peserta dengan kehadiran minimal 80%
        pada batch sebelumnya, tergantung ketersediaan kursi.
      </p>
    ),
  },
  {
    title: '6. Sertifikat',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Sertifikat penyelesaian diterbitkan bagi peserta yang menyelesaikan seluruh modul wajib dan
        proyek akhir. Sertifikat dilengkapi kode verifikasi QR dan dapat diperiksa keasliannya
        melalui LMS Portal.
      </p>
    ),
  },
  {
    title: '7. Layanan persiapan karier',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Layanan persiapan karier mencakup konsultasi 1-on-1, review CV &amp; LinkedIn, pembangunan
        portofolio, dan latihan interview.{' '}
        <strong>Layanan ini tidak mencakup jaminan atau penyaluran kerja.</strong> Syarat
        mengikutinya: lulus bootcamp dengan kehadiran minimal 90% dan menyelesaikan capstone
        project.
      </p>
    ),
  },
  {
    title: '8. Perubahan jadwal',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        TestCraft Indonesia berhak menyesuaikan jadwal, instruktur, atau format kelas bila
        diperlukan, dengan pemberitahuan sedini mungkin kepada peserta.
      </p>
    ),
  },
  {
    title: '9. Kode etik',
    content: (
      <p style={{ color: '#475569', fontSize: 15 }}>
        Peserta diharapkan menjaga kesopanan di kelas, forum, dan kanal komunikasi. Pelecehan,
        plagiarisme tugas, atau gangguan terhadap proses belajar dapat berujung pada pengeluaran
        dari program tanpa pengembalian dana.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <>
      <header
        style={{
          background: 'linear-gradient(135deg, #0F2438 0%, #16506B 55%, #0E9C9C 100%)',
          color: '#fff',
          padding: '44px 24px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link
            href="/"
            style={{ color: '#5EEAD4', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            ← Kembali ke beranda
          </Link>
          <h1
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Syarat &amp; Ketentuan
          </h1>
          <p style={{ color: '#CBD5E1', marginTop: 8, fontSize: 15 }}>
            Berlaku sejak 1 Januari 2026 · TestCraft Indonesia
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '44px 24px 72px' }}>
        {sections.map((s, i) => (
          <section key={i}>
            <h2
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 20,
                margin: i === 0 ? '0 0 10px' : '34px 0 10px',
              }}
            >
              {s.title}
            </h2>
            {s.content}
          </section>
        ))}

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            10. Kontak
          </h2>
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 22,
              marginTop: 22,
            }}
          >
            <p style={{ color: '#475569', fontSize: 15 }}>
              <strong style={{ color: '#12283E' }}>TestCraft Indonesia</strong>
              <br />
              Email:{' '}
              <a href="mailto:testcraftindonesia@gmail.com" style={{ color: '#0E9C9C' }}>
                testcraftindonesia@gmail.com
              </a>
              <br />
              WhatsApp:{' '}
              <a
                href="https://wa.me/6282395568743"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0E9C9C' }}
              >
                +62 823-9556-8743
              </a>
              <br />
              Jakarta, Indonesia
            </p>
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: '1px solid #E2E8F0',
          padding: 24,
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: 13,
        }}
      >
        © 2026 TestCraft Indonesia ·{' '}
        <Link href="/privacy" style={{ color: '#0E9C9C' }}>
          Kebijakan Privasi
        </Link>{' '}
        ·{' '}
        <Link href="/" style={{ color: '#0E9C9C' }}>
          Beranda
        </Link>
      </footer>
    </>
  )
}
