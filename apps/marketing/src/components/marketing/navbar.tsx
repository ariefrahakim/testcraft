'use client'

import { useState, useEffect } from 'react'

export function Navbar() {
  const [navOpen, setNavOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('tcw_theme') as 'light' | 'dark') || 'light'
    setTheme(saved)
    document.documentElement.dataset.theme = saved
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('tcw_theme', next)
  }

  const navLinks = [
    { href: '#layanan', label: 'Layanan' },
    { href: '#program', label: 'Program' },
    { href: '#bootcamp', label: 'Bootcamp' },
    { href: '#tentang', label: 'Tentang Kami' },
    { href: '#klien', label: 'Klien' },
    { href: '#faq', label: 'FAQ' },
    { href: '#kontak', label: 'Kontak' },
  ]

  return (
    <nav
      aria-label="Navigasi utama"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'color-mix(in srgb, var(--card) 85%, transparent)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Logo */}
        <a
          href="#home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: 19,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            color: 'var(--text)',
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(15,23,42,.12)',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
              <defs>
                <linearGradient id="tcg-nav" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1B3A5C" />
                  <stop offset=".55" stopColor="#16607C" />
                  <stop offset="1" stopColor="#0E9C9C" />
                </linearGradient>
              </defs>
              <path
                d="M32 5 L55 13 V30 C55 45 44 55 32 59 C20 55 9 45 9 30 V13 Z"
                fill="none"
                stroke="url(#tcg-nav)"
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
            <b style={{ color: 'var(--text)' }}>TEST</b>
            <span style={{ color: '#0E9C9C' }}>CRAFT</span>{' '}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>INDONESIA</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }} className="nav-links-desktop">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-2)',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--blue-light)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--blue)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title="Ganti tema terang/gelap"
          aria-label="Ganti tema terang/gelap"
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            border: '1.5px solid var(--border)',
            background: 'var(--card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* LMS Portal link */}
        <a
          href="https://app.testcraft.id"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: '1.5px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 10,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            transition: 'border-color 0.2s, color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--blue)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--blue-light)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          LMS Portal ↗
        </a>

        {/* CTA */}
        <a
          href="#kontak"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#0E9C9C',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            transition: 'background 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--blue-dark)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = '#0E9C9C'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          }}
        >
          Daftar
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="nav-toggle-btn"
          onClick={() => setNavOpen((o) => !o)}
          aria-expanded={navOpen}
          aria-controls="nav-drawer"
          aria-label="Buka menu navigasi"
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            border: '1.5px solid var(--border)',
            background: 'var(--card)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            cursor: 'pointer',
          }}
        >
          {navOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="nav-drawer"
        aria-hidden={!navOpen}
        style={{
          borderTop: navOpen ? '1px solid var(--border)' : 'none',
          background: 'var(--card)',
          padding: navOpen ? '10px 24px 16px' : '0 24px',
          maxHeight: navOpen ? 480 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
        }}
      >
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setNavOpen(false)}
            style={{
              display: 'block',
              padding: '11px 12px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-2)',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--blue-light)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--blue)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
            }}
          >
            {l.label}
          </a>
        ))}
        <a
          href="https://app.testcraft.id"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '11px 12px',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--blue)',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--blue-light)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          LMS Portal ↗
        </a>
      </div>

      <style>{`
        @media (max-width: 1120px) { .nav-links-desktop { display: none !important; } }
        @media (max-width: 1120px) { .nav-toggle-btn { display: inline-flex !important; } }
        @media (max-width: 640px) { .nav-cta { display: none !important; } }
      `}</style>
    </nav>
  )
}
