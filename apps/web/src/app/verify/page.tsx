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
        background: "#fdfcf8",
        borderRadius: "12px",
        border: "1px solid #e8e0d0",
        overflow: "hidden",
        fontFamily: "Georgia, 'Times New Roman', serif",
        boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
      }}
    >
      {/* Left teal accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "6px",
        background: "linear-gradient(180deg, #0E9C9C 0%, #12283E 100%)",
      }} />

      {/* Watermark seal */}
      <div style={{
        position: "absolute", right: "32px", bottom: "32px",
        width: "90px", height: "90px", opacity: 0.06,
      }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#0E9C9C" strokeWidth="3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#0E9C9C" strokeWidth="1.5" />
          <text x="50" y="46" textAnchor="middle" fontSize="9" fill="#0E9C9C" fontWeight="700" letterSpacing="3">TESTCRAFT</text>
          <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#0E9C9C" letterSpacing="2">VERIFIED</text>
        </svg>
      </div>

      <div style={{ padding: "40px 52px 36px 58px" }}>
        {/* Top: brand + label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg viewBox="0 0 32 32" style={{ width: "32px", height: "32px" }}>
              <defs>
                <linearGradient id="cert-logo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0E9C9C" />
                  <stop offset="100%" stopColor="#12283E" />
                </linearGradient>
              </defs>
              <path d="M16 2.5 4.5 6.8v8.4c0 6.9 4.7 13.3 11.5 15.3 6.8-2 11.5-8.4 11.5-15.3V6.8L16 2.5Z" fill="url(#cert-logo)" />
              <path d="m10.6 16.2 3.7 3.8 7.1-7.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div style={{ fontFamily: "sans-serif", fontSize: "15px", fontWeight: 800, color: "#12283E", letterSpacing: "-0.3px" }}>
                TestCraft <span style={{ color: "#0E9C9C" }}>Indonesia</span>
              </div>
              <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "#0E9C9C", fontFamily: "sans-serif", fontWeight: 600, marginTop: "1px" }}>
                CERTIFICATE OF COMPLETION
              </div>
            </div>
          </div>
          <div style={{
            fontSize: "11px", fontFamily: "sans-serif", color: "#9ca3af",
            textAlign: "right", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: "#0E9C9C" }}>{data.score}% Score</div>
            <div>{data.completed}</div>
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ margin: "24px 0", height: "1px", background: "linear-gradient(90deg, #0E9C9C, #e8e0d0 80%)" }} />

        {/* Main content */}
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "sans-serif", letterSpacing: "0.05em" }}>
            This is to certify that
          </div>
          <div style={{
            marginTop: "6px",
            fontSize: "34px",
            fontWeight: 700,
            fontStyle: "italic",
            color: "#12283E",
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
          }}>
            {data.student}
          </div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: "#9ca3af", fontFamily: "sans-serif" }}>
            has successfully completed
          </div>
          <div style={{
            marginTop: "4px",
            fontSize: "16px",
            fontWeight: 700,
            color: "#0E9C9C",
            fontFamily: "sans-serif",
            lineHeight: 1.4,
          }}>
            {data.course}
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ margin: "24px 0", height: "1px", background: "linear-gradient(90deg, #e8e0d0, transparent 60%)" }} />

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#9ca3af", fontFamily: "sans-serif" }}>INSTRUCTOR</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "sans-serif", marginTop: "2px" }}>{data.instructor}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#9ca3af", fontFamily: "sans-serif" }}>CERTIFICATE NO</div>
            <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#0E9C9C", marginTop: "2px", letterSpacing: "0.05em" }}>{num}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#9ca3af", fontFamily: "sans-serif" }}>ISSUED BY</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "sans-serif", marginTop: "2px" }}>TestCraft Indonesia</div>
          </div>
        </div>
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
