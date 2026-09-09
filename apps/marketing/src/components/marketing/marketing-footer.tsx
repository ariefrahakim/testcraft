export function MarketingFooter() {
  return (
    <footer style={{ background: 'var(--navy)', color: '#94A3B8', marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 30px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: 19,
                color: '#fff',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: 'rgba(255,255,255,.08)',
                  border: '1px solid rgba(255,255,255,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
                  <defs>
                    <linearGradient id="tcg-footer" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#1B3A5C" />
                      <stop offset=".55" stopColor="#16607C" />
                      <stop offset="1" stopColor="#0E9C9C" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M32 5 L55 13 V30 C55 45 44 55 32 59 C20 55 9 45 9 30 V13 Z"
                    fill="none"
                    stroke="url(#tcg-footer)"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 31 L30 41 L48 19"
                    fill="none"
                    stroke="#0E9C9C"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>
                <b style={{ color: '#fff' }}>TEST</b>
                <span style={{ color: '#3ECFC4' }}>CRAFT</span>
              </span>
            </div>
            <p style={{ fontSize: 14, marginTop: 16, lineHeight: 1.7 }}>
              Quality Software. Confident Delivery.
              <br />
              Perusahaan pelatihan IT untuk Software Testing & QA Engineering.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>Perusahaan</h4>
            {[
              { href: '#tentang', label: 'Tentang Kami' },
              { href: '#layanan', label: 'Layanan' },
              { href: '#klien', label: 'Klien & Testimoni' },
              { href: '#kontak', label: 'Kontak' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{ display: 'block', padding: '5px 0', fontSize: 14, color: '#94A3B8' }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Learn */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>Belajar</h4>
            {[
              { href: '#program', label: 'Program Unggulan' },
              { href: 'https://ariefrahakim.github.io/testcraft-lms/', label: 'LMS Portal ↗', external: true },
              { href: 'https://ariefrahakim.github.io/testcraft-lms/#/verify', label: 'Verifikasi Sertifikat', external: true },
              { href: '#kontak', label: 'Jadi Instruktur' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', padding: '5px 0', fontSize: 14, color: '#94A3B8' }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>Kontak & Legal</h4>
            {[
              { href: 'https://wa.me/6282395568743', label: '💬 +62 823-9556-8743', external: true },
              { href: 'mailto:testcraftindonesia@gmail.com', label: '✉️ testcraftindonesia@gmail.com' },
              { href: '/terms', label: 'Syarat & Ketentuan' },
              { href: '/privacy', label: 'Kebijakan Privasi' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', padding: '5px 0', fontSize: 14, color: '#94A3B8' }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: '#1E293B',
            margin: '40px 0 20px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 14,
            color: '#64748B',
          }}
        >
          <span>© 2026 TestCraft Indonesia. All rights reserved.</span>
          <span>Learn. Build. Automate. 🇮🇩</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  )
}
