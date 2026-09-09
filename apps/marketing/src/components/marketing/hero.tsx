'use client'

export function Hero() {
  return (
    <section
      id="home"
      style={{ background: 'var(--grad)', color: '#fff', position: 'relative', overflow: 'hidden' }}
    >
      {/* decorative radial blobs */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,.25), transparent 65%)',
          top: -200,
          right: -150,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,156,156,.4), transparent 65%)',
          bottom: -250,
          left: -100,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '90px 24px 100px',
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: 60,
          alignItems: 'center',
        }}
        className="hero-inner"
      >
        {/* Left column */}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(16,185,129,.18)',
              color: '#5EEAD4',
              border: '1px solid rgba(16,185,129,.35)',
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34D399', marginRight: 6, animation: 'pulse-dot 2s ease-in-out infinite' }} />
            🇮🇩 IT Training Company · Software Testing & QA
          </span>

          <h1
            data-testid="hero-title"
            style={{
              fontSize: 'clamp(31px, 5vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginTop: 16,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Quality Software.
            <br />
            <em
              style={{
                fontStyle: 'normal',
                background: 'linear-gradient(90deg, #5EEAD4, #34D399)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Confident Delivery.
            </em>
          </h1>

          <p style={{ fontSize: 18, color: '#CBD5E1', marginTop: 20, maxWidth: 540 }}>
            TestCraft Indonesia adalah perusahaan pelatihan IT yang berfokus pada Software
            Testing, QA Engineering, Test Automation, API & Performance Testing, AI for QA,
            dan DevOps for Test Automation.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <a
              href={process.env.NEXT_PUBLIC_LMS_URL ?? 'http://localhost:3000'}
              data-testid="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '16px 32px',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(14,156,156,.45)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              Mulai Belajar
            </a>
            <a
              href="#program"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 12,
                padding: '16px 32px',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.12)'
              }}
            >
              Lihat Program
            </a>
            <a
              href="https://wa.me/6282395568743?text=Halo%20TestCraft%20Indonesia,%20saya%20ingin%20konsultasi%20program%20training!"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 12,
                padding: '16px 32px',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.12)'
              }}
            >
              Konsultasi Gratis
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, fontSize: 13, color: '#94A3B8' }}>
            <span>⭐ 4.8/5 rating alumni</span>
            <span>·</span>
            <span>🏢 50+ corporate clients</span>
          </div>
        </div>

        {/* Right column — hero card */}
        <div
          style={{
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            padding: 26,
            boxShadow: '0 20px 60px rgba(0,0,0,.3)',
            animation: 'float 4s ease-in-out infinite',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <b style={{ fontFamily: 'Poppins, sans-serif' }}>Learn. Build. Automate.</b>
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
              }}
            >
              Est. 2024
            </span>
          </div>

          {[
            { bg: 'rgba(14,156,156,.25)', icon: '🎓', title: 'Public Training', desc: 'Kelas online & offline untuk individu' },
            { bg: 'rgba(16,185,129,.25)', icon: '🏢', title: 'Corporate Training', desc: 'Upskilling tim QA perusahaan Anda' },
            { bg: 'rgba(139,92,246,.25)', icon: '📜', title: 'Sertifikasi', desc: 'ISTQB preparation & sertifikat QR-verified' },
            { bg: 'rgba(245,158,11,.25)', icon: '🧪', title: 'QA Consulting', desc: 'Test strategy & automation framework' },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,.1)' : 'none',
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: row.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </span>
              <div>
                <b style={{ fontSize: 14 }}>{row.title}</b>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{row.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hero-inner {
            grid-template-columns: 1fr !important;
            padding: 60px 24px 80px !important;
          }
        }
        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr !important;
            padding: 48px 20px 64px !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  )
}
