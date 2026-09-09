'use client'

import { Hero } from '@/components/marketing/hero'
import { StatsBar } from '@/components/marketing/stats-bar'
import { ProgramsGrid } from '@/components/marketing/programs-grid'
import { Testimonials } from '@/components/marketing/testimonials'
import { FAQ } from '@/components/marketing/faq'
import { LeadForm } from '@/components/marketing/lead-form'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { Navbar } from '@/components/marketing/navbar'

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Lompat ke konten utama
      </a>
      <Navbar />

      <main id="main">
        {/* Hero + Stats */}
        <Hero />
        <StatsBar />

        {/* Services */}
        <section
          id="layanan"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 0' }}
        >
          <h2 className="section-title">Layanan Kami</h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-2)',
              maxWidth: 600,
              margin: '12px auto 0',
              fontSize: 15,
            }}
          >
            Empat pilar layanan untuk meningkatkan kualitas software engineer dan organisasi Anda.
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 32 }}
            className="services-grid"
          >
            {[
              {
                icon: '🎓',
                title: 'Public Training',
                desc: 'Kelas terjadwal untuk individu — dari Manual Testing & ISTQB hingga Playwright, API, dan Performance Testing. Akses lifetime via LMS.',
              },
              {
                icon: '🏢',
                title: 'Corporate Training',
                desc: 'Program upskilling khusus perusahaan: kurikulum custom, dashboard progress karyawan, laporan berkala, dan sesi live private.',
              },
              {
                icon: '📜',
                title: 'Sertifikasi',
                desc: 'Persiapan ujian ISTQB Foundation dengan 600+ soal latihan, serta sertifikat penyelesaian ber-QR yang mudah diverifikasi perusahaan.',
              },
              {
                icon: '🧪',
                title: 'QA Consulting',
                desc: 'Pendampingan test strategy, pembangunan automation framework, CI/CD untuk QA, dan audit kualitas proses testing tim Anda.',
              },
            ].map((s) => (
              <div
                key={s.title}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 24,
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
                }}
              >
                <div style={{ fontSize: 34 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, marginTop: 16 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Programs */}
        <ProgramsGrid />

        {/* Bootcamp */}
        <section
          id="bootcamp"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 0' }}
        >
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                background: '#D1FAE5',
                color: '#059669',
                marginRight: 8,
              }}
            >
              Program Unggulan · Persiapan Karier hingga Interview
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--blue-light)',
                color: 'var(--blue)',
              }}
            >
              Supported with AI
            </span>
          </div>

          <h2
            className="section-title"
            style={{ marginTop: 16, fontFamily: 'Poppins, sans-serif' }}
          >
            QA Bootcamp
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-2)',
              maxWidth: 600,
              margin: '12px auto 0',
              fontSize: 15,
            }}
          >
            Program intensif dari nol sampai siap kerja: Manual Testing, API & Database Testing,
            Web & Mobile Automation, Performance Testing, hingga persiapan karier lengkap sampai
            latihan interview kerja.
          </p>

          {/* Audience */}
          <h3 style={{ textAlign: 'center', fontSize: 22, fontFamily: 'Poppins, sans-serif', marginTop: 48 }}>
            Dirancang untuk semua tahap kariermu
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 24 }}
            className="bootcamp-audience-grid"
          >
            {[
              { icon: '🎓', title: 'Mahasiswa', desc: 'Persiapkan karier sejak dini dengan skill yang relevan di industri.' },
              { icon: '🧑‍🎓', title: 'Fresh Graduate', desc: 'Raih karier impian dengan bimbingan intensif dan persiapan karier menyeluruh.' },
              { icon: '🔄', title: 'Career Switcher', desc: 'Mulai karier QA tanpa perlu pengalaman IT sebelumnya.' },
              { icon: '💼', title: 'Pekerja Profesional', desc: 'Upgrade karier lewat kurikulum yang disesuaikan kebutuhan industri.' },
            ].map((a) => (
              <div
                key={a.title}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 24,
                  textAlign: 'center',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
                }}
              >
                <div style={{ fontSize: 32 }}>{a.icon}</div>
                <b style={{ fontSize: 13, display: 'block', marginTop: 8 }}>{a.title}</b>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Salary grid */}
          <h3 style={{ textAlign: 'center', fontSize: 22, fontFamily: 'Poppins, sans-serif', marginTop: 48 }}>
            Prospek Karier & Gaji Profesi QA di Indonesia
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 24 }}
            className="salary-grid"
          >
            {[
              { role: 'QA Manual Tester', salary: 'Rp 4–7 jt' },
              { role: 'QA Engineer', salary: 'Rp 7–12 jt' },
              { role: 'QA Automation', salary: 'Rp 9–16 jt' },
              { role: 'SDET', salary: 'Rp 12–20 jt' },
              { role: 'QA Lead', salary: 'Rp 15–25 jt' },
            ].map((s) => (
              <div
                key={s.role}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 18,
                  textAlign: 'center',
                }}
              >
                <b style={{ fontSize: 13 }}>{s.role}</b>
                <div className="stat-num-sm" style={{ marginTop: 8 }}>{s.salary}</div>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>per bulan</span>
              </div>
            ))}
          </div>

          {/* USPs */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 32 }}
            className="usp-grid"
          >
            {[
              { icon: '🔁', label: 'Gratis Mengulang Batch' },
              { icon: '🤝', label: 'Persiapan Karier & Interview' },
              { icon: '♾️', label: 'Akses Materi Seumur Hidup' },
              { icon: '👨‍🏫', label: 'Mentor Praktisi Unicorn' },
              { icon: '🌐', label: 'Komunitas 28.000+ Alumni' },
            ].map((u) => (
              <div
                key={u.label}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 18,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 26 }}>{u.icon}</div>
                <b style={{ fontSize: 12, display: 'block', marginTop: 8 }}>{u.label}</b>
              </div>
            ))}
          </div>

          {/* Learning journey */}
          <h3 style={{ textAlign: 'center', fontSize: 22, fontFamily: 'Poppins, sans-serif', marginTop: 48 }}>
            Perjalanan belajar: dari pemula hingga bekerja
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 24 }}
            className="bootcamp-audience-grid"
          >
            {[
              { step: 1, title: 'Pre-Bootcamp', badge: 'Pendaftaran', desc: 'Belajar mandiri lewat modul persiapan di LMS sebelum kelas dimulai.' },
              { step: 2, title: 'Bootcamp', badge: 'Program inti', desc: 'Live class, proyek & tugas menantang untuk membangun portofolio berkualitas.' },
              { step: 3, title: 'Post-Bootcamp', badge: '2 Minggu', desc: 'Finalisasi portofolio dan pembekalan strategi melamar kerja.' },
              { step: 4, title: 'Career Prep', badge: '4 Minggu', desc: 'Pendampingan intensif sampai kamu siap menghadapi interview kerja.' },
            ].map((f) => (
              <div
                key={f.step}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 24,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--blue-light)',
                    color: 'var(--blue)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {f.step}
                </span>
                <b style={{ fontSize: 13, display: 'block', marginTop: 8 }}>{f.title}</b>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'var(--blue-light)',
                    color: 'var(--blue)',
                    marginTop: 4,
                  }}
                >
                  {f.badge}
                </span>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <h3 id="biaya" style={{ textAlign: 'center', fontSize: 22, fontFamily: 'Poppins, sans-serif', marginTop: 48 }}>
            Biaya Pendidikan
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-2)', maxWidth: 600, margin: '12px auto 0', fontSize: 15 }}>
            Terjangkau untukmu, berharga untuk masa depanmu. Semua paket termasuk akses LMS seumur
            hidup, sertifikat QR-verified, dan layanan persiapan karier.
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}
            className="pricing-grid"
          >
            {[
              {
                badge: 'Hemat 30%',
                badgeStyle: { background: '#D1FAE5', color: '#059669' },
                title: 'Full Payment',
                price: 'Rp 8.500.000',
                original: 'Rp 12.000.000',
                desc: 'Sekali bayar — semua fasilitas bootcamp + gratis mengulang batch.',
                cta: 'Daftar Sekarang',
                ctaHref: '#kontak',
                outline: false,
              },
              {
                badge: 'Paling Populer',
                badgeStyle: { background: 'var(--blue-light)', color: 'var(--blue)' },
                title: 'Cicilan 0%',
                price: 'Rp 750.000',
                perMonth: '/bulan × 12 bulan',
                desc: 'Cicilan tanpa bunga via Midtrans / Xendit — mulai belajar hari ini.',
                cta: 'Ajukan Cicilan',
                ctaHref: '#kontak',
                highlight: true,
                outline: false,
              },
              {
                badge: 'Untuk Tim',
                badgeStyle: { background: '#FEF3C7', color: '#B45309' },
                title: 'Corporate / Group',
                price: 'Custom',
                perMonth: 'min. 5 peserta',
                desc: 'Kurikulum custom, dashboard progress tim, invoice perusahaan.',
                cta: 'Minta Penawaran',
                ctaHref: 'https://wa.me/6282395568743?text=Halo%20TestCraft,%20saya%20ingin%20penawaran%20corporate%20bootcamp%20QA',
                outline: true,
              },
            ].map((plan) => (
              <div
                key={plan.title}
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${plan.highlight ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: 24,
                  textAlign: 'center',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    ...plan.badgeStyle,
                  }}
                >
                  {plan.badge}
                </span>
                <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', marginTop: 8 }}>
                  {plan.title}
                </h3>
                <div className="stat-num" style={{ fontSize: '1.875rem' }}>{plan.price}</div>
                {plan.original && (
                  <s style={{ color: 'var(--text-3)', fontSize: 13 }}>{plan.original}</s>
                )}
                {plan.perMonth && (
                  <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{plan.perMonth}</span>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>{plan.desc}</p>
                <a
                  href={plan.ctaHref}
                  target={plan.outline ? '_blank' : undefined}
                  rel={plan.outline ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: plan.outline ? 'transparent' : 'var(--blue)',
                    color: plan.outline ? 'var(--text)' : '#fff',
                    border: plan.outline ? '1.5px solid var(--border)' : 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: 'none',
                    marginTop: 16,
                    cursor: 'pointer',
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 16 }}>
            *Layanan persiapan karier mencakup konsultasi 1-on-1, review CV & LinkedIn, hingga
            latihan interview — tidak termasuk penyaluran/penempatan kerja.
          </p>

          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              padding: 32,
              textAlign: 'center',
              marginTop: 32,
            }}
          >
            <h3 style={{ fontSize: 20, fontFamily: 'Poppins, sans-serif' }}>Masih ada pertanyaan?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8 }}>
              Konsultasikan program belajar Anda secara gratis dengan tim Admission kami.
            </p>
            <a
              href="https://wa.me/6282395568743?text=Halo%20TestCraft%20Indonesia,%20saya%20ingin%20konsultasi%20Bootcamp%20Quality%20Assurance!"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                marginTop: 16,
              }}
            >
              Konsultasi gratis via WhatsApp
            </a>
          </div>
        </section>

        {/* About */}
        <section
          id="tentang"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 0' }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}
            className="about-grid"
          >
            <div>
              <h2 style={{ fontSize: 30, fontFamily: 'Poppins, sans-serif' }}>
                Tentang TestCraft Indonesia
              </h2>
              <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 15 }}>
                TestCraft Indonesia didirikan oleh praktisi QA senior dari perusahaan teknologi
                terbesar Indonesia dengan satu misi: mencetak QA engineer kelas dunia dari Indonesia.
              </p>
              <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 15 }}>
                Kami percaya kualitas software dimulai dari kualitas manusianya. Karena itu setiap
                program kami menggabungkan teori yang kuat, praktik pada proyek nyata, dan mentoring
                langsung dari praktisi industri.
              </p>
              <div style={{ marginTop: 24 }}>
                {[
                  { icon: '🎯', title: 'Visi', desc: 'Menjadi pusat keunggulan software quality engineering di Asia Tenggara.' },
                  { icon: '🚀', title: 'Misi', desc: 'Menyediakan pendidikan QA berkualitas industri yang terjangkau, praktis, dan berdampak pada karier.' },
                ].map((item) => (
                  <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <b style={{ fontSize: 14 }}>{item.title}</b>
                      <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {[
                { icon: '👨‍🏫', title: '24 Instruktur', desc: 'Praktisi dari Gojek, Tokopedia, Traveloka' },
                { icon: '🏆', title: '4.8/5 Rating', desc: 'Dari 12,000+ ulasan alumni' },
                { icon: '🤝', title: 'Career Support', desc: 'Persiapan karier & interview' },
                { icon: '🌏', title: '3 Negara', desc: 'Klien di ID, SG, dan MY' },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    padding: 24,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 30 }}>{card.icon}</div>
                  <b style={{ fontSize: 13, display: 'block', marginTop: 8 }}>{card.title}</b>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ */}
        <FAQ />

        {/* Lead Form / Contact */}
        <LeadForm />
      </main>

      <MarketingFooter />

      <style>{`
        @media (max-width: 1024px) {
          .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bootcamp-audience-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .about-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .services-grid { grid-template-columns: 1fr !important; }
          .bootcamp-audience-grid { grid-template-columns: 1fr !important; }
          .salary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .usp-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .about-grid { grid-template-columns: 1fr !important; }
        }
        section[id] { scroll-margin-top: 84px; }
      `}</style>
    </>
  )
}
