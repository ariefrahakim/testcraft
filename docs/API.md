# Dokumentasi API TestCraft LMS

REST API untuk seluruh fungsi LMS: autentikasi, katalog, pembelajaran,
penilaian, pembayaran, dan CMS.

| Bentuk | Lokasi |
|---|---|
| UI interaktif (Swagger) | <http://localhost:4001/docs> |
| Spesifikasi OpenAPI 3 | [`openapi.json`](openapi.json) |
| Daftar seluruh endpoint | [`API-ENDPOINTS.md`](API-ENDPOINTS.md) |

Regenerate setelah menambah/mengubah endpoint:

```bash
npm run docs:openapi
```

---

## Dasar

- **Base URL:** `http://localhost:4001/api/v1` (produksi: `https://api.testcraft.id/api/v1`)
- **Format:** JSON di request dan response
- **Rate limit:** 120 request per menit per IP
- **Versi:** prefiks `/api/v1`; perubahan yang memutus kompatibilitas akan memakai `/api/v2`

---

## Autentikasi

```bash
# 1. Login
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@testcraft.id","password":"Admin#12345"}'
```

```json
{
  "user": { "id": "cms2…", "email": "admin@testcraft.id", "role": "SUPER_ADMIN", "…": "…" },
  "tokens": {
    "accessToken": "eyJhbGciOi…",
    "refreshToken": "eyJhbGciOi…",
    "expiresIn": 900
  }
}
```

```bash
# 2. Pakai access token
curl http://localhost:4001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Perbarui saat kedaluwarsa (refresh token dirotasi — yang lama langsung dicabut)
curl -X POST http://localhost:4001/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

Masa berlaku: access token **15 menit**, refresh token **30 hari**.

---

## Paginasi

Semua endpoint daftar menerima `?page=1&limit=20&q=kata-kunci` dan
mengembalikan bentuk yang sama:

```json
{
  "data": [ … ],
  "meta": {
    "page": 1, "limit": 20, "total": 137,
    "totalPages": 7, "hasNext": true, "hasPrev": false
  }
}
```

`limit` maksimum 100.

---

## Format error

```json
{
  "statusCode": 400,
  "message": ["email harus berupa alamat email yang valid"],
  "error": "Bad Request",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-07-27T04:00:00.000Z"
}
```

| Kode | Arti umum |
|---|---|
| 400 | Validasi gagal, atau ada query/body param yang tidak dikenal |
| 401 | Token hilang, kedaluwarsa, atau akun nonaktif |
| 403 | Role tidak berwenang, atau bukan pemilik data |
| 404 | Data tidak ditemukan |
| 409 | Bentrok data unik (mis. email atau slug sudah dipakai) |
| 429 | Melebihi rate limit |

> **Catatan penting:** validasi memakai `forbidNonWhitelisted`. Mengirim
> parameter yang tidak dideklarasikan di DTO akan ditolak 400 dengan pesan
> `property xxx should not exist`. Ini disengaja agar tidak ada parameter siluman.

---

## Alur umum

### Siswa membeli dan mengikuti kelas

```bash
# Checkout — harga dihitung ulang di server
curl -X POST $API/payments/checkout -H "Authorization: Bearer $T" \
  -H 'Content-Type: application/json' \
  -d '{"courseIds":["<courseId>"],"couponCode":"MERDEKA50"}'

# Gateway memanggil webhook saat lunas → enrollment dibuat otomatis
curl -X POST $API/payments/webhook/midtrans -H 'Content-Type: application/json' \
  -d '{"invoiceNo":"INV-2026-000001","transactionStatus":"settlement"}'

# Belajar
curl $API/enrollments/me -H "Authorization: Bearer $T"
curl -X POST $API/enrollments/lessons/<lessonId>/progress \
  -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
  -d '{"completed":true}'
```

### Tugas: admin → siswa → mentor

```bash
# Admin membuat tugas beserta rubrik
curl -X POST $API/cms/assignments -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{
    "lessonId":"<lessonId>",
    "title":"Proyek Akhir",
    "brief":"Bangun framework automation lengkap dengan CI.",
    "maxPoints":100,
    "rubric":[{"criterion":"Struktur","points":40},{"criterion":"Coverage","points":60}],
    "dueAt":"2026-08-05T00:00:00.000Z"
  }'

# Siswa mengirim jawaban
curl -X POST $API/enrollments/assignments/<id>/submit \
  -H "Authorization: Bearer $STUDENT" -H 'Content-Type: application/json' \
  -d '{"contentHtml":"github.com/saya/proyek-akhir"}'

# Mentor melihat antrian dan menilai
curl "$API/instructor/submissions?status=SUBMITTED" -H "Authorization: Bearer $MENTOR"
curl -X PATCH $API/instructor/submissions/<id>/grade \
  -H "Authorization: Bearer $MENTOR" -H 'Content-Type: application/json' \
  -d '{"grade":88,"feedback":"Rapi. Tambahkan negative case."}'
```

### Admin mengubah harga massal

```bash
curl -X PATCH $API/courses/pricing/bulk -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{
    "items":[
      {"courseId":"<id1>","priceIDR":799000,"priceUSD":50,"compareAtIDR":1500000},
      {"courseId":"<id2>","priceIDR":999000,"priceUSD":63}
    ]
  }'
```

Seluruh item diproses dalam satu transaksi — tidak mungkin setengah tersimpan.

---

## Hak akses per kelompok endpoint

| Kelompok | Publik | Siswa | Instruktur | Admin |
|---|:--:|:--:|:--:|:--:|
| `/health`, `/content/*`, `/courses` (baca) | ✅ | ✅ | ✅ | ✅ |
| `/auth/register`, `/auth/login`, `/auth/refresh` | ✅ | ✅ | ✅ | ✅ |
| `/certificates/verify` | ✅ | ✅ | ✅ | ✅ |
| `/enrollments/*`, `/notifications`, `/payments/me` | — | ✅ | ✅ | ✅ |
| `/instructor/*` | — | — | ✅ | ✅ |
| `/cms/*`, `/users`, `/analytics/*`, `/payments` | — | — | — | ✅ |

`SUPER_ADMIN` melewati seluruh pemeriksaan role.

---

## Membuat klien API

Dari `openapi.json` Anda bisa menghasilkan SDK:

```bash
npx openapi-typescript docs/openapi.json -o src/lib/api-types.ts
# atau
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi.json -g typescript-fetch -o ./generated
```

Untuk Postman: **Import → File → `docs/openapi.json`**.
