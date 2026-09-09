# Arsitektur TestCraft LMS

Dokumen ini menjelaskan **kenapa** sistem disusun seperti sekarang. Untuk cara
menjalankan, lihat [README](../README.md).

---

## 1. Batas tanggung jawab

```
┌─────────────────────────────────────────────────────────────┐
│ apps/web — Presentasi                                       │
│ • Render UI, validasi bentuk (UX), navigasi, state layar    │
│ • TIDAK memutuskan harga, hak akses, atau kelulusan         │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + JWT
┌──────────────────────────▼──────────────────────────────────┐
│ apps/api — Aturan bisnis                                    │
│ • Autentikasi, otorisasi, validasi, transaksi               │
│ • Satu-satunya pihak yang boleh menyentuh database          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma
┌──────────────────────────▼──────────────────────────────────┐
│ PostgreSQL — Kebenaran data                                 │
└─────────────────────────────────────────────────────────────┘
```

Aturan yang **tidak boleh** pindah ke frontend:

| Aturan | Ditegakkan di |
|---|---|
| Harga & diskon dihitung dari data server | `PaymentsService.checkout()` |
| Kursus berbayar butuh `Payment.status = PAID` | `EnrollmentsService.enroll()` |
| Kunci jawaban kuis tidak dikirim ke siswa | `select` pada `QuestionsService` |
| Mentor hanya menilai kelas yang diampu | `InstructorService.grade()` |
| Webhook pembayaran idempoten | `PaymentsService.markPaid()` |

---

## 2. Autentikasi

```
POST /auth/login
  → verifikasi Argon2id
  → access token  (JWT, 15 menit, tidak disimpan server)
  → refresh token (JWT, 30 hari, hash SHA-256 disimpan di RefreshToken)

POST /auth/refresh
  → verifikasi tanda tangan JWT
  → cek hash di database: belum dicabut & belum kedaluwarsa
  → CABUT token lama, terbitkan pasangan baru   ← rotasi
```

**Kenapa rotasi?** Kalau refresh token bocor, penyerang hanya bisa memakainya
sekali; pemakaian berikutnya oleh pemilik sah akan gagal dan memberi sinyal.

**Kenapa access token pendek (15 menit)?** Perubahan role atau penonaktifan akun
berlaku cepat. `JwtStrategy.validate()` juga memuat ulang user dari database
setiap request, jadi akun yang dinonaktifkan langsung ditolak.

**Kenapa password tidak pernah kami simpan di frontend?** "Ingat saya" hanya
menyimpan alamat email di `localStorage`. Password diserahkan sepenuhnya kepada
password manager browser lewat atribut `autoComplete` yang benar.

---

## 3. Otorisasi

Tiga guard global, berurutan:

1. `JwtAuthGuard` — semua endpoint butuh Bearer token kecuali `@Public()`
2. `RolesGuard` — memeriksa `@Roles(...)`; `SUPER_ADMIN` selalu lolos
3. `ThrottlerGuard` — 120 request/menit per IP

Otorisasi tingkat data (misalnya "mentor ini pemilik kelas itu") diperiksa di
service, bukan guard, karena butuh query database.

---

## 4. Kontrak tipe bersama

`packages/shared` berisi enum dan DTO yang dipakai kedua aplikasi.

```
schema.prisma  ──(nilai enum identik)──►  packages/shared/src/enums.ts
                                                   │
                              ┌────────────────────┴────────────────────┐
                              ▼                                         ▼
                   apps/api (DTO & response)                 apps/web (props & state)
```

Kalau menambah nilai enum, ubah di dua tempat: `schema.prisma` dan
`packages/shared/src/enums.ts`. TypeScript akan menandai pemakaian yang belum
disesuaikan.

---

## 5. Model konten CMS

