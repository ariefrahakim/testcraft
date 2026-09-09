"use client";

import { useState } from "react";
import { CheckCircle2, Download, XCircle, Search, Shield, X } from "lucide-react";
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

function CertificatePreview({ num, data }: { num: string; data: CertData }) {
  return (
    <div
      id="certificate-print"
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #0F2438 0%, #16506B 50%, #0E9C9C 100%)",
        padding: "3px",
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-white"
        style={{ minHeight: 420 }}
      >
        {/* Top decorative band */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, #0F2438, #0E9C9C, #0F2438)" }}
        />

        {/* Corner ornaments */}
        <div
          className="absolute left-4 top-6 h-16 w-16 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0E9C9C, transparent)" }}
        />
        <div
          className="absolute right-4 bottom-6 h-16 w-16 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0F2438, transparent)" }}
        />

        <div className="px-10 py-8 text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-[#0E9C9C]" />
            <span className="font-display text-lg font-bold text-[#12283E]">TestCraft Indonesia</span>
          </div>

          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Certificate of Completion</p>

          {/* Divider */}
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#0E9C9C] to-transparent" />

          {/* Awarded to */}
          <p className="mt-6 text-sm text-slate-500">This is to certify that</p>
          <p
            className="mt-2 font-display text-3xl font-extrabold"
            style={{ color: "#12283E", fontStyle: "italic" }}
          >
            {data.student}
          </p>

          <p className="mt-4 text-sm text-slate-500">has successfully completed the course</p>
          <p className="mt-2 text-base font-bold text-[#12283E] leading-snug px-4">
            {data.course}
          </p>

          {/* Stats row */}
          <div className="mx-auto mt-6 flex w-fit gap-6 rounded-2xl bg-slate-50 px-8 py-4 text-center">
            <div>
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-xl font-extrabold text-[#0E9C9C]">{data.score}%</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">Completed</p>
              <p className="text-sm font-bold text-[#12283E]">{data.completed}</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">Instructor</p>
              <p className="text-sm font-bold text-[#12283E]">{data.instructor}</p>
            </div>
          </div>

          {/* Certificate number */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#0E9C9C]" />
            <p className="text-xs font-mono text-slate-400">Certificate No: {num}</p>
          </div>
        </div>

        {/* Bottom decorative band */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, #0E9C9C, #0F2438, #0E9C9C)" }}
        />
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
  const handleDownload = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl animate-enter rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-slate-800">Valid Certificate</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Certificate */}
        <div className="p-6">
          <CertificatePreview num={num} data={data} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") verify();
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#__print_cert) { display: none !important; }
          #certificate-print { page-break-inside: avoid; }
        }
      `}</style>

      {showModal && result?.found && result.data && (
        <CertModal
          num={result.certNum}
          data={result.data}
          onClose={() => setShowModal(false)}
        />
      )}

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{
          background: "linear-gradient(160deg, #f0fdfc 0%, #f8fafc 50%, #eff6ff 100%)",
        }}
      >
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E9C9C] to-[#0F2438] shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#12283E]">
            Certificate Verification
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500 mx-auto">
            Instantly verify the authenticity of any TestCraft Indonesia certificate.
            Trusted by employers and institutions.
          </p>
        </div>

        {/* Search card */}
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/60">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Certificate Number
          </label>
          <div className="flex gap-3">
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. TC-2026-08421"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono outline-none transition focus:border-[#0E9C9C] focus:bg-white focus:ring-2 focus:ring-[#0E9C9C]/20"
            />
            <Button onClick={verify} className="gap-2 shrink-0">
              <Search className="h-4 w-4" />
              Verify
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            The certificate number is printed at the bottom of your certificate and in your email.
          </p>

          {/* Result */}
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
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 group-hover:underline">
                      View →
                    </span>
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
                        &ldquo;{result.certNum}&rdquo; does not match any record. Check the number or contact{" "}
                        <a href="mailto:testcraftindonesia@gmail.com" className="underline">
                          testcraftindonesia@gmail.com
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#0E9C9C]" />
            Tamper-proof verification
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0E9C9C]" />
            Industry-recognized credentials
          </span>
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[#0E9C9C]" />
            Instant results
          </span>
        </div>

        {/* Back link */}
        <a
          href="/"
          className="mt-8 text-sm text-slate-400 hover:text-[#0E9C9C] transition-colors"
        >
          ← Back to TestCraft Indonesia
        </a>
      </div>
    </>
  );
}
