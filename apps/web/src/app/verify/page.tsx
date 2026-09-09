"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, XCircle, Search, Shield, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALID = {
  "TC-2026-08421": {
    student: "Arief Rahman Hakim",
    course: "Playwright Automation Testing from Zero to Expert",
    instructor: "Budi Santoso",
    completed: "8 July 2026",
    score: 92,
  },
} as Record<string, { student: string; course: string; instructor: string; completed: string; score: number }>;

type CertData = { student: string; course: string; instructor: string; completed: string; score: number };

function CertificatePreview({ num, data, certRef }: { num: string; data: CertData; certRef?: React.RefObject<HTMLDivElement> | { current: HTMLDivElement | null } }) {
  return (
    <div
      ref={certRef}
      id="certificate-canvas"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #0a1628 0%, #0f2438 30%, #0e3d5c 60%, #0E9C9C 100%)",
        padding: "2px",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Inner certificate */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "14px",
          background: "linear-gradient(160deg, #0d1f35 0%, #0f2c45 40%, #113a55 70%, #0d3349 100%)",
          minHeight: "420px",
          padding: "0",
        }}
      >
        {/* Gold corner ornaments */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "80px", height: "80px", opacity: 0.4 }}>
          <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
            <path d="M0 0 L40 0 L0 40 Z" fill="#d4af37" opacity="0.3" />
            <path d="M0 0 L20 0 L0 20 Z" fill="#d4af37" opacity="0.6" />
            <circle cx="12" cy="12" r="4" fill="#d4af37" opacity="0.8" />
          </svg>
        </div>
        <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", opacity: 0.4, transform: "scaleX(-1)" }}>
          <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
            <path d="M0 0 L40 0 L0 40 Z" fill="#d4af37" opacity="0.3" />
            <path d="M0 0 L20 0 L0 20 Z" fill="#d4af37" opacity="0.6" />
            <circle cx="12" cy="12" r="4" fill="#d4af37" opacity="0.8" />
          </svg>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "80px", height: "80px", opacity: 0.4, transform: "scaleY(-1)" }}>
          <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
            <path d="M0 0 L40 0 L0 40 Z" fill="#d4af37" opacity="0.3" />
            <path d="M0 0 L20 0 L0 20 Z" fill="#d4af37" opacity="0.6" />
            <circle cx="12" cy="12" r="4" fill="#d4af37" opacity="0.8" />
          </svg>
        </div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "80px", height: "80px", opacity: 0.4, transform: "scale(-1)" }}>
          <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
            <path d="M0 0 L40 0 L0 40 Z" fill="#d4af37" opacity="0.3" />
            <path d="M0 0 L20 0 L0 20 Z" fill="#d4af37" opacity="0.6" />
            <circle cx="12" cy="12" r="4" fill="#d4af37" opacity="0.8" />
          </svg>
        </div>

        {/* Radial glow center */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(14,156,156,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Gold top border line */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #d4af37, #f0d060, #d4af37, transparent)" }} />

        <div style={{ padding: "36px 48px 32px", textAlign: "center" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <svg viewBox="0 0 32 32" style={{ width: "28px", height: "28px" }}>
              <defs>
                <linearGradient id="cert-logo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0E9C9C" />
                  <stop offset="100%" stopColor="#2FBF9F" />
                </linearGradient>
              </defs>
              <path d="M16 2.5 4.5 6.8v8.4c0 6.9 4.7 13.3 11.5 15.3 6.8-2 11.5-8.4 11.5-15.3V6.8L16 2.5Z" fill="url(#cert-logo)" />
              <path d="m10.6 16.2 3.7 3.8 7.1-7.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "18px", fontWeight: 800, color: "#e2f0f0", letterSpacing: "-0.3px" }}>
              TestCraft<span style={{ color: "#0E9C9C" }}>Indonesia</span>
            </span>
          </div>

          {/* Subtitle */}
          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, transparent, #d4af37)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", color: "#d4af37", fontFamily: "sans-serif", fontWeight: 600 }}>
              CERTIFICATE OF COMPLETION
            </span>
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, #d4af37, transparent)" }} />
          </div>

          {/* Awarded to */}
          <p style={{ marginTop: "28px", fontSize: "12px", color: "#94b8c8", fontFamily: "sans-serif" }}>
            This is to certify that
          </p>
          <p style={{
            marginTop: "8px",
            fontFamily: "Georgia, serif",
            fontSize: "30px",
            fontWeight: 700,
            fontStyle: "italic",
            color: "#f0f9f9",
            textShadow: "0 0 30px rgba(14,156,156,0.3)",
            lineHeight: 1.2,
          }}>
            {data.student}
          </p>

          <p style={{ marginTop: "14px", fontSize: "12px", color: "#94b8c8", fontFamily: "sans-serif" }}>
            has successfully completed the course
          </p>
          <p style={{
            marginTop: "8px",
            fontFamily: "Poppins, sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "#7dd8d8",
            padding: "0 16px",
            lineHeight: 1.4,
          }}>
            {data.course}
          </p>

          {/* Gold divider */}
          <div style={{ margin: "20px auto 0", width: "160px", height: "1px", background: "linear-gradient(90deg, transparent, #d4af37 40%, #d4af37 60%, transparent)" }} />

          {/* Stats */}
          <div style={{
            marginTop: "18px",
            display: "inline-flex",
            gap: 0,
            borderRadius: "12px",
            border: "1px solid rgba(212,175,55,0.25)",
            overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "12px 24px", textAlign: "center", borderRight: "1px solid rgba(212,175,55,0.2)" }}>
              <p style={{ fontSize: "10px", color: "#94b8c8", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>SCORE</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#0E9C9C", fontFamily: "sans-serif", marginTop: "2px" }}>{data.score}%</p>
            </div>
            <div style={{ padding: "12px 24px", textAlign: "center", borderRight: "1px solid rgba(212,175,55,0.2)" }}>
              <p style={{ fontSize: "10px", color: "#94b8c8", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>COMPLETED</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2f0f0", fontFamily: "sans-serif", marginTop: "4px" }}>{data.completed}</p>
            </div>
            <div style={{ padding: "12px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#94b8c8", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>INSTRUCTOR</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2f0f0", fontFamily: "sans-serif", marginTop: "4px" }}>{data.instructor}</p>
            </div>
          </div>

          {/* Certificate number */}
          <div style={{ marginTop: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E9C9C" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#7dd8d8", letterSpacing: "0.05em" }}>
              Certificate No: {num}
            </span>
          </div>
        </div>

        {/* Gold bottom border line */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #d4af37, #f0d060, #d4af37, transparent)" }} />
      </div>
    </div>
  );
}

function CertModal({
  num,
  data,
  onClose,
}: {
  num: string;
  data: CertData;
  onClose: () => void;
}) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 3, canvas.height / 3] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`TestCraft-Certificate-${num}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl animate-enter rounded-3xl bg-[#0a1628] shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-white">Valid Certificate</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Certificate */}
        <div className="p-6">
          <CertificatePreview num={num} data={data} certRef={certRef} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            Close
          </button>
          <Button onClick={handleDownload} disabled={downloading} className="gap-2">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [num, setNum] = useState("TC-2026-08421");
  const [result, setResult] = useState<null | { found: boolean; certNum: string; data?: CertData }>(null);
  const [showModal, setShowModal] = useState(false);

  const verify = () => {
    const trimmed = num.trim().toUpperCase();
    const data = VALID[trimmed];
    setResult({ found: !!data, certNum: trimmed, data });
    if (data) setShowModal(true);
  };

  return (
    <>
      {showModal && result?.found && result.data && (
        <CertModal num={result.certNum} data={result.data} onClose={() => setShowModal(false)} />
      )}

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: "linear-gradient(160deg, #f0fdfc 0%, #f8fafc 50%, #eff6ff 100%)" }}
      >
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E9C9C] to-[#0F2438] shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#12283E]">Certificate Verification</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500 mx-auto">
            Instantly verify the authenticity of any TestCraft Indonesia certificate.
          </p>
        </div>

        {/* Search card */}
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/60">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Certificate Number</label>
          <div className="flex gap-3">
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              placeholder="e.g. TC-2026-08421"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono outline-none transition focus:border-[#0E9C9C] focus:bg-white focus:ring-2 focus:ring-[#0E9C9C]/20"
            />
            <Button onClick={verify} className="gap-2 shrink-0">
              <Search className="h-4 w-4" />
              Verify
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-400">The certificate number is printed at the bottom of your certificate.</p>

          {result && (
            <div className="mt-6">
              {result.found && result.data ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-100 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800">Valid Certificate</p>
                        <p className="text-sm text-emerald-600">{result.data.student} · {result.data.course}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 group-hover:underline">View →</span>
                  </div>
                </button>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Certificate Not Found</p>
                      <p className="text-sm text-red-600">
                        &ldquo;{result.certNum}&rdquo; tidak ditemukan. Hubungi{" "}
                        <a href="mailto:testcraftindonesia@gmail.com" className="underline">testcraftindonesia@gmail.com</a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[#0E9C9C]" />Tamper-proof</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#0E9C9C]" />Industry-recognized</span>
          <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-[#0E9C9C]" />Instant results</span>
        </div>
        <a href="/" className="mt-8 text-sm text-slate-400 hover:text-[#0E9C9C] transition-colors">← Back to TestCraft Indonesia</a>
      </div>
    </>
  );
}
