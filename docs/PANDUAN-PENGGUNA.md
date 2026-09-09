# Panduan Pengguna TestCraft Indonesia

## URL Akses

| Aplikasi | URL Lokal | URL Produksi |
|---|---|---|
| Marketing Site | http://localhost:3001 | https://testcraft.id |
| LMS Portal | http://localhost:3000 | https://app.testcraft.id |
| REST API | http://localhost:4001 | https://api.testcraft.id |
| API Docs (Swagger) | http://localhost:4001/docs | https://api.testcraft.id/docs |

---

## Akun Demo (Setelah `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| **Super Admin** | admin@testcraft.id | Admin#12345 |
| **Student** | student@testcraft.id | Student#123 |
| **Instructor** | budi.santoso@testcraft.id | Instructor#123 |
| **Instructor** | sari.wulandari@testcraft.id | Instructor#123 |

---

## Panduan per Role

### 👤 Student (Murid)

Login ke `/login` lalu:

1. **Dashboard** → lihat kelas aktif, XP, streak belajar, dan sertifikat
2. **Katalog** (`/catalog`) → browse semua kursus, filter by kategori/level
3. **Enroll Kelas Gratis** → buka detail kursus → klik "Daftar Sekarang" (langsung masuk)
4. **Beli Kelas Berbayar** → klik "Beli Sekarang" → proses pembayaran → otomatis dapat akses setelah konfirmasi
5. **Belajar** (`/learn/[slug]`) → tonton video, baca materi, kerjakan kuis per lesson
6. **Tugas** (`/dashboard/assignments`) → lihat dan submit tugas dari semua kursus
7. **Sertifikat** (`/dashboard/certificates`) → tersedia setelah progress kursus 100%
8. **Verifikasi Sertifikat** (`/verify`) → publik, bisa dicek siapa saja tanpa login

---

### 👨‍🏫 Instructor (Mentor)

Login ke `/login` lalu akses menu Instructor:

1. **Overview** (`/instructor`) → statistik kursus, rating, dan pendapatan
2. **Kursus Saya** (`/instructor/courses`) → daftar kursus yang dibuat
3. **Buat Kursus** → isi judul, slug, deskripsi, harga (isi `0` untuk gratis), kategori, dan icon
4. **Tambah Konten** (`/instructor/content`) → tambah modul & lesson (video URL / teks / kuis) per kursus
5. **Nilai Tugas** (`/instructor/grading`) → review dan beri nilai submission murid
6. **Feedback** (`/instructor/feedback`) → lihat rating dan ulasan per kursus
7. **Sertifikat** (`/instructor/certificates`) → sertifikat yang terbit dari kursus Anda
8. **Payouts** (`/instructor/payouts`) → riwayat pembayaran royalti

---

### 🛡️ Admin / Super Admin

Login ke `/login` → akses otomatis ke `/admin`.

#### Dashboard Admin (`/admin`)
Statistik real-time: revenue 30 hari, total revenue, jumlah murid, instruktur, kursus publish, sertifikat, dan leads.

#### Manajemen Kursus (`/admin/courses`)
- Lihat semua kursus dari semua instruktur
- **Publish / Unpublish** kursus
- Edit harga, kategori, dan status kursus
- Hapus kursus yang melanggar kebijakan

#### Manajemen Users (`/admin/users`)
- Lihat semua akun (student, instructor, admin)
- Aktif / nonaktifkan akun
- Ganti role pengguna

#### Manajemen Pembayaran (`/admin/payments`)
- Monitor semua transaksi
- **Konfirmasi pembayaran manual** (untuk transfer bank)
- Setelah dikonfirmasi → sistem otomatis memberikan akses kursus ke murid

#### Manajemen Lainnya
| Menu | URL | Fungsi |
|---|---|---|
| Pricing | `/admin/pricing` | Paket berlangganan |
| Leads | `/admin/leads` | CRM dari form corporate |
| Coupons | `/admin/coupons` | Kode diskon |
| Kategorii | `/admin/categories` | Kategori kursus |
| Testimonials | `/admin/testimonials` | Approve/edit testimonial |
| FAQs | `/admin/faqs` | FAQ publik |
| Banners | `/admin/banners` | Promo banner |
| Settings | `/admin/settings` | Konfigurasi platform (nama, WhatsApp, dll) |
| Assignments | `/admin/assignments` | Semua submission tugas |

---

## CMS: Update Konten LMS Homepage

CMS tersedia di `/admin/pages` untuk mengatur tampilan halaman publik LMS **tanpa coding**.

### Cara Pakai Block Editor

1. Buka `http://localhost:3000/admin/pages`
2. Pilih halaman (misal: `home`)
3. Klik nama halaman → masuk ke **Block Editor**
4. Klik **"+ Tambah Blok"** → pilih tipe blok:

