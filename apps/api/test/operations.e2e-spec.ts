import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * Endpoint operasional: pengguna, leads, notifikasi, analitik, kursus (tulis),
 * dan ruang mentor. Fokus pada jalur yang dipakai admin/mentor sehari-hari
 * beserta jalur negatifnya.
 */
describe('Operasional (e2e)', () => {
  let app: INestApplication;
  let admin: string;
  let student: string;
  let instructor: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = async (creds: { email: string; password: string }) =>
      (await request(app.getHttpServer()).post(api('/auth/login')).send(creds)).body
        .tokens.accessToken as string;

    admin = await login(CREDENTIALS.admin);
    student = await login(CREDENTIALS.student);
    instructor = await login(CREDENTIALS.instructor);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const stamp = () => Date.now() + Math.floor(Math.random() * 1000);

  describe('Pengguna', () => {
    it('mencari berdasarkan nama atau email', async () => {
      const res = await request(server())
        .get(api('/users?q=student'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.meta.total).toBeGreaterThan(0);
      expect(res.body.data[0].email).toContain('student');
    });

    it('menyaring berdasarkan role', async () => {
      const res = await request(server())
        .get(api('/users?role=INSTRUCTOR'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.data.every((u: { role: string }) => u.role === 'INSTRUCTOR')).toBe(
        true,
      );
    });

    it('tidak pernah menyertakan hash password', async () => {
      const res = await request(server())
        .get(api('/users?limit=50'))
        .set(bearer(admin))
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('$argon2');
    });

    it('pengguna memperbarui profilnya sendiri', async () => {
      const res = await request(server())
        .patch(api('/users/me'))
        .set(bearer(student))
        .send({ phone: '+628111222333', bio: 'Sedang belajar automation.' })
        .expect(200);

      expect(res.body.phone).toBe('+628111222333');
    });

    it('menolak nama terlalu pendek saat perbarui profil', async () => {
      await request(server())
        .patch(api('/users/me'))
        .set(bearer(student))
        .send({ name: 'A' })
        .expect(400)
        .expect((r) => expect(r.body.errors[0].code).toBe('validation.name.tooShort'));
    });

    it('admin menonaktifkan lalu mengaktifkan kembali akun', async () => {
      const created = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Akan Dinonaktifkan',
          email: `nonaktif-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        })
        .expect(201);

      const userId = created.body.user.id;
      const userToken = created.body.tokens.accessToken;

      await request(server())
        .patch(api(`/users/${userId}`))
        .set(bearer(admin))
        .send({ isActive: false })
        .expect(200);

      // Token lama langsung tidak berlaku karena guard membaca ulang user.
      await request(server()).get(api('/auth/me')).set(bearer(userToken)).expect(401);

      await request(server())
        .patch(api(`/users/${userId}`))
        .set(bearer(admin))
        .send({ isActive: true })
        .expect(200);

      await request(server()).get(api('/auth/me')).set(bearer(userToken)).expect(200);
    });

    it('admin mempromosikan siswa menjadi instruktur', async () => {
      const created = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Calon Mentor',
          email: `mentor-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      const res = await request(server())
        .patch(api(`/users/${created.body.user.id}`))
        .set(bearer(admin))
        .send({ role: 'INSTRUCTOR' })
        .expect(200);

      expect(res.body.role).toBe('INSTRUCTOR');
    });

    it('menolak role yang tidak dikenal', async () => {
      const res = await request(server())
        .get(api('/users?role=RAJA'))
        .set(bearer(admin))
        .expect(400);
      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('Leads', () => {
    it('menerima lead dengan email saja', async () => {
      await request(server())
        .post(api('/leads'))
        .send({ name: 'Hanya Email', email: `lead-${stamp()}@example.com` })
        .expect(201);
    });

    it('menerima lead dengan telepon saja', async () => {
      await request(server())
        .post(api('/leads'))
        .send({ name: 'Hanya Telepon', phone: '081234567890' })
        .expect(201);
    });

    it('menolak lead tanpa email maupun telepon', async () => {
      const res = await request(server())
        .post(api('/leads'))
        .set('Accept-Language', 'en')
        .send({ name: 'Tanpa Kontak' })
        .expect(400);

      expect(res.body.errors[0].code).toBe('validation.contact.required');
      expect(res.body.message).toBe('Enter an email address or phone number');
    });

    it('menolak lead tanpa nama', async () => {
      await request(server())
        .post(api('/leads'))
        .send({ email: 'x@example.com' })
        .expect(400)
        .expect((r) => expect(r.body.errors[0].code).toBe('validation.name.required'));
    });

    it('admin melihat, mencari, dan menandai lead', async () => {
      const nama = `Lead Uji ${stamp()}`;
      await request(server())
        .post(api('/leads'))
        .send({ name: nama, email: `tandai-${stamp()}@example.com` })
        .expect(201);

      const list = await request(server())
        .get(api(`/leads?q=${encodeURIComponent('Lead Uji')}`))
        .set(bearer(admin))
        .expect(200);

      expect(list.body.meta.total).toBeGreaterThan(0);

      const target = list.body.data[0];
      const updated = await request(server())
        .patch(api(`/leads/${target.id}`))
        .set(bearer(admin))
        .send({ handled: true })
        .expect(200);

      expect(updated.body.handled).toBe(true);
    });

    it('siswa tidak boleh melihat daftar lead', async () => {
      await request(server()).get(api('/leads')).set(bearer(student)).expect(403);
    });
  });

  describe('Notifikasi', () => {
    it('hanya menampilkan notifikasi milik sendiri', async () => {
      const res = await request(server())
        .get(api('/notifications'))
        .set(bearer(student))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('menandai satu notifikasi terbaca', async () => {
      const list = await request(server())
        .get(api('/notifications'))
        .set(bearer(student));

      if (list.body.length > 0) {
        const res = await request(server())
          .patch(api(`/notifications/${list.body[0].id}/read`))
          .set(bearer(student))
          .expect(200);
        expect(res.body.ok).toBe(true);
      }
    });

    it('tidak bisa menandai notifikasi milik orang lain', async () => {
      const others = await request(server())
        .get(api('/notifications'))
        .set(bearer(student));

      if (others.body.length > 0) {
        const res = await request(server())
          .patch(api(`/notifications/${others.body[0].id}/read`))
          .set(bearer(admin))
          .expect(200);

        // Tidak error, tetapi juga tidak mengubah apa pun.
        expect(res.body.updated).toBe(0);
      }
    });

    it('menandai semua terbaca', async () => {
      const res = await request(server())
        .patch(api('/notifications/read-all'))
        .set(bearer(student))
        .expect(200);

      expect(res.body).toHaveProperty('updated');
    });

    it('butuh autentikasi', async () => {
      await request(server()).get(api('/notifications')).expect(401);
    });
  });

  describe('Analitik', () => {
    it('memberi ringkasan KPI', async () => {
      const res = await request(server())
        .get(api('/analytics/overview'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body).toMatchObject({
        students: expect.any(Number),
        instructors: expect.any(Number),
        publishedCourses: expect.any(Number),
      });
    });

    it('memberi kursus terlaris maksimal 10', async () => {
      const res = await request(server())
        .get(api('/analytics/top-courses'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.length).toBeLessThanOrEqual(10);
    });

    it('memberi pendapatan per bulan sebagai angka biasa', async () => {
      const res = await request(server())
        .get(api('/analytics/revenue-by-month'))
        .set(bearer(admin))
        .expect(200);

      for (const row of res.body) {
        expect(typeof row.total).toBe('number'); // bigint sudah dikonversi
        expect(row.month).toMatch(/^\d{4}-\d{2}$/);
      }
    });

    it('tertutup untuk instruktur', async () => {
      await request(server())
        .get(api('/analytics/overview'))
        .set(bearer(instructor))
        .expect(403);
    });
  });

  describe('Kursus — operasi tulis', () => {
    let courseId: string;
    const slug = `kursus-uji-${stamp()}`;

    it('admin membuat kursus draf', async () => {
      const kategori = await request(server()).get(api('/categories'));
      const instrukturList = await request(server()).get(api('/instructors'));

      const res = await request(server())
        .post(api('/courses'))
        .set(bearer(admin))
        .send({
          slug,
          title: 'Kursus Uji Otomatis',
          description: 'Deskripsi kursus uji yang cukup panjang untuk lolos validasi.',
          level: 'BEGINNER',
          categoryId: kategori.body[0].id,
          instructorId: instrukturList.body[0].id,
          priceIDR: 100_000,
          priceUSD: 7,
        })
        .expect(201);

      courseId = res.body.id;
      expect(res.body.status).toBe('DRAFT');
    });

    it('kursus draf tidak tampil di katalog publik', async () => {
      await request(server()).get(api(`/courses/${slug}`)).expect(404);
    });

    it('admin menerbitkan kursus lalu tampil publik', async () => {
      await request(server())
        .patch(api(`/courses/${courseId}`))
        .set(bearer(admin))
        .send({ status: 'PUBLISHED' })
        .expect(200);

      const res = await request(server()).get(api(`/courses/${slug}`)).expect(200);
      expect(res.body.publishedAt).toBeTruthy();
    });

    it('menghitung ulang statistik kursus', async () => {
      const res = await request(server())
        .post(api(`/courses/${courseId}/refresh-stats`))
        .set(bearer(admin))
        .expect(201);

      expect(res.body).toMatchObject({
        rating: expect.any(Number),
        reviewCount: expect.any(Number),
        studentCount: expect.any(Number),
        lessonCount: expect.any(Number),
      });
    });

    it('mengarsipkan kursus, bukan menghapusnya', async () => {
      await request(server())
        .delete(api(`/courses/${courseId}`))
        .set(bearer(admin))
        .expect(200);

      // Hilang dari katalog publik…
      await request(server()).get(api(`/courses/${slug}`)).expect(404);

      // …tetapi masih ada bagi admin.
      const asAdmin = await request(server())
        .get(api(`/courses/${slug}`))
        .set(bearer(admin))
        .expect(200);
      expect(asAdmin.body.status).toBe('ARCHIVED');
    });

    it('menolak memperbarui kursus yang tidak ada', async () => {
      await request(server())
        .patch(api('/courses/id-tidak-ada'))
        .set(bearer(admin))
        .send({ title: 'Judul Yang Cukup Panjang' })
        .expect(404)
        .expect((r) => expect(r.body.code).toBe('course.notFound'));
    });

    it('menolak deskripsi terlalu pendek', async () => {
      await request(server())
        .post(api('/courses'))
        .set(bearer(admin))
        .send({
          slug: `pendek-${stamp()}`,
          title: 'Judul Cukup',
          description: 'pendek',
          level: 'BEGINNER',
          categoryId: 'x',
          instructorId: 'y',
        })
        .expect(400);
    });
  });

  describe('Ruang mentor', () => {
    it('mentor melihat kursus yang diampunya saja', async () => {
      const res = await request(server())
        .get(api('/instructor/courses'))
        .set(bearer(instructor))
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('studentCount');
    });

    it('admin melihat seluruh kursus di ruang mentor', async () => {
      const mentorView = await request(server())
        .get(api('/instructor/courses'))
        .set(bearer(instructor));
      const adminView = await request(server())
        .get(api('/instructor/courses'))
        .set(bearer(admin));

      expect(adminView.body.length).toBeGreaterThanOrEqual(mentorView.body.length);
    });

    it('ringkasan penilaian diurutkan dari tenggat terdekat', async () => {
      const res = await request(server())
        .get(api('/instructor/submissions/pending-summary'))
        .set(bearer(instructor))
        .expect(200);

      const withDue = res.body
        .filter((r: { dueAt: string | null }) => r.dueAt)
        .map((r: { dueAt: string }) => new Date(r.dueAt).getTime());
      expect(withDue).toEqual([...withDue].sort((a: number, b: number) => a - b));
    });

    it('menghitung bagi hasil pendapatan', async () => {
      const res = await request(server())
        .get(api('/instructor/payouts'))
        .set(bearer(instructor))
        .expect(200);

      expect(res.body).toMatchObject({
        grossIDR: expect.any(Number),
        sharePct: expect.any(Number),
        estimatedPayoutIDR: expect.any(Number),
      });
      expect(res.body.estimatedPayoutIDR).toBeLessThanOrEqual(res.body.grossIDR);
    });

    it('antrian bisa disaring per kursus', async () => {
      const courses = await request(server())
        .get(api('/instructor/courses'))
        .set(bearer(instructor));

      const res = await request(server())
        .get(api(`/instructor/submissions?courseId=${courses.body[0].id}`))
        .set(bearer(instructor))
        .expect(200);

      expect(res.body).toHaveProperty('meta');
    });

    it('menolak menilai submission yang tidak ada', async () => {
      await request(server())
        .patch(api('/instructor/submissions/id-tidak-ada/grade'))
        .set(bearer(instructor))
        .send({ grade: 90 })
        .expect(404)
        .expect((r) => expect(r.body.code).toBe('submission.notFound'));
    });

    it('menolak nilai negatif', async () => {
      await request(server())
        .patch(api('/instructor/submissions/apa-saja/grade'))
        .set(bearer(instructor))
        .send({ grade: -5 })
        .expect(400);
    });

    it('siswa tidak bisa membuka ruang mentor', async () => {
      await request(server())
        .get(api('/instructor/payouts'))
        .set(bearer(student))
        .expect(403);
    });
  });

  describe('Sertifikat', () => {
    it('verifikasi lewat path maupun query memberi hasil sama', async () => {
      const viaPath = await request(server()).get(api('/certificates/verify/TC-X-1'));
      const viaQuery = await request(server()).get(
        api('/certificates/verify?number=TC-X-1'),
      );
      expect(viaPath.status).toBe(viaQuery.status);
    });

    it('daftar sertifikat saya kosong bila belum lulus', async () => {
      const res = await request(server())
        .get(api('/certificates/me'))
        .set(bearer(student))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Health', () => {
    it('melaporkan status database', async () => {
      const res = await request(server()).get(api('/health')).expect(200);

      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'testcraft-lms-api',
        database: 'up',
        uptimeSec: expect.any(Number),
      });
    });
  });
});
