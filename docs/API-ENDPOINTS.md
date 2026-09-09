# Referensi API TestCraft LMS

Spesifikasi lengkap: [`openapi.json`](openapi.json) · UI interaktif: <http://localhost:4001/docs>

Base URL lokal: `http://localhost:4001/api/v1`

Autentikasi: `Authorization: Bearer <accessToken>` kecuali endpoint bertanda publik.

---

## Analytics

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/analytics/overview` | Ringkasan KPI untuk dashboard admin |
| `GET` | `/analytics/revenue-by-month` | Pendapatan 12 bulan terakhir |
| `GET` | `/analytics/top-courses` | 10 kursus dengan peserta terbanyak |

## Auth

| Metode | Path | Keterangan |
|---|---|---|
| `POST` | `/auth/login` | Login dengan email & password |
| `POST` | `/auth/logout` | Cabut refresh token (satu sesi atau semua sesi) |
| `GET` | `/auth/me` | Profil user yang sedang login |
| `POST` | `/auth/refresh` | Tukar refresh token dengan access token baru |
| `POST` | `/auth/register` | Daftar akun student baru |

## CMS (Admin)

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/cms/assignments` | Daftar tugas beserta statistik penilaiannya |
| `POST` | `/cms/assignments` | Buat tugas baru pada sebuah lesson |
| `GET` | `/cms/assignments/available-lessons` | Lesson yang belum memiliki tugas |
| `PATCH` | `/cms/assignments/{id}` | Perbarui instruksi, rubrik, poin, atau tenggat tugas |
| `DELETE` | `/cms/assignments/{id}` | Hapus tugas beserta seluruh submission-nya |
| `GET` | `/cms/banners` | Daftar banner/pengumuman |
| `POST` | `/cms/banners` | Buat banner |
| `PATCH` | `/cms/banners/{id}` | Perbarui banner |
| `DELETE` | `/cms/banners/{id}` | Hapus banner |
| `GET` | `/cms/coupons` | Daftar kupon diskon |
| `POST` | `/cms/coupons` | Buat kupon |
| `PATCH` | `/cms/coupons/{id}` | Perbarui kupon |
| `DELETE` | `/cms/coupons/{id}` | Hapus kupon |
| `GET` | `/cms/faqs` | Daftar FAQ |
| `POST` | `/cms/faqs` | Tambah FAQ |
| `PATCH` | `/cms/faqs/{id}` | Perbarui FAQ |
| `DELETE` | `/cms/faqs/{id}` | Hapus FAQ |
| `GET` | `/cms/media` | Daftar media yang diunggah |
| `GET` | `/cms/navigation` | Daftar item menu |
| `POST` | `/cms/navigation` | Tambah item menu |
| `PATCH` | `/cms/navigation/{id}` | Perbarui item menu |
| `DELETE` | `/cms/navigation/{id}` | Hapus item menu |
| `GET` | `/cms/pages` | Daftar halaman CMS |
| `POST` | `/cms/pages` | Buat halaman baru |
| `PATCH` | `/cms/pages/{id}` | Perbarui halaman |
| `DELETE` | `/cms/pages/{id}` | Hapus halaman |
| `POST` | `/cms/pages/{id}/publish` | Terbitkan halaman |
| `GET` | `/cms/pages/{slug}` | Detail halaman beserta blok konten (termasuk draft) |
| `GET` | `/cms/pricing-plans` | Daftar paket harga (bundle/langganan) |
| `POST` | `/cms/pricing-plans` | Buat paket harga |
| `PATCH` | `/cms/pricing-plans/{id}` | Perbarui paket harga |
| `DELETE` | `/cms/pricing-plans/{id}` | Hapus paket harga |
| `GET` | `/cms/settings` | Ambil pengaturan situs (brand, kurs, pajak, dll.) |
| `PATCH` | `/cms/settings` | Perbarui pengaturan situs |
| `GET` | `/cms/testimonials` | Daftar testimoni |
| `POST` | `/cms/testimonials` | Tambah testimoni |
| `PATCH` | `/cms/testimonials/{id}` | Perbarui testimoni |
| `DELETE` | `/cms/testimonials/{id}` | Hapus testimoni |