```
Page ──1:N──► ContentBlock
                 ├─ type    : BlockType (HERO, STATS, FAQ, …)
                 ├─ order   : urutan tampil
                 ├─ visible : sembunyikan tanpa menghapus
                 └─ data    : Json — bentuknya bergantung `type`
```

**Kenapa `Json`, bukan kolom terpisah per tipe blok?** Setiap tipe blok punya
field berbeda. Menyimpannya sebagai `Json` berarti menambah tipe blok baru
cukup dengan menambah komponen renderer di frontend — tanpa migrasi database.

Konsekuensinya: bentuk `data` tidak dijamin oleh database. Karena itu
`BlockRenderer` membaca field secara defensif (`str()`, `num()`) dan mengabaikan
tipe blok yang tidak dikenal, sehingga halaman produksi tidak pernah rusak
karena data CMS.

**Update blok bersifat replace-all.** `PATCH /cms/pages/:id` dengan `blocks`
akan menghapus lalu membuat ulang seluruh blok dalam satu transaksi. Ini
menyederhanakan operasi reorder dan delete dari editor secara drastis
dibanding melakukan diff per blok.

---

## 6. Alur penilaian tugas

Satu konfigurasi, dua peran:

```
Admin (CMS)
  POST /cms/assignments
  { lessonId, title, brief, maxPoints, rubric[], dueAt }
        │
        ├──────────────► Siswa: GET /enrollments/me/assignments
        │                 melihat instruksi + rubrik + tenggat
        │                 POST /enrollments/assignments/:id/submit
        │                       └─ status: SUBMITTED
        │
        └──────────────► Mentor: GET /instructor/submissions?status=SUBMITTED
                          menilai dengan rubrik yang sama
                          PATCH /instructor/submissions/:id/grade
                            ├─ returnForRevision=false → GRADED
                            └─ returnForRevision=true  → RETURNED (siswa revisi)
                          └─ Notification dibuat untuk siswa
```

Percobaan ulang: submission yang **belum** dinilai akan ditimpa; yang **sudah**
dinilai memicu pembuatan percobaan baru (`attempt + 1`) sehingga riwayat
penilaian tidak hilang.

---

## 7. Alur pembayaran

```
POST /payments/checkout
  ├─ ambil harga dari tabel Course (bukan dari klien)
  ├─ validasi kupon: aktif? kuota? tanggal? minimum belanja? sudah dipakai?
  ├─ hitung: subtotal − diskon + PPN (persentase dari SiteSetting)
  └─ buat Payment (PENDING) + OrderItem dengan snapshot judul & harga

POST /payments/webhook/midtrans   (Public)
  ├─ abaikan bila status transaksi bukan settlement/capture/success
  ├─ idempoten: invoice yang sudah PAID langsung dikembalikan apa adanya
  ├─ transaksi DB: Payment → PAID, Coupon.usedCount + 1
  └─ setelah commit: buat Enrollment + Notification
```

Enrollment sengaja dibuat **setelah** transaksi commit agar lock database tidak
ditahan selama operasi tambahan.

---

## 8. Statistik denormalisasi

`Course.rating`, `reviewCount`, `studentCount`, dan `lessonCount` disimpan
sebagai kolom biasa. Katalog memuat 12–100 kursus sekaligus; menghitung agregat
per baris akan lambat.

Konsekuensinya nilai bisa melenceng. Penyelarasan dilakukan lewat
`POST /courses/:id/refresh-stats`, yang menghitung ulang dari sumber aslinya.
Untuk produksi, panggil ini dari job terjadwal (`@nestjs/schedule`) atau setelah
peristiwa yang relevan.

---

## 9. Penanganan error

`AllExceptionsFilter` menyeragamkan seluruh error:

```json
{
  "statusCode": 409,
  "message": "Data dengan email sudah ada",
  "error": "Conflict",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-07-27T04:00:00.000Z"
}
```

Pemetaan error Prisma: `P2002` → 409 Conflict · `P2025` → 404 Not Found ·
`P2003` → 400 Bad Request. Error 5xx dicatat lengkap ke log; klien hanya
menerima pesan generik.