| Tipe Blok | Fungsi |
|---|---|
| `HERO` | Banner utama: judul, subjudul, dan tombol CTA |
| `STATS` | Angka-angka kunci (murid terdaftar, kursus, instruktur) |
| `COURSE_GRID` | Grid kursus unggulan / terbaru |
| `LEARNING_PATHS` | Jalur belajar (Junior QA → Senior QA → Lead) |
| `TESTIMONIALS` | Ulasan dan foto alumni |
| `FAQ` | Pertanyaan yang sering ditanyakan |
| `PRICING_TABLE` | Tabel paket harga berlangganan |
| `CTA` | Section ajakan bertindak (misal: "Daftar Sekarang") |
| `RICH_TEXT` | Teks bebas dengan format HTML |

5. Edit konten tiap blok → klik **Simpan**
6. Perubahan langsung tampil di halaman publik LMS

> **Catatan:** Marketing site (`localhost:3001`) menggunakan komponen hardcoded (bukan CMS). Untuk mengubah konten marketing site (hero, program, testimonial, dll) perlu edit file kode di `apps/marketing/src/components/marketing/`.

---

## Case: Student Masuk Bootcamp & Dapat Akses Kelas

Ini adalah alur yang paling umum di corporate training / bootcamp.

### ✅ Alur yang Sudah Tersedia

#### A. Student Enroll Sendiri (Kelas Gratis)
1. Admin / Instruktur buat kursus dengan harga `0` atau centang "Gratis"
2. Publish kursus
3. Student login → buka katalog → klik kursus → klik **"Daftar Sekarang"**
4. Akses langsung tanpa pembayaran

#### B. Student Beli Kelas (Kelas Berbayar)
1. Student buka detail kursus → klik **"Beli Sekarang"**
2. Upload bukti transfer (atau bayar online)
3. Admin masuk ke `/admin/payments` → klik **Konfirmasi**
4. Sistem otomatis enroll student ke kursus

#### C. Admin Berikan Akses Manual via API (Bootcamp / Corporate)
Untuk kasus bootcamp di mana admin ingin langsung memasukkan murid tanpa proses bayar:

1. Buka `http://localhost:4001/docs` (Swagger API)
2. Login sebagai admin → klik **Authorize** → masukkan Bearer token
3. Panggil endpoint: `POST /enrollments`
   ```json
   {
     "courseId": "ID_KURSUS",
     "userId": "ID_STUDENT"
   }
   ```
4. Student langsung mendapat akses kursus

> **Atau lebih mudah:** Set harga kursus = 0, bagikan link kursus ke murid, mereka enroll sendiri.

### ⚠️ Fitur yang Belum Ada (Gap)

| Fitur | Status | Alternatif Saat Ini |
|---|---|---|
| Admin enroll student langsung dari UI admin | ❌ Belum ada | Gunakan Swagger API atau set kursus gratis |
| Bulk enroll (upload CSV murid) | ❌ Belum ada | Enroll satu per satu via API |
| Kode akses / voucher per bootcamp | ❌ Belum ada | Gunakan coupon untuk diskon 100% |
| Dashboard progres per grup/batch | ❌ Belum ada | Gunakan corporate dashboard instruktur |

> Fitur-fitur ini bisa dibangun sebagai fase berikutnya.

---

## CMS Marketing Site

Marketing site **tidak menggunakan CMS** — kontennya hardcoded di komponen React.

| Bagian | File yang Diedit |
|---|---|
| Hero (banner utama) | `apps/marketing/src/components/marketing/hero.tsx` |
| Program / Kursus | `apps/marketing/src/components/marketing/programs-grid.tsx` |
| Testimoni | `apps/marketing/src/components/marketing/testimonials.tsx` |
| FAQ | `apps/marketing/src/components/marketing/faq.tsx` |
| Statistik | `apps/marketing/src/components/marketing/stats-bar.tsx` |
| Navbar & CTA | `apps/marketing/src/components/marketing/navbar.tsx` |
| Footer | `apps/marketing/src/components/marketing/marketing-footer.tsx` |

Setelah edit file → jalankan `npm run build --workspace @testcraft/marketing` → restart server.

---

## Cara Mulai Cepat (Fresh Install)

```bash
# 1. Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# → Wajib isi: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET di apps/api/.env

# 2. Install dependencies
npm install

# 3. Jalankan database
docker compose up -d

# 4. Migrate & seed database
npm run db:migrate
npm run db:seed

# 5. Jalankan semua aplikasi (dev mode)
npm run dev
# LMS    → http://localhost:3000
# Marketing → http://localhost:3001
# API    → http://localhost:4001
```

---

## Verifikasi Sertifikat (Publik, Tanpa Login)

1. Buka `http://localhost:3000/verify`
2. Masukkan nomor sertifikat (format: `TC-YYYY-XXXXX`)
3. Klik **Verify** → tampil detail sertifikat
4. Klik **Download PDF** → simpan sebagai file PDF

Contoh nomor valid untuk testing: `TC-2026-08421`
