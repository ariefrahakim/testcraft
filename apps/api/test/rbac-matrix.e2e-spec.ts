import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * Matriks akses per peran, ditulis sebagai tabel supaya kebijakan aksesnya
 * bisa dibaca sekali lihat — dan supaya endpoint baru yang lupa diberi
 * @Roles() langsung ketahuan.
 *
 * Aturannya: siswa hanya menyentuh datanya sendiri, mentor hanya kelas yang
 * ia ampu, admin boleh semuanya.
 */
describe('Matriks akses per peran (e2e)', () => {
  let app: INestApplication;
  const token: Record<string, string> = {};

  beforeAll(async () => {
    app = await createTestApp();
    const login = async (creds: { email: string; password: string }) =>
      (await request(app.getHttpServer()).post(api('/auth/login')).send(creds)).body
        .tokens.accessToken as string;

    token.student = await login(CREDENTIALS.student);
    token.instructor = await login(CREDENTIALS.instructor);
    token.admin = await login(CREDENTIALS.admin);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  const OK = 200;
  const FORBIDDEN = 403;
  const UNAUTHORIZED = 401;

  /**
   * [metode, path, harapan per peran]
   * `anon` = tanpa token sama sekali.
   */
  const MATRIX: Array<{
    label: string;
    path: string;
    anon: number;
    student: number;
    instructor: number;
    admin: number;
  }> = [
    // Publik — siapa pun boleh
    { label: 'health', path: '/health', anon: OK, student: OK, instructor: OK, admin: OK },
    { label: 'katalog', path: '/courses', anon: OK, student: OK, instructor: OK, admin: OK },
    { label: 'kategori', path: '/categories', anon: OK, student: OK, instructor: OK, admin: OK },
    { label: 'jalur belajar', path: '/learning-paths', anon: OK, student: OK, instructor: OK, admin: OK },
    { label: 'instruktur', path: '/instructors', anon: OK, student: OK, instructor: OK, admin: OK },
    { label: 'konten publik', path: '/content/settings', anon: OK, student: OK, instructor: OK, admin: OK },

    // Milik sendiri — butuh login, peran apa pun
    { label: 'profil saya', path: '/auth/me', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },
    { label: 'kelas saya', path: '/enrollments/me', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },
    { label: 'tugas saya', path: '/enrollments/me/assignments', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },
    { label: 'sertifikat saya', path: '/certificates/me', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },
    { label: 'pembayaran saya', path: '/payments/me', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },
    { label: 'notifikasi saya', path: '/notifications', anon: UNAUTHORIZED, student: OK, instructor: OK, admin: OK },

    // Ruang mentor — siswa dilarang
    { label: 'kelas mentor', path: '/instructor/courses', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: OK, admin: OK },
    { label: 'antrian penilaian', path: '/instructor/submissions', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: OK, admin: OK },
    { label: 'ringkasan penilaian', path: '/instructor/submissions/pending-summary', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: OK, admin: OK },
    { label: 'pendapatan mentor', path: '/instructor/payouts', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: OK, admin: OK },

    // Admin saja — mentor pun dilarang
    { label: 'pengaturan CMS', path: '/cms/settings', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'halaman CMS', path: '/cms/pages', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'kupon', path: '/cms/coupons', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'paket harga', path: '/cms/pricing-plans', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'banner', path: '/cms/banners', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'testimoni', path: '/cms/testimonials', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'FAQ admin', path: '/cms/faqs', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'media', path: '/cms/media', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'tugas CMS', path: '/cms/assignments', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'daftar pengguna', path: '/users', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'daftar lead', path: '/leads', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'semua transaksi', path: '/payments', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'analitik', path: '/analytics/overview', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
    { label: 'kursus terlaris', path: '/analytics/top-courses', anon: UNAUTHORIZED, student: FORBIDDEN, instructor: FORBIDDEN, admin: OK },
  ];

  describe.each(MATRIX)('$label ($path)', (row) => {
    it(`anonim → ${row.anon}`, async () => {
      await request(server()).get(api(row.path)).expect(row.anon);
    });

    it(`siswa → ${row.student}`, async () => {
      await request(server())
        .get(api(row.path))
        .set(bearer(token.student))
        .expect(row.student);
    });

    it(`mentor → ${row.instructor}`, async () => {
      await request(server())
        .get(api(row.path))
        .set(bearer(token.instructor))
        .expect(row.instructor);
    });

    it(`admin → ${row.admin}`, async () => {
      await request(server())
        .get(api(row.path))
        .set(bearer(token.admin))
        .expect(row.admin);
    });
  });

  describe('Operasi tulis juga terkunci', () => {
    it('siswa tidak bisa mengubah harga kursus', async () => {
      const list = await request(server()).get(api('/courses?limit=1'));
      await request(server())
        .patch(api(`/courses/${list.body.data[0].id}/pricing`))
        .set(bearer(token.student))
        .send({ priceIDR: 1, priceUSD: 1 })
        .expect(FORBIDDEN);
    });

    it('mentor tidak bisa mengubah harga kursus', async () => {
      const list = await request(server()).get(api('/courses?limit=1'));
      await request(server())
        .patch(api(`/courses/${list.body.data[0].id}/pricing`))
        .set(bearer(token.instructor))
        .send({ priceIDR: 1, priceUSD: 1 })
        .expect(FORBIDDEN);
    });

    it('siswa tidak bisa mengubah role dirinya menjadi admin', async () => {
      const me = await request(server())
        .get(api('/auth/me'))
        .set(bearer(token.student));

      // Endpoint profil sendiri tidak menerima field role sama sekali.
      await request(server())
        .patch(api('/users/me'))
        .set(bearer(token.student))
        .send({ role: 'ADMIN' })
        .expect(400);

      // Endpoint admin menolaknya karena peran.
      await request(server())
        .patch(api(`/users/${me.body.id}`))
        .set(bearer(token.student))
        .send({ role: 'ADMIN' })
        .expect(FORBIDDEN);

      const after = await request(server())
        .get(api('/auth/me'))
        .set(bearer(token.student));
      expect(after.body.role).toBe('STUDENT');
    });

    it('mentor tidak bisa membuat kupon', async () => {
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(token.instructor))
        .send({ code: 'MENTORCURANG', discountType: 'PERCENT', value: 100 })
        .expect(FORBIDDEN);
    });

    it('mentor tidak bisa mengubah pengaturan situs', async () => {
      await request(server())
        .patch(api('/cms/settings'))
        .set(bearer(token.instructor))
        .send({ taxPercent: 0 })
        .expect(FORBIDDEN);
    });

    it('siswa tidak bisa menandai invoice lunas', async () => {
      await request(server())
        .post(api('/payments/simulate-paid'))
        .set(bearer(token.student))
        .send({ invoiceNo: 'INV-2026-000001' })
        .expect(FORBIDDEN);
    });
  });
});