---

## 10. Arsitektur Tiga-Aplikasi (api + web + marketing)

### Gambaran umum

```
testcraft/ (monorepo)
├── apps/
│   ├── api/        NestJS — REST API, autentikasi, bisnis, database
│   ├── web/        Next.js 14 — LMS portal (siswa, instruktur, admin)
│   └── marketing/  Next.js 14 — Situs pemasaran publik (port 3001)
└── packages/
    └── shared/     Enum & DTO yang dipakai bersama
```

### Mengapa marketing dan LMS dipisahkan menjadi dua aplikasi Next.js?

**1. Kadence deployment yang berbeda**

Marketing perlu di-update sesering kampanye berubah (harga, program baru, promo)
tanpa harus menyentuh atau me-redeploy LMS portal. Pemisahan ini memungkinkan
pipeline CI/CD yang independen — marketing berubah tanpa risiko downtime untuk
siswa yang sedang belajar.

**2. Kebutuhan SEO yang berbeda**

Marketing adalah permukaan publik yang membutuhkan:
- Server-Side Rendering (SSR) untuk landing page agar dapat di-crawl sempurna
- Metadata OpenGraph & Twitter Card yang dikontrol ketat
- Sitemap, structured data (JSON-LD), dan canonical URL untuk pencarian organik
- Output `standalone` yang bisa di-host di CDN edge (Vercel, Cloudflare Pages)

LMS portal sebaliknya adalah aplikasi yang dilindungi autentikasi — halaman-
halamannya tidak perlu (dan tidak boleh) di-index mesin pencari.

**3. Marketing dapat di-host di CDN; LMS butuh server dengan auth**

Karena `apps/marketing` tidak perlu session atau cookie auth, ia dapat dikompilasi
sebagai static/standalone output dan didistribusikan ke CDN global dengan latency
rendah. `apps/web` (LMS) harus berjalan di server Node karena melakukan fetch
server-side ke API dengan token.

**4. Bundle & dependency berbeda**

Marketing hanya membutuhkan Tailwind + beberapa komponen presentasional.
LMS membutuhkan state management, WebSocket untuk notifikasi, React Query, rich
text editor, dan banyak lagi. Memisahkan keduanya menjaga bundle marketing tetap
kecil dan cepat.

### Port mapping

| App | Port lokal | Port container |
|---|---|---|
| api | 4001 | 4001 |
| web (LMS) | 3000 | 3000 |
| marketing | 3001 | 3001 |

### Shared packages

`packages/shared` tetap menjadi satu-satunya sumber kebenaran untuk enum dan DTO.
`apps/marketing` saat ini tidak mengonsumsi shared (halaman statis), tetapi
struktur workspace memungkinkan ekspansi di masa depan (misalnya jika marketing
membutuhkan tipe `CoursePreview` untuk menampilkan program dari API).

---

## 11. Batas yang diketahui

Hal-hal yang sengaja belum dikerjakan, beserta tempat memulainya:

| Belum ada | Mulai dari |
|---|---|
| Google OAuth (tombolnya sudah ada) | `apps/api/src/modules/auth/` — tambah `GoogleStrategy` |
| Unggah media ke S3/R2 | `apps/api/src/modules/cms/` — endpoint `POST /cms/media` |
| Pemutar video sungguhan | `apps/web/src/app/learn/[slug]/page.tsx` — ganti placeholder dengan Cloudflare Stream |
| Generasi PDF sertifikat | Modul `certificates` — isi `pdfUrl` saat penerbitan |
| Verifikasi signature webhook | `PaymentsController.midtransWebhook()` |
| Pengiriman email (Resend) | Buat `MailModule`, panggil dari auth & payments |
| Job terjadwal refresh statistik | `@nestjs/schedule` sudah terpasang sebagai dependensi |
