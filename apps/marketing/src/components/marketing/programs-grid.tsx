'use client'

const PROGRAMS = [
  {
    icon: '🎭',
    title: 'Playwright Automation Testing from Zero to Expert',
    meta: 'Automation · 32 jam · Beginner',
    price: 'Rp 1.250.000',
    originalPrice: 'Rp 2.500.000',
    rating: '⭐ 4.9 (1.240)',
    gradient: 'linear-gradient(135deg, #16506B, #0E9C9C)',
  },
  {
    icon: '📜',
    title: 'ISTQB Foundation Preparation',
    meta: 'Manual Testing · 20 jam · Beginner',
    price: 'Rp 850.000',
    originalPrice: 'Rp 1.700.000',
    rating: '⭐ 4.8 (2.100)',
    gradient: 'linear-gradient(135deg, #059669, #0E9C9C)',
  },
  {
    icon: '☕',
    title: 'Selenium WebDriver with Java',
    meta: 'Automation · 38 jam · Beginner',
    price: 'Rp 1.350.000',
    originalPrice: 'Rp 2.700.000',
    rating: '⭐ 4.8 (1.560)',
    gradient: 'linear-gradient(135deg, #12283E, #16506B)',
  },
  {
    icon: '📮',
    title: 'Postman API Testing',
    meta: 'API Testing · 14 jam · Beginner',
    price: 'Rp 750.000',
    originalPrice: 'Rp 1.500.000',
    rating: '⭐ 4.8 (1.810)',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
  {
    icon: '🤖',
    title: 'AI for Software Testing',
    meta: 'AI for QA · 22 jam · Advanced',
    price: 'Rp 1.450.000',
    originalPrice: 'Rp 2.900.000',
    rating: '⭐ 4.9 (740)',
    gradient: 'linear-gradient(135deg, #0E9C9C, #2FBF9F)',
  },
  {
    icon: '⚡',
    title: 'Performance Testing using JMeter',
    meta: 'Performance · 18 jam · Intermediate',
    price: 'Rp 1.100.000',
    originalPrice: 'Rp 2.100.000',
    rating: '⭐ 4.7 (480)',
    gradient: 'linear-gradient(135deg, #10B981, #0F766E)',
  },
]

function openLMS() {
  window.open('https://ariefrahakim.github.io/testcraft-lms/', '_blank', 'noopener')
}

export function ProgramsGrid() {
  return (
    <section className="container-custom" id="program" style={{ paddingTop: 48 }}>
      <h2 className="section-title">Program Unggulan</h2>
      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-2)',
          maxWidth: 600,
          margin: '12px auto 0',
          fontSize: 15,
        }}
      >
        Semua pembelajaran berjalan di LMS TestCraft — video HD, quiz interaktif, proyek nyata,
        forum diskusi, dan sertifikat otomatis.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginTop: 32,
        }}
        className="programs-grid"
      >
        {PROGRAMS.map((p, i) => (
          <div
            key={i}
            role="link"
            tabIndex={0}
            onClick={openLMS}
            onKeyDown={(e) => e.key === 'Enter' && openLMS()}
            className="service-card"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              transition: 'transform .25s, box-shadow .25s',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                height: 150,
                background: p.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                color: '#fff',
              }}
            >
              {p.icon}
            </div>

            {/* Body */}
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.meta}</span>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <span style={{ color: '#F59E0B' }}>★★★★★</span>
                <b>{p.rating}</b>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--blue)',
                  }}
                >
                  {p.price}
                  <s style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500, marginLeft: 8 }}>
                    {p.originalPrice}
                  </s>
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'var(--blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Daftar
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a
          href="https://ariefrahakim.github.io/testcraft-lms/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: '1.5px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Lihat Semua 48 Program di LMS ↗
        </a>
      </div>

      <style>{`
        .container-custom { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 1024px) { .programs-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .programs-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
