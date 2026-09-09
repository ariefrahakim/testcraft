'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Apakah saya bisa belajar dari nol tanpa background IT?',
    a: 'Bisa! Learning path kami dirancang dari level pemula. Mulai dari ISTQB Foundation dan Manual Testing, lalu bertahap ke automation. Ribuan alumni kami berasal dari jurusan non-IT.',
  },
  {
    q: 'Apakah sertifikat TestCraft diakui perusahaan?',
    a: 'Sertifikat kami dilengkapi QR verification sehingga keasliannya dapat diverifikasi langsung oleh perusahaan mana pun.',
  },
  {
    q: 'Bagaimana cara mengakses materi setelah mendaftar?',
    a: 'Setelah pembayaran dikonfirmasi, akun LMS Anda langsung aktif. Semua video, quiz, tugas, forum, dan sertifikat diakses melalui LMS Portal — lifetime access.',
  },
  {
    q: 'Apakah ada program cicilan atau diskon?',
    a: 'Ya, kami mendukung cicilan 0% via Midtrans/Xendit, serta diskon khusus mahasiswa dan bundle learning path.',
  },
  {
    q: 'Bagaimana dengan pelatihan untuk perusahaan?',
    a: 'Paket Corporate mencakup dashboard admin, laporan progress karyawan, kurikulum custom, dan sesi live private. Hubungi kami via WhatsApp untuk penawaran.',
  },
  {
    q: 'Apakah ada career support?',
    a: 'Kami menyediakan review CV & LinkedIn, konsultasi karier 1-on-1, dan latihan interview untuk alumni.',
  },
  {
    q: 'Adakah persyaratan untuk mengikuti layanan persiapan karier?',
    a: 'Ya — lulus bootcamp dengan kehadiran minimal 90%, menyelesaikan capstone project, dan mengikuti sesi persiapan karier. Detail lengkap disampaikan saat onboarding.',
  },
  {
    q: 'Apakah perlu laptop dengan spesifikasi khusus?',
    a: 'Tidak perlu high-end: minimal RAM 8GB dan OS Windows/macOS/Linux 64-bit sudah cukup untuk semua tools yang diajarkan (Playwright, Selenium, Postman, JMeter).',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section
      id="faq"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}
    >
      <h2 className="section-title">Frequently Asked Questions</h2>

      <div style={{ maxWidth: 760, margin: '32px auto 0' }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              style={{
                width: '100%',
                padding: '18px 22px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: 15,
                textAlign: 'left',
              }}
            >
              <span>{faq.q}</span>
              <span
                style={{
                  fontSize: 22,
                  color: 'var(--blue)',
                  transform: openIndex === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform .2s',
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                +
              </span>
            </button>

            {openIndex === i && (
              <div
                style={{
                  padding: '0 22px 18px',
                  color: 'var(--text-2)',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
