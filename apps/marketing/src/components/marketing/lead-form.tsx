'use client'

import { useState, useRef, FormEvent } from 'react'

const PROGRAMS = [
  'Playwright Automation Testing from Zero to Expert',
  'ISTQB Foundation Preparation',
  'Selenium WebDriver with Java',
  'Postman API Testing',
  'AI for Software Testing',
  'Performance Testing using JMeter',
]

const FORM_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyGW2gZLlBP6fB7wV0ELbYT53ZUVzHgCZ6RVzNMTUmbFT6WdDEYDJOb3CV26hrnOz-A/exec'
const ADMISSION_WA = '6282395568743'

interface FormValues {
  nama: string
  email: string
  whatsapp: string
  jenis: string
  program: string
  catatan: string
}

export function LeadForm() {
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues | 'consent', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [waHref, setWaHref] = useState('#')
  const honeypotRef = useRef<HTMLInputElement>(null)

  function validate(v: FormValues, consent: boolean) {
    const errs: typeof errors = {}
    if (v.nama.length < 3) errs.nama = 'Mohon isi nama lengkap Anda.'
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.email)) errs.email = 'Format email belum benar.'
    if (v.whatsapp.replace(/\D/g, '').length < 9)
      errs.whatsapp = 'Nomor WhatsApp minimal 9 digit angka.'
    if (!consent) errs.consent = 'Centang persetujuan untuk melanjutkan.'
    return errs
  }

  function buildWaMessage(v: FormValues) {
    return (
      `Halo TestCraft Indonesia, saya ingin mendaftar.\n\nNama: ${v.nama}\nEmail: ${v.email}` +
      `\nWhatsApp: ${v.whatsapp}\nJenis: ${v.jenis}\nProgram: ${v.program || 'Belum ditentukan'}` +
      (v.catatan ? `\nCatatan: ${v.catatan}` : '')
    )
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (honeypotRef.current?.value) return // honeypot

    const form = ev.currentTarget
    const fd = new FormData(form)
    const v: FormValues = {
      nama: (fd.get('nama') as string).trim(),
      email: (fd.get('email') as string).trim(),
      whatsapp: (fd.get('whatsapp') as string).trim(),
      jenis: fd.get('jenis') as string,
      program: fd.get('program') as string,
      catatan: (fd.get('catatan') as string).trim(),
    }
    const consent = !!(form.querySelector('#reg-consent') as HTMLInputElement)?.checked

    const errs = validate(v, consent)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)

    const href =
      'https://wa.me/' + ADMISSION_WA + '?text=' + encodeURIComponent(buildWaMessage(v))
    setWaHref(href)

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...v, sumber: 'testcraft-marketing/next', bahasa: 'id' }),
      })
      setSuccessMsg(
        res.ok
          ? `Terima kasih <b>${v.nama}</b>. Pendaftaran Anda sudah kami terima — tim Admission akan menghubungi via WhatsApp dalam 1×24 jam kerja.`
          : `Terima kasih <b>${v.nama}</b>. Silakan tekan tombol di bawah untuk mengirim data Anda ke tim Admission via WhatsApp — itu yang mengonfirmasi pendaftaran Anda.`,
      )
    } catch {
      setSuccessMsg(
        `Terima kasih <b>${v.nama}</b>. Silakan tekan tombol di bawah untuk mengirim data Anda ke tim Admission via WhatsApp.`,
      )
    }

    setSubmitting(false)
    setSuccess(true)
  }

  return (
    <section id="kontak" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
      <div
        style={{
          background: 'var(--grad)',
          borderRadius: 24,
          color: '#fff',
          padding: '56px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="register-section"
      >
        {/* decorative blob */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,.3), transparent 60%)',
            top: -150,
            right: -100,
            pointerEvents: 'none',
          }}
        />

        {/* Left info */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 32, fontFamily: 'Poppins, sans-serif' }}>
            Mulai Perjalanan QA Anda Hari Ini
          </h2>
          <p style={{ marginTop: 16, color: '#CBD5E1', fontSize: 15 }}>
            Isi formulir pendaftaran dan tim kami akan menghubungi Anda via WhatsApp dalam 1×24 jam
            — untuk pendaftaran individu maupun penawaran corporate training.
          </p>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '💬', label: 'WhatsApp / Telepon', val: '+62 823-9556-8743', href: 'https://wa.me/6282395568743' },
              { icon: '✉️', label: 'Email', val: 'testcraftindonesia@gmail.com', href: 'mailto:testcraftindonesia@gmail.com' },
              { icon: '📍', label: 'Office', val: 'Jakarta, Indonesia' },
              { icon: '🎓', label: 'Sudah terdaftar?', val: 'Masuk ke LMS Portal ↗', href: 'https://ariefrahakim.github.io/testcraft-lms/' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{item.label}</div>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <b>{item.val}</b>
                    </a>
                  ) : (
                    <b>{item.val}</b>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <div
              style={{
                fontSize: 12,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '.6px',
                fontWeight: 700,
              }}
            >
              Alur pendaftaran
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 14,
                color: '#CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {[
                'Isi formulir di samping — data langsung masuk ke tim Admission.',
                'Tim kami menghubungi via WhatsApp dalam 1×24 jam kerja untuk konsultasi & jadwal batch.',
                'Setelah pembayaran dikonfirmasi, akun LMS aktif dan Anda bisa mulai belajar.',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,.15)',
                      color: '#5EEAD4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: 30,
            color: 'var(--navy)',
            position: 'relative',
            zIndex: 2,
          }}
          className="register-form-box"
        >
          {!success ? (
            <>
              <h3 style={{ fontSize: 19, fontFamily: 'Poppins, sans-serif', marginBottom: 16 }}>
                Formulir Pendaftaran
              </h3>

              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot */}
                <input
                  ref={honeypotRef}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, width: 0 }}
                />

                {[
                  { id: 'reg-name', name: 'nama', label: 'Nama lengkap', type: 'text', placeholder: 'Nama Anda', required: true, errKey: 'nama' as const },
                  { id: 'reg-email', name: 'email', label: 'Email', type: 'email', placeholder: 'anda@email.com', required: true, errKey: 'email' as const },
                  { id: 'reg-phone', name: 'whatsapp', label: 'No. WhatsApp', type: 'tel', placeholder: '0812xxxxxxx', required: true, errKey: 'whatsapp' as const },
                ].map((f) => (
                  <div key={f.id} style={{ marginBottom: 14 }}>
                    <label
                      htmlFor={f.id}
                      style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}
                    >
                      {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      id={f.id}
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      required={f.required}
                      onChange={() => setErrors((e) => ({ ...e, [f.errKey]: undefined }))}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 14,
                        padding: '11px 14px',
                        border: `1.5px solid ${errors[f.errKey] ? '#EF4444' : '#E2E8F0'}`,
                        borderRadius: 10,
                        width: '100%',
                        outline: 'none',
                        transition: 'border .2s',
                        color: '#12283E',
                      }}
                    />
                    {errors[f.errKey] && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', marginTop: 5 }}>
                        {errors[f.errKey]}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="reg-type"
                    style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}
                  >
                    Jenis pendaftaran
                  </label>
                  <select
                    id="reg-type"
                    name="jenis"
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 14,
                      padding: '11px 14px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 10,
                      width: '100%',
                      background: '#fff',
                      color: '#12283E',
                    }}
                  >
                    <option>Individu — Public Training</option>
                    <option>QA Bootcamp</option>
                    <option>Perusahaan — Corporate Training</option>
                    <option>Konsultasi / QA Consulting</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="reg-course"
                    style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}
                  >
                    Program yang diminati
                  </label>
                  <select
                    id="reg-course"
                    name="program"
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 14,
                      padding: '11px 14px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 10,
                      width: '100%',
                      background: '#fff',
                      color: '#12283E',
                    }}
                  >
                    <option value="">Belum ditentukan</option>
                    {PROGRAMS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                    <option>Program lainnya</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="reg-note"
                    style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}
                  >
                    Catatan (opsional)
                  </label>
                  <textarea
                    id="reg-note"
                    name="catatan"
                    rows={2}
                    placeholder="Pertanyaan atau jadwal yang diinginkan"
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 14,
                      padding: '11px 14px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 10,
                      width: '100%',
                      resize: 'vertical',
                      minHeight: 62,
                      color: '#12283E',
                    }}
                  />
                </div>

                <label
                  htmlFor="reg-consent"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 9,
                    fontSize: 12.5,
                    color: '#475569',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    marginBottom: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    id="reg-consent"
                    required
                    onChange={() => setErrors((e) => ({ ...e, consent: undefined }))}
                    style={{ width: 17, height: 17, padding: 0, marginTop: 1, flexShrink: 0, accentColor: '#0E9C9C' }}
                  />
                  <span>
                    Saya setuju data saya dihubungi tim TestCraft Indonesia sesuai{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0E9C9C', textDecoration: 'underline' }}
                    >
                      Kebijakan Privasi
                    </a>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', marginBottom: 12 }}>
                    {errors.consent}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    background: submitting ? '#7ECECE' : '#0E9C9C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .2s',
                  }}
                >
                  {submitting ? 'Mengirim…' : 'Kirim Pendaftaran'}
                </button>
              </form>

              <div style={{ textAlign: 'center', margin: '12px 0', fontSize: 12, color: '#94A3B8' }}>
                — atau langsung chat kami —
              </div>
              <a
                href="https://wa.me/6282395568743?text=Halo%20TestCraft%20Indonesia,%20saya%20ingin%20mendaftar%20program%20training."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
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
                }}
              >
                💬 WhatsApp +62 823-9556-8743
              </a>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52 }}>✅</div>
              <h3 style={{ marginTop: 8, fontSize: 20, fontFamily: 'Poppins, sans-serif' }}>
                Pendaftaran Terkirim!
              </h3>
              <p
                style={{ fontSize: 14, color: '#475569', marginTop: 8 }}
                dangerouslySetInnerHTML={{ __html: successMsg }}
              />
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
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
                💬 Konfirmasi via WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .register-section { grid-template-columns: 1fr !important; padding: 36px !important; }
        }
        @media (max-width: 640px) {
          .register-section { padding: 26px 20px !important; }
        }
        .register-form-box { background: #fff !important; }
        html[data-theme="dark"] .register-form-box {
          background: var(--card) !important;
          color: var(--text) !important;
        }
      `}</style>
    </section>
  )
}