## Categories

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/categories` | Daftar kategori beserta jumlah kursus terbit |
| `POST` | `/categories` | Tambah kategori |
| `PATCH` | `/categories/{id}` | Perbarui kategori |
| `DELETE` | `/categories/{id}` | Hapus kategori (gagal bila masih dipakai kursus) |

## Certificates

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/certificates/me` | Sertifikat milik saya |
| `GET` | `/certificates/verify` | Verifikasi keaslian sertifikat (publik) |
| `GET` | `/certificates/verify/{number}` | Verifikasi sertifikat lewat path (publik) |

## Content (Public)

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/content/banners` | Banner aktif pada rentang tanggal saat ini |
| `GET` | `/content/faqs` | FAQ yang terbit |
| `GET` | `/content/navigation` | Item menu yang terlihat |
| `GET` | `/content/pages/{slug}` | Halaman terbit beserta blok kontennya |
| `GET` | `/content/pricing-plans` | Paket harga aktif |
| `GET` | `/content/settings` | Pengaturan situs untuk render brand & kurs |
| `GET` | `/content/testimonials` | Testimoni (opsional hanya yang unggulan) |

## Courses

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/courses` | Daftar kursus (katalog publik) |
| `POST` | `/courses` | Buat kursus baru |
| `PATCH` | `/courses/pricing/bulk` | Ubah harga banyak kursus sekaligus (transaksional) |
| `PATCH` | `/courses/{id}` | Perbarui kursus |
| `DELETE` | `/courses/{id}` | Arsipkan kursus |
| `PATCH` | `/courses/{id}/pricing` | Ubah harga satu kursus |
| `POST` | `/courses/{id}/refresh-stats` | Hitung ulang rating / jumlah siswa / jumlah lesson |
| `GET` | `/courses/{slug}` | Detail kursus beserta kurikulum |

## Enrollments

| Metode | Path | Keterangan |
|---|---|---|
| `POST` | `/enrollments` | Daftar ke sebuah kursus |
| `POST` | `/enrollments/assignments/{assignmentId}/submit` | Kirim jawaban tugas |
| `POST` | `/enrollments/lessons/{lessonId}/progress` | Simpan progres belajar sebuah lesson |
| `GET` | `/enrollments/me` | Kursus yang saya ikuti beserta progres |
| `GET` | `/enrollments/me/assignments` | Tugas dari semua kursus saya beserta status penilaiannya |

## Health

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/health` | Liveness & readiness probe (termasuk cek koneksi DB) |

## Instructor Workspace

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/instructor/courses` | Kursus yang saya ampu |
| `GET` | `/instructor/payouts` | Ringkasan pendapatan dari penjualan kursus saya |
| `GET` | `/instructor/submissions` | Antrian penilaian tugas |
| `GET` | `/instructor/submissions/pending-summary` | Ringkasan tugas yang belum dinilai per assignment |
| `PATCH` | `/instructor/submissions/{id}/grade` | Beri nilai & umpan balik pada sebuah submission |

## Instructors

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/instructors` | Daftar instruktur |

## Leads

| Metode | Path | Keterangan |
|---|---|---|
| `POST` | `/leads` | Kirim data calon peserta dari form landing page |
| `GET` | `/leads` | Daftar leads (admin) |
| `PATCH` | `/leads/{id}` | Tandai lead sudah ditindaklanjuti |

## Learning Paths

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/learning-paths` | Daftar jalur belajar beserta urutan kursusnya |
| `GET` | `/learning-paths/{slug}` | Detail satu jalur belajar |

## Notifications

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/notifications` | 50 notifikasi terbaru milik saya |
| `PATCH` | `/notifications/read-all` | Tandai semua notifikasi sudah dibaca |
| `PATCH` | `/notifications/{id}/read` | Tandai satu notifikasi sudah dibaca |

## Payments

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/payments` | Semua transaksi (admin) |
| `POST` | `/payments/checkout` | Buat invoice pembelian kursus |
| `GET` | `/payments/me` | Riwayat pembayaran saya |
| `POST` | `/payments/simulate-paid` | Tandai invoice lunas (khusus development/QA) |
| `POST` | `/payments/webhook/midtrans` | Webhook notifikasi Midtrans |

## Users

| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/users` | Daftar pengguna (admin) |
| `PATCH` | `/users/me` | Perbarui profil sendiri |
| `PATCH` | `/users/{id}` | Ubah role / status aktif pengguna (admin) |
