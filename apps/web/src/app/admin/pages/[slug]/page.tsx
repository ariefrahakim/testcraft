'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import type { PageDto } from '@testcraft/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Field, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';

interface EditableBlock {
  id?: string;
  type: string;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
}

const BLOCK_TYPES = [
  { value: 'HERO', label: 'Hero — judul besar + tombol' },
  { value: 'STATS', label: 'Statistik — angka pencapaian' },
  { value: 'COURSE_GRID', label: 'Grid Kelas — daftar kelas' },
  { value: 'LEARNING_PATHS', label: 'Jalur Belajar' },
  { value: 'TESTIMONIALS', label: 'Testimoni' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'PRICING_TABLE', label: 'Tabel Harga' },
  { value: 'CTA', label: 'Ajakan Bertindak' },
  { value: 'RICH_TEXT', label: 'Teks Bebas (HTML)' },
];

/** Contoh payload agar admin tahu field apa yang dipakai tiap tipe blok. */
const BLOCK_TEMPLATES: Record<string, Record<string, unknown>> = {
  HERO: {
    heading: 'Judul utama',
    subheading: 'Kalimat pendukung',
    ctaLabel: 'Lihat Katalog',
    ctaUrl: '/catalog',
    secondaryCtaLabel: 'Konsultasi Gratis',
    secondaryCtaUrl: 'https://wa.me/6282395568743',
  },
  STATS: { items: [{ value: '28.400+', label: 'Peserta Aktif' }] },
  COURSE_GRID: { heading: 'Kelas Unggulan', filter: 'featured', limit: 6 },
  LEARNING_PATHS: { heading: 'Jalur Belajar Terstruktur' },
  TESTIMONIALS: { heading: 'Apa Kata Alumni' },
  FAQ: { heading: 'Pertanyaan yang Sering Diajukan' },
  PRICING_TABLE: { heading: 'Pilih Paket yang Sesuai' },
  CTA: {
    heading: 'Siap memulai?',
    body: 'Konsultasi gratis dengan tim kami.',
    ctaLabel: 'Chat WhatsApp',
    ctaUrl: 'https://wa.me/6282395568743',
  },
  RICH_TEXT: { html: '<p>Tulis konten di sini.</p>' },
};

export default function PageBlockEditor() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, reload } = useApi<PageDto>(`/cms/pages/${slug}`);

  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [newType, setNewType] = useState('HERO');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (data?.blocks) {
      setBlocks(
        data.blocks.map((b) => ({
          id: b.id,
          type: b.type,
          order: b.order,
          visible: b.visible,
          data: b.data,
        })),
      );
    }
  }, [data]);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next.map((b, i) => ({ ...b, order: i })));
  }

  async function save() {
    if (!data) return;
    setMessage(null);
    setBusy(true);
    try {
      await api.patch(
        `/cms/pages/${data.id}`,
        {
          blocks: blocks.map((b, i) => ({
            type: b.type,
            order: i,
            visible: b.visible,
            data: b.data,
          })),
        },
        { auth: true },
      );
      setMessage({ tone: 'success', text: 'Blok halaman tersimpan.' });
      reload();
    } catch (err) {
      setMessage({
        tone: 'danger',
        text: err instanceof Error ? err.message : 'Gagal menyimpan',
      });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!data) return;
    setBusy(true);
    try {
      await api.post(`/cms/pages/${data.id}/publish`, undefined, { auth: true });
      setMessage({ tone: 'success', text: 'Halaman diterbitkan.' });
      reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />;
  }

  if (!data) {
    return (
      <Alert>
        Halaman tidak ditemukan.{' '}
        <Link href="/admin/pages" className="underline">
          Kembali
        </Link>
      </Alert>
    );
  }

  return (
    <>
      <Link
        href="/admin/pages"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Halaman
      </Link>

      <PageHeader
        title={data.title}
        description={`/${data.slug} · ${blocks.length} blok`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={publish} disabled={busy}>
              Terbitkan
            </Button>
            <Button size="sm" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" /> Simpan
            </Button>
          </div>
        }
      />

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <div className="space-y-4">
        {blocks.map((block, i) => (
          <Card key={block.id ?? `new-${i}`}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Badge tone="blue">{block.type}</Badge>
                  {!block.visible && <Badge tone="slate">Disembunyikan</Badge>}
                </span>
              }
              description={`Urutan ${i + 1}`}
              action={
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Naikkan"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Turunkan"
                    onClick={() => move(i, 1)}
                    disabled={i === blocks.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={block.visible ? 'Sembunyikan' : 'Tampilkan'}
                    onClick={() =>
                      setBlocks((list) =>
                        list.map((b, j) => (j === i ? { ...b, visible: !b.visible } : b)),
                      )
                    }
                  >
                    {block.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus blok"
                    onClick={() => setBlocks((list) => list.filter((_, j) => j !== i))}
                    className="text-danger hover:bg-danger-light"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              }
            />
            <CardBody>
              <Field
                label="Isi blok (JSON)"
                htmlFor={`block-${i}`}
                hint="Ubah nilai teks/tautan sesuai kebutuhan. Struktur field mengikuti tipe blok."
              >
                <Textarea
                  id={`block-${i}`}
                  rows={Math.min(14, JSON.stringify(block.data, null, 2).split('\n').length + 1)}
                  className="font-mono text-xs"
                  value={JSON.stringify(block.data, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setBlocks((list) =>
                        list.map((b, j) => (j === i ? { ...b, data: parsed } : b)),
                      );
                    } catch {
                      // JSON belum valid saat diketik — biarkan pengguna lanjut mengetik.
                    }
                  }}
                />
              </Field>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Tambah blok baru" htmlFor="newType">
            <Select
              id="newType"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="sm:w-72"
            >
              {BLOCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            variant="outline"
            onClick={() =>
              setBlocks((list) => [
                ...list,
                {
                  type: newType,
                  order: list.length,
                  visible: true,
                  data: BLOCK_TEMPLATES[newType] ?? {},
                },
              ])
            }
          >
            Tambahkan
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
