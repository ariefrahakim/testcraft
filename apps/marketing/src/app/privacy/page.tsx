import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — TestCraft Indonesia',
  description:
    'Kebijakan Privasi TestCraft Indonesia: data apa yang kami kumpulkan dari formulir pendaftaran, bagaimana penggunaannya, dan hak Anda atas data tersebut.',
}

export default function PrivacyPage() {
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
            Kebijakan Privasi
          </h1>
          <p style={{ color: '#CBD5E1', marginTop: 8, fontSize: 15 }}>
            Berlaku sejak 1 Januari 2026 · TestCraft Indonesia
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '44px 24px 72px' }}>
        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '0 0 10px',
            }}
          >
            1. Data yang kami kumpulkan
          </h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Saat Anda mengisi formulir pendaftaran di situs ini, kami mengumpulkan data yang Anda
            isikan sendiri:
          </p>
          <ul style={{ margin: '10px 0 0 20px' }}>
            {[
              'Nama lengkap',
              'Alamat email',
              'Nomor WhatsApp',
              'Jenis pendaftaran dan program yang diminati',
              'Catatan tambahan (opsional)',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', fontSize: 15, marginBottom: 6 }}>
                {item}
              </li>
            ))}
          </ul>
          <p style={{ color: '#475569', fontSize: 15, marginTop: 10 }}>
            Kami tidak memasang iklan pihak ketiga dan tidak melakukan pelacakan lintas situs di
            halaman ini.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            2. Bagaimana data digunakan
          </h2>
          <ul style={{ margin: '10px 0 0 20px' }}>
            {[
              'Menghubungi Anda untuk konsultasi program, jadwal batch, dan proses pendaftaran.',
              'Menerbitkan tagihan serta mengaktifkan akun LMS bila Anda melanjutkan ke pendaftaran berbayar.',
              'Mengirim informasi program yang relevan — Anda dapat berhenti berlangganan kapan saja.',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', fontSize: 15, marginBottom: 6 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            3. Penyimpanan &amp; pembagian data
          </h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Data pendaftaran disimpan pada sistem penerima formulir dan alat komunikasi yang kami
            gunakan (mis. WhatsApp Business dan penyedia email). Kami tidak menjual data Anda. Data
            hanya dibagikan kepada pihak ketiga sebatas yang diperlukan untuk memproses pendaftaran
            dan pembayaran, atau jika diwajibkan oleh hukum yang berlaku.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            4. Retensi
          </h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Data calon peserta yang tidak melanjutkan pendaftaran disimpan maksimal 24 bulan, lalu
            dihapus. Data peserta aktif dan alumni disimpan selama diperlukan untuk keperluan
            sertifikat dan verifikasi.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            5. Hak Anda
          </h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Anda berhak meminta akses, koreksi, atau penghapusan data pribadi Anda, serta menarik
            persetujuan yang telah diberikan. Ajukan permintaan melalui kontak di bawah dan kami
            memprosesnya dalam 14 hari kerja.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            6. Cookies &amp; penyimpanan lokal
          </h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Situs ini menyimpan preferensi tema (terang/gelap) dan pilihan bahasa di{' '}
            <em>localStorage</em> peramban Anda. Data tersebut tidak dikirim ke server mana pun dan
            dapat dihapus lewat pengaturan peramban.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              margin: '34px 0 10px',
            }}
          >
            7. Kontak
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

        <p style={{ marginTop: 26, fontSize: 13, color: '#94A3B8' }}>
          Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diumumkan di halaman
          ini beserta tanggal berlakunya.
        </p>
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
        <Link href="/terms" style={{ color: '#0E9C9C' }}>
          Syarat &amp; Ketentuan
        </Link>{' '}
        ·{' '}
        <Link href="/" style={{ color: '#0E9C9C' }}>
          Beranda
        </Link>
      </footer>
    </>
  )
}
