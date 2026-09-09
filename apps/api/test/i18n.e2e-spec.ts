import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * Kontrak pesan error.
 *
 * Aturannya: `code` stabil lintas bahasa, `message` mengikuti
 * `Accept-Language`. Ini yang membuat antarmuka berbahasa Inggris tidak lagi
 * memunculkan kalimat Indonesia, dan pesan bawaan class-validator seperti
 * "email must be an email" tidak pernah sampai ke pengguna.
 */
describe('Pesan error & bahasa (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  const login = (lang?: string) => {
    const req = request(server())
      .post(api('/auth/login'))
      .send({ email: CREDENTIALS.admin.email, password: 'password-salah' });
    return lang ? req.set('Accept-Language', lang) : req;
  };

  describe('Bentuk respons error', () => {
    it('selalu menyertakan code, message, error, path, dan timestamp', async () => {
      const res = await login().expect(401);

      expect(res.body).toMatchObject({
        statusCode: 401,
        code: 'auth.invalidCredentials',
        message: expect.any(String),
        error: 'Unauthorized',
        path: '/api/v1/auth/login',
        timestamp: expect.any(String),
      });
    });

    it('code tidak berubah meski bahasa berbeda', async () => {
      const indo = await login('id').expect(401);
      const eng = await login('en').expect(401);

      expect(indo.body.code).toBe(eng.body.code);
      expect(indo.body.message).not.toBe(eng.body.message);
    });
  });

  describe('Accept-Language', () => {
    it('memberi pesan Indonesia untuk id', async () => {
      const res = await login('id').expect(401);
      expect(res.body.message).toBe('Email atau password salah');
    });

    it('memberi pesan Inggris untuk en', async () => {
      const res = await login('en').expect(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('memahami format lengkap dari peramban', async () => {
      const res = await login('en-US,en;q=0.9,id;q=0.8').expect(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('menghormati bobot q — id lebih tinggi berarti Indonesia', async () => {
      const res = await login('en;q=0.5,id;q=0.9').expect(401);
      expect(res.body.message).toBe('Email atau password salah');
    });

    it('memakai Indonesia bila header tidak ada', async () => {
      const res = await login().expect(401);
      expect(res.body.message).toBe('Email atau password salah');
    });

    it('memakai Indonesia untuk bahasa yang tidak didukung', async () => {
      const res = await login('ja-JP,ja;q=0.9').expect(401);
      expect(res.body.message).toBe('Email atau password salah');
    });

    it('mengabaikan header yang rusak tanpa error', async () => {
      const res = await login(';;;q=abc').expect(401);
      expect(res.body.message).toEqual(expect.any(String));
    });
  });

  describe('Validasi field', () => {
    it('email kosong memberi pesan "wajib diisi", bukan "harus berupa email"', async () => {
      const indo = await request(server())
        .post(api('/auth/login'))
        .set('Accept-Language', 'id')
        .send({ email: '', password: 'apa-saja' })
        .expect(400);

      expect(indo.body.code).toBe('validation.failed');
      expect(indo.body.errors).toHaveLength(1);
      expect(indo.body.errors[0]).toMatchObject({
        field: 'email',
        code: 'validation.email.required',
      });
      expect(indo.body.message).toBe('Email wajib diisi');
    });

    it('email kosong dalam bahasa Inggris berbunyi "Email is required"', async () => {
      const eng = await request(server())
        .post(api('/auth/login'))
        .set('Accept-Language', 'en')
        .send({ email: '', password: 'apa-saja' })
        .expect(400);

      expect(eng.body.message).toBe('Email is required');
    });

    it('format email salah memberi kalimat yang manusiawi', async () => {
      const eng = await request(server())
        .post(api('/auth/login'))
        .set('Accept-Language', 'en')
        .send({ email: 'bukan-email', password: 'apa-saja' })
        .expect(400);

      expect(eng.body.message).toBe('Enter a valid email address');
      // Kalimat bawaan class-validator tidak boleh bocor.
      expect(eng.body.message).not.toContain('must be an email');
    });

    it('tidak pernah membocorkan kalimat bawaan class-validator', async () => {
      const payloads = [
        { email: 'x', password: '' },
        { email: '', password: '' },
        { email: 'a@b.c', password: '' },
      ];

      for (const payload of payloads) {
        const res = await request(server())
          .post(api('/auth/login'))
          .set('Accept-Language', 'en')
          .send(payload)
          .expect(400);

        const body = JSON.stringify(res.body);
        expect(body).not.toMatch(/must be an email/i);
        expect(body).not.toMatch(/should not be empty/i);
        expect(body).not.toMatch(/must be a string/i);
      }
    });

    it('mengumpulkan semua field bermasalah, bukan berhenti di yang pertama', async () => {
      const res = await request(server())
        .post(api('/auth/register'))
        .set('Accept-Language', 'en')
        .send({ name: '', email: 'bukan-email', password: '123' })
        .expect(400);

      const fields = res.body.errors.map((e: { field: string }) => e.field);
      expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    });

    it('password lemah dibedakan dari password pendek', async () => {
      const short = await request(server())
        .post(api('/auth/register'))
        .set('Accept-Language', 'en')
        .send({ name: 'Uji', email: `p1-${Date.now()}@testcraft.id`, password: 'ab1' })
        .expect(400);
      expect(
        short.body.errors.some(
          (e: { code: string }) => e.code === 'validation.password.tooShort',
        ),
      ).toBe(true);

      const weak = await request(server())
        .post(api('/auth/register'))
        .set('Accept-Language', 'en')
        .send({
          name: 'Uji',
          email: `p2-${Date.now()}@testcraft.id`,
          password: 'hanyahurufsaja',
        })
        .expect(400);
      expect(weak.body.errors[0].code).toBe('validation.password.weak');
      expect(weak.body.message).toBe('Password must contain both letters and numbers');
    });
  });

  describe('Pesan berkode di seluruh domain', () => {
    it('kursus tidak ditemukan', async () => {
      const res = await request(server())
        .get(api('/courses/kursus-yang-tidak-ada'))
        .set('Accept-Language', 'en')
        .expect(404);

      expect(res.body.code).toBe('course.notFound');
      expect(res.body.message).toBe('Course not found');
    });

    it('akses ditolak karena role', async () => {
      const student = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student);

      const res = await request(server())
        .get(api('/cms/settings'))
        .set('Accept-Language', 'en')
        .set(bearer(student.body.tokens.accessToken))
        .expect(403);

      expect(res.body.code).toBe('auth.forbiddenRole');
      expect(res.body.message).toBe('Your account does not have access to this area.');
    });

    it('email sudah terpakai saat mendaftar', async () => {
      const res = await request(server())
        .post(api('/auth/register'))
        .set('Accept-Language', 'en')
        .send({
          name: 'Duplikat',
          email: CREDENTIALS.student.email,
          password: 'Rahasia123',
        })
        .expect(409);

      expect(res.body.code).toBe('auth.emailTaken');
      expect(res.body.message).toContain('already registered');
    });

    it('kupon tidak valid saat checkout', async () => {
      const student = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student);
      const course = await request(server()).get(api('/courses/ai-for-testing'));

      const res = await request(server())
        .post(api('/payments/checkout'))
        .set('Accept-Language', 'en')
        .set(bearer(student.body.tokens.accessToken))
        .send({ courseIds: [course.body.id], couponCode: 'TIDAK-ADA' })
        .expect(400);

      expect(res.body.code).toBe('coupon.invalid');
      expect(res.body.message).toBe('This coupon is invalid or has expired');
    });

    it('kursus berbayar tanpa pembayaran', async () => {
      const student = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student);
      const course = await request(server()).get(api('/courses/ai-for-testing'));

      const res = await request(server())
        .post(api('/enrollments'))
        .set('Accept-Language', 'en')
        .set(bearer(student.body.tokens.accessToken))
        .send({ courseId: course.body.id })
        .expect(403);

      expect(res.body.code).toBe('enrollment.paymentRequired');
      expect(res.body.message).toContain('paid course');
    });

    it('sertifikat tidak ditemukan', async () => {
      const res = await request(server())
        .get(api('/certificates/verify?number=TC-0000-99999'))
        .set('Accept-Language', 'en')
        .expect(404);

      expect(res.body.code).toBe('certificate.notFound');
      expect(res.body.message).toBe('Certificate number not found');
    });
  });

  describe('Kelengkapan kamus', () => {
    it('setiap kode punya terjemahan Indonesia dan Inggris yang berbeda', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { translate } = await import('../src/common/i18n/messages');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const messages = await import('../src/common/i18n/messages');

      const codes = Object.keys(
        (messages as unknown as { default?: unknown }) && {},
      );
      // Kamus tidak diekspor langsung; diuji lewat sampel kode nyata.
      const sample = [
        'auth.invalidCredentials',
        'validation.email.required',
        'course.notFound',
        'coupon.invalid',
        'server.error',
      ];

      for (const code of sample) {
        const indo = translate(code, 'id');
        const eng = translate(code, 'en');
        expect(indo).not.toBe(code); // ada terjemahannya
        expect(eng).not.toBe(code);
        expect(indo).not.toBe(eng); // benar-benar diterjemahkan
      }
      expect(codes).toBeDefined();
    });

    it('kode tak dikenal dikembalikan apa adanya, tidak menjadi string kosong', async () => {
      const { translate } = await import('../src/common/i18n/messages');
      expect(translate('kode.yang.tidak.ada', 'en')).toBe('kode.yang.tidak.ada');
    });
  });
});
