import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * Menguji aturan bisnis paling berisiko: uang, akses kursus, dan penilaian.
 * Ini yang paling mahal kalau salah, jadi paling banyak diperiksa.
 */
describe('Pembelajaran, pembayaran, dan penilaian (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let instructorToken: string;
  let otherInstructorToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = async (creds: { email: string; password: string }) => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send(creds);
      return res.body.tokens.accessToken as string;
    };

    adminToken = await login(CREDENTIALS.admin);
    studentToken = await login(CREDENTIALS.student);
    instructorToken = await login(CREDENTIALS.instructor);
    otherInstructorToken = await login(CREDENTIALS.otherInstructor);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('Pendaftaran kursus', () => {
    it('menolak pendaftaran kursus berbayar tanpa pembayaran lunas', async () => {
      // Kursus yang belum diikuti siswa demo.
      const course = await request(server()).get(api('/courses/ai-for-testing'));

      const res = await request(server())
        .post(api('/enrollments'))
        .set(bearer(studentToken))
        .send({ courseId: course.body.id })
        .expect(403);

      expect(res.body.code).toBe('enrollment.paymentRequired');
    });

    it('menolak progres pada kursus yang belum diikuti', async () => {
      const course = await request(server()).get(api('/courses/ai-for-testing'));
      const lessonId = course.body.modules[0].lessons[0].id;

      await request(server())
        .post(api(`/enrollments/lessons/${lessonId}/progress`))
        .set(bearer(studentToken))
        .send({ completed: true })
        .expect(403);
    });

    it('mencatat progres dan menghitung ulang persentase', async () => {
      // Siswa demo sudah terdaftar di postman-api lewat seed.
      const course = await request(server()).get(api('/courses/postman-api'));
      const lessons = course.body.modules.flatMap(
        (m: { lessons: Array<{ id: string }> }) => m.lessons,
      );

      const res = await request(server())
        .post(api(`/enrollments/lessons/${lessons[0].id}/progress`))
        .set(bearer(studentToken))
        .send({ completed: true, resumeSecond: 120 })
        .expect(201);

      expect(res.body.progressPct).toBeGreaterThan(0);
      expect(res.body.progressPct).toBeLessThanOrEqual(100);
      expect(res.body.completedLessons).toBeGreaterThan(0);
    });

    it('daftar kursus saya memakai bentuk paginasi standar', async () => {
      const res = await request(server())
        .get(api('/enrollments/me'))
        .set(bearer(studentToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.data[0].course).toHaveProperty('title');
    });
  });

  describe('Checkout', () => {
    let courseId: string;
    let coursePrice: number;

    beforeAll(async () => {
      const course = await request(server()).get(api('/courses/ai-for-testing'));
      courseId = course.body.id;
      coursePrice = course.body.priceIDR;
    });

    it('menghitung harga dari database, bukan dari kiriman klien', async () => {
      const res = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(studentToken))
        // Klien "menyelundupkan" harga murah — harus diabaikan/ditolak.
        .send({ courseIds: [courseId], total: 1000, subtotal: 1000 })
        .expect(400);

      expect(String(res.body.message)).toContain('should not exist');
    });

    it('membuat invoice dengan pajak dan snapshot harga', async () => {
      const settings = await request(server()).get(api('/content/settings'));
      const taxPercent = settings.body.taxPercent;

      const res = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(studentToken))
        .send({ courseIds: [courseId] })
        .expect(201);

      expect(res.body.subtotal).toBe(coursePrice);
      expect(res.body.tax).toBe(Math.round((coursePrice * taxPercent) / 100));
      expect(res.body.total).toBe(res.body.subtotal - res.body.discount + res.body.tax);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.invoiceNo).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(res.body.items[0].priceSnapshot).toBe(coursePrice);
    });

    it('menerapkan diskon kupon persen', async () => {
      const res = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(studentToken))
        .send({ courseIds: [courseId], couponCode: 'MERDEKA50' })
        .expect(201);

      expect(res.body.discount).toBe(Math.round(coursePrice * 0.5));
      expect(res.body.couponCode).toBe('MERDEKA50');
    });

    it('menolak kupon yang tidak ada', async () => {
      await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(studentToken))
        .send({ courseIds: [courseId], couponCode: 'KUPON-PALSU' })
        .expect(400);
    });

    it('menolak checkout kursus yang sudah diikuti', async () => {
      const enrolled = await request(server()).get(api('/courses/postman-api'));

      const res = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(studentToken))
        .send({ courseIds: [enrolled.body.id] })
        .expect(400);

      expect(res.body.code).toBe('enrollment.alreadyEnrolled');
    });

    it('menolak checkout tanpa autentikasi', async () => {
      await request(server())
        .post(api('/payments/checkout'))
        .send({ courseIds: [courseId] })
        .expect(401);
    });
  });

  describe('Webhook pembayaran', () => {
    it('melunasi invoice, membuat enrollment, dan bersifat idempoten', async () => {
      const course = await request(server()).get(api('/courses/k6-performance'));

      // Memakai pembeli baru agar test tidak bergantung pada keadaan database
      // sebelumnya — siswa bersama bisa saja sudah terdaftar dari eksekusi lain.
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Pembeli Uji',
          email: `pembeli-${Date.now()}@testcraft.id`,
          password: 'Rahasia123',
        })
        .expect(201);
      const buyerToken = buyer.body.tokens.accessToken as string;

      const checkout = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyerToken))
        .send({ courseIds: [course.body.id] })
        .expect(201);

      const invoiceNo = checkout.body.invoiceNo;

      const paid = await request(server())
        .post(api('/payments/webhook/midtrans'))
        .send({ invoiceNo, transactionStatus: 'settlement', externalId: 'MT-123' })
        .expect(201);

      expect(paid.body.status).toBe('PAID');
      expect(paid.body.paidAt).toBeTruthy();

      // Panggilan kedua tidak boleh menggandakan apa pun.
      await request(server())
        .post(api('/payments/webhook/midtrans'))
        .send({ invoiceNo, transactionStatus: 'settlement' })
        .expect(201);

      const enrollments = await request(server())
        .get(api('/enrollments/me?limit=100'))
        .set(bearer(buyerToken));

      const matching = enrollments.body.data.filter(
        (e: { courseId: string }) => e.courseId === course.body.id,
      );
      expect(matching).toHaveLength(1);
    });

    it('mengabaikan notifikasi dengan status transaksi gagal', async () => {
      const course = await request(server()).get(api('/courses/jmeter-performance'));

      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Pembeli Gagal',
          email: `gagal-${Date.now()}@testcraft.id`,
          password: 'Rahasia123',
        })
        .expect(201);

      const checkout = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id] });

      const res = await request(server())
        .post(api('/payments/webhook/midtrans'))
        .send({ invoiceNo: checkout.body.invoiceNo, transactionStatus: 'deny' })
        .expect(201);

      expect(res.body.ignored).toBe(true);
    });
  });

  describe('Tugas dan penilaian', () => {
    let assignmentId: string;
    let submissionId: string;

    it('admin membuat tugas berikut rubriknya lewat CMS', async () => {
      const lessons = await request(server())
        .get(api('/cms/assignments/available-lessons'))
        .set(bearer(adminToken))
        .expect(200);

      // Pilih lesson dari kursus yang diampu instruktur uji (Postman API Testing).
      const lesson = lessons.body.find(
        (l: { module: { course: { title: string } } }) =>
          l.module.course.title === 'Postman API Testing',
      );
      expect(lesson).toBeDefined();

      const res = await request(server())
        .post(api('/cms/assignments'))
        .set(bearer(adminToken))
        .send({
          lessonId: lesson.id,
          title: 'Tugas Uji Otomatis',
          brief: 'Kerjakan sesuai instruksi pada materi ini.',
          maxPoints: 100,
          rubric: [
            { criterion: 'Kelengkapan', points: 60 },
            { criterion: 'Kerapian', points: 40 },
          ],
          dueAt: '2026-12-31T00:00:00.000Z',
        })
        .expect(201);

      assignmentId = res.body.id;
    });

    it('siswa melihat tugas beserta rubrik dan tenggatnya', async () => {
      const res = await request(server())
        .get(api('/enrollments/me/assignments'))
        .set(bearer(studentToken))
        .expect(200);

      const found = res.body.find(
        (a: { id: string }) => a.id === assignmentId,
      );
      expect(found).toBeDefined();
      expect(found.rubric).toHaveLength(2);
      expect(found.maxPoints).toBe(100);
      expect(found.submission).toBeNull();
    });

    it('siswa mengirim tugas', async () => {
      const res = await request(server())
        .post(api(`/enrollments/assignments/${assignmentId}/submit`))
        .set(bearer(studentToken))
        .send({ contentHtml: 'Jawaban saya.' })
        .expect(201);

      expect(res.body.status).toBe('SUBMITTED');
      expect(res.body.attempt).toBe(1);
      submissionId = res.body.id;
    });

    it('tugas muncul di antrian mentor pengampu', async () => {
      const res = await request(server())
        .get(api('/instructor/submissions?status=SUBMITTED&limit=50'))
        .set(bearer(instructorToken))
        .expect(200);

      const found = res.body.data.find(
        (s: { id: string }) => s.id === submissionId,
      );
      expect(found).toBeDefined();
      expect(found.rubric).toHaveLength(2);
      expect(found.student.name).toBeTruthy();
    });

    it('tugas TIDAK muncul di antrian mentor lain', async () => {
      const res = await request(server())
        .get(api('/instructor/submissions?status=SUBMITTED&limit=50'))
        .set(bearer(otherInstructorToken))
        .expect(200);

      const found = res.body.data.find(
        (s: { id: string }) => s.id === submissionId,
      );
      expect(found).toBeUndefined();
    });

    it('mentor lain tidak boleh menilai tugas bukan kelasnya', async () => {
      const res = await request(server())
        .patch(api(`/instructor/submissions/${submissionId}/grade`))
        .set(bearer(otherInstructorToken))
        .send({ grade: 100 })
        .expect(403);

      // Diperiksa lewat kode, bukan teks — teks berubah mengikuti bahasa.
      expect(res.body.code).toBe('grading.notYourCourse');
    });

    it('mentor pengampu menilai dan siswa menerima notifikasi', async () => {
      const res = await request(server())
        .patch(api(`/instructor/submissions/${submissionId}/grade`))
        .set(bearer(instructorToken))
        .send({ grade: 88, feedback: 'Bagus, rapikan penamaan variabel.' })
        .expect(200);

      expect(res.body.status).toBe('GRADED');
      expect(res.body.grade).toBe(88);

      const notifications = await request(server())
        .get(api('/notifications'))
        .set(bearer(studentToken))
        .expect(200);

      expect(
        notifications.body.some(
          (n: { title: string }) => n.title.includes('Tugas Uji Otomatis'),
        ),
      ).toBe(true);
    });

    it('nilai dipotong ke poin maksimum tugas', async () => {
      await request(server())
        .patch(api(`/instructor/submissions/${submissionId}/grade`))
        .set(bearer(instructorToken))
        .send({ grade: 9999 })
        .expect(200)
        .expect((res) => expect(res.body.grade).toBe(100));
    });

    it('submission yang sudah dinilai memicu percobaan baru, bukan menimpa', async () => {
      const res = await request(server())
        .post(api(`/enrollments/assignments/${assignmentId}/submit`))
        .set(bearer(studentToken))
        .send({ contentHtml: 'Revisi saya.' })
        .expect(201);

      expect(res.body.attempt).toBe(2);
      expect(res.body.id).not.toBe(submissionId);
    });

    it('admin membersihkan tugas uji', async () => {
      await request(server())
        .delete(api(`/cms/assignments/${assignmentId}`))
        .set(bearer(adminToken))
        .expect(200);
    });
  });

  describe('Sertifikat', () => {
    it('verifikasi nomor tidak dikenal mengembalikan 404', async () => {
      await request(server())
        .get(api('/certificates/verify?number=TC-0000-00000'))
        .expect(404);
    });

    it('daftar sertifikat saya butuh autentikasi', async () => {
      await request(server()).get(api('/certificates/me')).expect(401);
      await request(server())
        .get(api('/certificates/me'))
        .set(bearer(studentToken))
        .expect(200);
    });
  });

  describe('Analitik admin', () => {
    it('mengembalikan KPI yang konsisten dengan data', async () => {
      const res = await request(server())
        .get(api('/analytics/overview'))
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body.publishedCourses).toBeGreaterThan(0);
      expect(res.body.instructors).toBeGreaterThan(0);
      // Ada pembayaran lunas dari test webhook di atas.
      expect(res.body.revenueTotalIDR).toBeGreaterThan(0);
    });
  });
});
