# Panduan Pengguna TestCraft Indonesia

## URL Akses

| Aplikasi | URL Lokal | URL Produksi |
|---|---|---|
| Marketing Site | http://localhost:3001 | https://testcraft.id |
| LMS Portal | http://localhost:3000 | https://app.testcraft.id |
| REST API | http://localhost:4001 | https://api.testcraft.id |
| API Docs | http://localhost:4001/docs | https://api.testcraft.id/docs |

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

Login ke `http://localhost:3000/login` lalu:

1. **Dashboard** → lihat kelas yang diikuti, XP, streak belajar, dan sertifikat
2. **Katalog** (`/catalog`) → browse semua kursus yang tersedia, filter by kategori
3. **Enroll Kelas** → buka detail kursus → klik "Daftar Sekarang"
4. **Belajar** → klik kelas dari dashboard → tonton video/baca materi per lesson
5. **Kuis** → selesaikan kuis di setiap modul untuk dapat XP
6. **Sertifikat** (`/dashboard/certificates`) → download sertifikat setelah kelas 100% selesai
7. **Verifikasi Sertifikat** (`/verify`) → masukkan nomor sertifikat untuk verifikasi publik

---

### 👨‍🏫 Instructor (Mentor)

Login ke `http://localhost:3000/login` lalu akses menu Instructor:

1. **Overview** (`/instructor`) → lihat statistik kursus, rating, dan pendapatan
2. **Kursus Saya** (`/instructor/courses`) → daftar kursus yang dibuat
3. **Buat Kursus Baru** → dari halaman Kursus, klik "Buat Kursus" → isi judul, deskripsi, harga, dan upload thumbnail
4. **Tambah Konten** (`/instructor/content`) → tambah modul dan lesson (video/teks/kuis) ke kursus
5. **Nilai Tugas** (`/instructor/grading`) → review dan beri nilai submission tugas dari murid
6. **Feedback** (`/instructor/feedback`) → lihat rating dan ulasan murid per kursus
7. **Sertifikat** (`/instructor/certificates`) → lihat sertifikat yang diterbitkan untuk kursus Anda
8. **Payouts** (`/instructor/payouts`) → lihat riwayat pembayaran royalti

---

### 🛡️ Admin / Super Admin

Login ke `http://localhost:3000/login` dengan akun admin, lalu:

#### Dashboard Admin (`/admin`)
Lihat statistik keseluruhan: revenue, jumlah murid, instruktur, kursus aktif, sertifikat terbit, dan leads.

#### Manajemen Konten
| Menu | URL | Fungsi |
|---|---|---|
| Kursus | `/admin/courses` | Approve, edit, publish/unpublish kursus |
| Kategori | `/admin/categories` | Tambah/edit kategori kursus |
| Users | `/admin/users` | Lihat dan kelola semua akun |
| Instruktur | via `/admin/users` | Set role, aktif/nonaktifkan akun |

#### CMS Homepage (`/admin/pages`)
Editor blok untuk mengatur konten halaman publik LMS tanpa coding:

1. Buka `/admin/pages` → pilih halaman (misal: "home")
2. Klik halaman → masuk ke block editor
3. **Tambah Blok** → pilih tipe:
   - `HERO` → banner utama dengan judul & CTA button
   - `STATS` → angka statistik (murid, kursus, dll)
   - `COURSE_GRID` → grid kursus unggulan
   - `LEARNING_PATHS` → jalur belajar
   - `TESTIMONIALS` → ulasan murid
   - `FAQ` → pertanyaan umum
   - `PRICING_TABLE` → tabel paket harga
   - `CTA` → call-to-action section
   - `RICH_TEXT` → teks bebas dengan format HTML
4. Drag & drop untuk urutkan blok
5. Klik **Simpan** → perubahan langsung tampil di halaman publik

#### Manajemen Bisnis
| Menu | URL | Fungsi |
|---|---|---|
| Pembayaran | `/admin/payments` | Monitor transaksi, konfirmasi manual |
| Pricing | `/admin/pricing` | Atur paket berlangganan |
| Leads | `/admin/leads` | CRM: leads dari form corporate |
| Coupons | `/admin/coupons` | Buat kode diskon |
| Testimonials | `/admin/testimonials` | Approve/edit testimonial |
| FAQs | `/admin/faqs` | Kelola FAQ publik |
| Banners | `/admin/banners` | Promo banner di atas halaman |
| Settings | `/admin/settings` | Konfigurasi umum (nama platform, WhatsApp, dll) |
| Assignments | `/admin/assignments` | Lihat semua submission tugas |

---

## Cara Mulai Cepat (Fresh Install)

```bash
# 1. Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# → Isi DATABASE_URL, JWT_SECRET di apps/api/.env

# 2. Install dependencies
npm install

# 3. Jalankan database
docker compose up -d

# 4. Migrate & seed database
npm run db:migrate
npm run db:seed

# 5. Jalankan semua aplikasi
npm run dev
# → LMS: http://localhost:3000
# → Marketing: http://localhost:3001
# → API: http://localhost:4001
```

---

## Verifikasi Sertifikat (Publik)

Siapa pun (termasuk rekruter/HRD) bisa verifikasi sertifikat tanpa login:

1. Buka `http://localhost:3000/verify`
2. Masukkan nomor sertifikat (format: `TC-YYYY-XXXXX`)
3. Klik **Verify** → muncul detail sertifikat
4. Klik **Download PDF** untuk simpan sebagai file

Contoh nomor valid: `TC-2026-08421`
