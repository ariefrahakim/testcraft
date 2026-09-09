import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * Tugas & rubrik dari sisi CMS, sertifikat, dan jalur sisa yang belum
 * tersentuh suite lain.
 */
describe('Tugas CMS, sertifikat, & jalur sisa (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let student: string;
  let studentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const loginRes = async (creds: { email: string; password: string }) =>
      (await request(app.getHttpServer()).post(api('/auth/login')).send(creds)).body;

    admin = (await loginRes(CREDENTIALS.admin)).tokens.accessToken;
    const s = await loginRes(CREDENTIALS.student);
    student = s.tokens.accessToken;
    studentId = s.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const stamp = () => Date.now() + Math.floor(Math.random() * 1000);

  describe('Tugas dari CMS', () => {
    let assignmentId: string;
    let courseId: string;

    it('menampilkan materi yang belum punya tugas', async () => {
      const res = await request(server())
        .get(api('/cms/assignments/available-lessons'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('module.course.title');
    });

    it('membuat tugas dengan rubrik', async () => {
      const lessons = await request(server())
        .get(api('/cms/assignments/available-lessons'))
        .set(bearer(admin));

      const lesson = lessons.body[0];
      const res = await request(server())
        .post(api('/cms/assignments'))
        .set(bearer(admin))
        .send({
          lessonId: lesson.id,
          title: `Tugas CMS ${stamp()}`,
          brief: 'Instruksi pengerjaan yang cukup panjang untuk lolos validasi.',
          maxPoints: 80,
          rubric: [
            { criterion: 'Ketepatan', points: 50 },
            { criterion: 'Kerapian', points: 30 },
          ],
          dueAt: '2027-01-31T00:00:00.000Z',
        })
        .expect(201);

      assignmentId = res.body.id;
      expect(res.body.maxPoints).toBe(80);
    });

    it('materi yang sudah punya tugas hilang dari daftar tersedia', async () => {
      const res = await request(server())
        .get(api('/cms/assignments/available-lessons'))
        .set(bearer(admin));

      const stillListed = res.body.some(
        (l: { id: string }) => l.id === assignmentId,
      );
      expect(stillListed).toBe(false);
    });

    it('daftar tugas menyertakan hitungan pengumpulan', async () => {
      const res = await request(server())
        .get(api('/cms/assignments'))
        .set(bearer(admin))
        .expect(200);

      const found = res.body.find((a: { id: string }) => a.id === assignmentId);
      expect(found).toMatchObject({
        totalSubmissions: 0,
        pendingCount: 0,
        gradedCount: 0,
        courseTitle: expect.any(String),
      });
      courseId = found.courseId;
    });

    it('bisa disaring per kursus', async () => {
      const res = await request(server())
        .get(api(`/cms/assignments?courseId=${courseId}`))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.every((a: { courseId: string }) => a.courseId === courseId)).toBe(
        true,
      );
    });

    it('memperbarui rubrik dan tenggat', async () => {
      const res = await request(server())
        .patch(api(`/cms/assignments/${assignmentId}`))
        .set(bearer(admin))
        .send({
          maxPoints: 100,
          rubric: [{ criterion: 'Kriteria Tunggal', points: 100 }],
          dueAt: '2027-06-30T00:00:00.000Z',
        })
        .expect(200);

      expect(res.body.maxPoints).toBe(100);
      expect(res.body.rubric).toHaveLength(1);
    });

    it('menolak brief terlalu pendek', async () => {
      const lessons = await request(server())
        .get(api('/cms/assignments/available-lessons'))
        .set(bearer(admin));

      await request(server())
        .post(api('/cms/assignments'))
        .set(bearer(admin))
        .send({ lessonId: lessons.body[0].id, title: 'Judul', brief: 'pendek' })
        .expect(400);
    });

    it('menolak lessonId yang tidak ada', async () => {
      await request(server())
        .post(api('/cms/assignments'))
        .set(bearer(admin))
        .send({
          lessonId: 'lesson-tidak-ada',
          title: 'Tugas Hantu',
          brief: 'Instruksi pengerjaan yang cukup panjang untuk lolos validasi.',
        })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('db.invalidReference'));
    });

    it('siswa tidak boleh membuat tugas', async () => {
      await request(server())
        .post(api('/cms/assignments'))
        .set(bearer(student))
        .send({
          lessonId: 'x',
          title: 'Tugas Siswa',
          brief: 'Instruksi pengerjaan yang cukup panjang untuk lolos validasi.',
        })
        .expect(403);
    });

    it('menghapus tugas', async () => {
      await request(server())
        .delete(api(`/cms/assignments/${assignmentId}`))
        .set(bearer(admin))
        .expect(200);
    });

    it('menolak menghapus tugas yang tidak ada', async () => {
      await request(server())
        .delete(api('/cms/assignments/tidak-ada'))
        .set(bearer(admin))
        .expect(404);
    });
  });

  describe('Sertifikat yang benar-benar terbit', () => {
    let number: string;

    beforeAll(async () => {
      const course = await prisma.course.findFirstOrThrow({
        where: { slug: 'istqb-foundation' },
      });
      number = `TC-UJI-${stamp()}`;

      await prisma.certificate.upsert({
        where: { userId_courseId: { userId: studentId, courseId: course.id } },
        create: { number, userId: studentId, courseId: course.id, scorePct: 92 },
        update: { number, scorePct: 92, revokedAt: null },
      });
    });

    it('muncul di daftar sertifikat saya lengkap dengan tautan verifikasi', async () => {
      const res = await request(server())
        .get(api('/certificates/me'))
        .set(bearer(student))
        .expect(200);

      const found = res.body.find((c: { number: string }) => c.number === number);
      expect(found).toMatchObject({
        scorePct: 92,
        courseTitle: expect.any(String),
        recipientName: expect.any(String),
      });
      expect(found.verifyUrl).toContain(`/verify?n=${number}`);
    });

    it('bisa diverifikasi publik tanpa membocorkan email', async () => {
      const res = await request(server())
        .get(api(`/certificates/verify?number=${number}`))
        .expect(200);

      expect(res.body).toMatchObject({ valid: true, number, scorePct: 92 });
      expect(JSON.stringify(res.body)).not.toContain('@');
    });

    it('sertifikat yang dicabut ditandai tidak valid', async () => {
      await prisma.certificate.update({
        where: { number },
        data: { revokedAt: new Date() },
      });

      const res = await request(server())
        .get(api(`/certificates/verify/${number}`))
        .expect(200);

      expect(res.body.valid).toBe(false);
      expect(res.body.revokedAt).toBeTruthy();
    });

    it('sertifikat yang dicabut hilang dari daftar milik saya', async () => {
      const res = await request(server())
        .get(api('/certificates/me'))
        .set(bearer(student))
        .expect(200);

      expect(res.body.some((c: { number: string }) => c.number === number)).toBe(false);
    });
  });

  describe('Jalur sisa', () => {
    it('detail learning path lewat slug', async () => {
      const list = await request(server()).get(api('/learning-paths')).expect(200);

      const res = await request(server())
        .get(api(`/learning-paths/${list.body[0].slug}`))
        .expect(200);

      expect(res.body.steps.length).toBeGreaterThan(0);
    });

    it('learning path yang tidak ada memberi 404', async () => {
      await request(server()).get(api('/learning-paths/tidak-ada')).expect(404);
    });

    it('riwayat pembayaran saya memakai bentuk paginasi', async () => {
      const res = await request(server())
        .get(api('/payments/me?limit=5'))
        .set(bearer(student))
        .expect(200);

      expect(res.body).toHaveProperty('meta.totalPages');
    });

    it('admin mencari transaksi lewat nomor invoice', async () => {
      const res = await request(server())
        .get(api('/payments?q=INV-'))
        .set(bearer(admin))
        .expect(200);

      expect(res.body.data.every((p: { invoiceNo: string }) => p.invoiceNo.includes('INV-'))).toBe(
        true,
      );
    });

    it('admin bisa menandai invoice lunas untuk keperluan QA', async () => {
      const course = await request(server()).get(api('/courses/qa-leadership'));
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Simulasi',
          email: `simulasi-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      const checkout = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id] })
        .expect(201);

      const res = await request(server())
        .post(api('/payments/simulate-paid'))
        .set(bearer(admin))
        .send({ invoiceNo: checkout.body.invoiceNo })
        .expect(201);

      expect(res.body.status).toBe('PAID');
      expect(res.body.externalId).toBe('SIMULATED');
    });

    it('webhook untuk invoice yang tidak ada memberi 404', async () => {
      await request(server())
        .post(api('/payments/webhook/midtrans'))
        .send({ invoiceNo: 'INV-0000-000000', transactionStatus: 'settlement' })
        .expect(404)
        .expect((r) => expect(r.body.code).toBe('invoice.notFound'));
    });

    it('menandai lesson belum selesai menurunkan progres', async () => {
      const course = await request(server()).get(api('/courses/postman-api'));
      const lesson = course.body.modules[0].lessons[0];

      const done = await request(server())
        .post(api(`/enrollments/lessons/${lesson.id}/progress`))
        .set(bearer(student))
        .send({ completed: true })
        .expect(201);

      const undone = await request(server())
        .post(api(`/enrollments/lessons/${lesson.id}/progress`))
        .set(bearer(student))
        .send({ completed: false })
        .expect(201);

      expect(undone.body.completedLessons).toBeLessThan(done.body.completedLessons);
    });

    it('menyimpan posisi tonton tanpa menandai selesai', async () => {
      const course = await request(server()).get(api('/courses/postman-api'));
      const lesson = course.body.modules[0].lessons[1];

      const res = await request(server())
        .post(api(`/enrollments/lessons/${lesson.id}/progress`))
        .set(bearer(student))
        .send({ resumeSecond: 245, watchedSec: 245 })
        .expect(201);

      expect(res.body).toHaveProperty('progressPct');
    });

    it('mendaftar kursus gratis tanpa pembayaran', async () => {
      const course = await prisma.course.findFirstOrThrow({
        where: { slug: 'git-cicd-qa' },
      });
      await prisma.course.update({
        where: { id: course.id },
        data: { isFree: true },
      });

      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Gratis',
          email: `gratis-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      await request(server())
        .post(api('/enrollments'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseId: course.id })
        .expect(201);

      await prisma.course.update({
        where: { id: course.id },
        data: { isFree: false },
      });
    });

    it('menolak mendaftar kursus yang belum terbit', async () => {
      const draft = await prisma.course.create({
        data: {
          slug: `draf-${stamp()}`,
          title: 'Kursus Draf',
          description: 'Deskripsi kursus draf yang cukup panjang.',
          level: 'BEGINNER',
          status: 'DRAFT',
          categoryId: (await prisma.category.findFirstOrThrow()).id,
          instructorId: (await prisma.instructorProfile.findFirstOrThrow()).id,
        },
      });

      await request(server())
        .post(api('/enrollments'))
        .set(bearer(student))
        .send({ courseId: draft.id })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('course.notPublished'));
    });

    it('logout mencabut seluruh sesi bila refresh token tidak disebut', async () => {
      const created = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Logout',
          email: `logout-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      const { accessToken, refreshToken } = created.body.tokens;

      await request(server())
        .post(api('/auth/logout'))
        .set(bearer(accessToken))
        .expect(200);

      await request(server())
        .post(api('/auth/refresh'))
        .send({ refreshToken })
        .expect(401)
        .expect((r) => expect(r.body.code).toBe('auth.refreshExpired'));
    });

    it('logout dengan refresh token hanya mencabut sesi itu', async () => {
      const created = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Logout Satu',
          email: `logout1-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      const sesiKedua = await request(server())
        .post(api('/auth/login'))
        .send({ email: created.body.user.email, password: 'Rahasia123' });

      await request(server())
        .post(api('/auth/logout'))
        .set(bearer(created.body.tokens.accessToken))
        .send({ refreshToken: created.body.tokens.refreshToken })
        .expect(200);

      // Sesi kedua harus tetap hidup.
      await request(server())
        .post(api('/auth/refresh'))
        .send({ refreshToken: sesiKedua.body.tokens.refreshToken })
        .expect(200);
    });

    it('refresh token berbentuk sampah ditolak rapi', async () => {
      await request(server())
        .post(api('/auth/refresh'))
        .send({ refreshToken: 'bukan-token-sama-sekali' })
        .expect(401)
        .expect((r) => expect(r.body.code).toBe('auth.refreshInvalid'));
    });
  });
});
