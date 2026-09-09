'use client'

export function Testimonials() {
  const clients = [
    'Bank Nusantara',
    'GoTech Indonesia',
    'TelkomDigital',
    'AstraVenture',
    'BukaKarya',
    'FinPay',
    'LogistiKu',
    'EduPrime',
  ]

  const testimonials = [
    {
      initials: 'FA',
      name: 'Fitri Amelia',
      role: 'Test Lead @ Konsultan IT',
      stars: 5,
      text: '"Kami mendaftarkan 25 engineer di program corporate. Dashboard progress-nya memudahkan tracking, dan skill tim naik drastis dalam satu kuartal."',
    },
    {
      initials: 'RH',
      name: 'Rina Handayani',
      role: 'QA Engineer @ Bank Digital',
      stars: 5,
      text: '"Dalam 3 bulan saya pindah dari manual tester ke SDET dengan kenaikan gaji 60%. Materinya selalu update dan mentor sangat responsif."',
    },
  ]

  return (
    <section
      id="klien"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0', textAlign: 'center' }}
    >
      <h2 className="section-title">Dipercaya Perusahaan Terkemuka</h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 14,
          marginTop: 32,
        }}
      >
        {clients.map((c) => (
          <span
            key={c}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 99,
              fontWeight: 600,
            }}
          >
            🏢 {c}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginTop: 32,
          textAlign: 'left',
        }}
        className="testi-grid"
      >
        {testimonials.map((t) => (
          <div
            key={t.name}
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
            <div style={{ color: '#F59E0B', letterSpacing: 1, fontSize: 14, marginBottom: 8 }}>
              {'★'.repeat(t.stars)}
            </div>
            <p style={{ fontSize: 14, fontStyle: 'italic' }}>{t.text}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--grad-accent)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {t.initials}
              </div>
              <div>
                <b style={{ fontSize: 14 }}>{t.name}</b>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) { .testi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
