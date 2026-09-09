import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('POST /auth/login', () => {
    it('mengembalikan profil dan pasangan token', async () => {
      const res = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.admin)
        .expect(200);

      expect(res.body.user.email).toBe(CREDENTIALS.admin.email);
      expect(res.body.user.role).toBe('SUPER_ADMIN');
      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
      expect(res.body.tokens.refreshToken).toEqual(expect.any(String));
      expect(res.body.tokens.expiresIn).toBe(900);
    });

    it('tidak pernah membocorkan hash password', async () => {
      const res = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student)
        .expect(200);

      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('$argon2');
    });

    it('menolak password salah tanpa membedakan pesan', async () => {
      const wrongPassword = await request(server())
        .post(api('/auth/login'))
        .send({ email: CREDENTIALS.admin.email, password: 'salah-sekali' })
        .expect(401);

      const unknownEmail = await request(server())
        .post(api('/auth/login'))
        .send({ email: 'tidak-ada@testcraft.id', password: 'apa-saja' })
        .expect(401);

      // Pesan sengaja identik agar tidak bisa dipakai menebak email terdaftar.
      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });
  });

  describe('POST /auth/register', () => {
    it('membuat akun STUDENT dan menolak email ganda', async () => {
      const email = `daftar-${Date.now()}@testcraft.id`;

      const created = await request(server())
        .post(api('/auth/register'))
        .send({ name: 'Peserta Baru', email, password: 'Rahasia123' })
        .expect(201);

      expect(created.body.user.role).toBe('STUDENT');

      await request(server())
        .post(api('/auth/register'))
        .send({ name: 'Peserta Baru', email, password: 'Rahasia123' })
        .expect(409);
    });

    it('menolak password tanpa angka', async () => {
      const res = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Tanpa Angka',
          email: `lemah-${Date.now()}@testcraft.id`,
          password: 'hanyahuruf',
        })
        .expect(400);

      expect(res.body.errors[0].code).toBe('validation.password.weak');
    });
  });

  describe('POST /auth/refresh', () => {
    it('merotasi refresh token — token lama tidak bisa dipakai lagi', async () => {
      const login = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student)
        .expect(200);

      const oldRefresh = login.body.tokens.refreshToken;

      const rotated = await request(server())
        .post(api('/auth/refresh'))
        .send({ refreshToken: oldRefresh })
        .expect(200);

      expect(rotated.body.tokens.refreshToken).not.toBe(oldRefresh);

      // Pemakaian ulang token lama harus ditolak.
      await request(server())
        .post(api('/auth/refresh'))
        .send({ refreshToken: oldRefresh })
        .expect(401);
    });
  });

  describe('Penjagaan endpoint', () => {
    it('menolak akses tanpa token', async () => {
      await request(server()).get(api('/auth/me')).expect(401);
      await request(server()).get(api('/cms/settings')).expect(401);
    });

    it('menolak token yang dipalsukan', async () => {
      await request(server())
        .get(api('/auth/me'))
        .set(bearer('eyJhbGciOiJIUzI1NiJ9.palsu.palsu'))
        .expect(401);
    });

    it('membiarkan endpoint publik diakses bebas', async () => {
      await request(server()).get(api('/health')).expect(200);
      await request(server()).get(api('/courses')).expect(200);
      await request(server()).get(api('/content/settings')).expect(200);
    });

    it('menolak STUDENT membuka endpoint admin (403, bukan 401)', async () => {
      const login = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student);
      const token = login.body.tokens.accessToken;

      await request(server())
        .get(api('/cms/settings'))
        .set(bearer(token))
        .expect(403);

      await request(server()).get(api('/users')).set(bearer(token)).expect(403);
      await request(server())
        .get(api('/analytics/overview'))
        .set(bearer(token))
        .expect(403);
    });

    it('menolak STUDENT membuka ruang mentor', async () => {
      const login = await request(server())
        .post(api('/auth/login'))
        .send(CREDENTIALS.student);

      await request(server())
        .get(api('/instructor/courses'))
        .set(bearer(login.body.tokens.accessToken))
        .expect(403);
    });
  });

  describe('Google OAuth', () => {
    // Kredensial Google tidak diisi di lingkungan test, jadi yang diuji adalah
    // perilaku ketika fitur belum dikonfigurasi — kasus yang paling sering
    // ditemui developer baru dan dulu menghasilkan 404 yang membingungkan.
    it('mengalihkan ke halaman masuk dengan alasan yang jelas', async () => {
      const res = await request(server()).get(api('/auth/google')).expect(302);

      expect(res.headers.location).toContain('/login');
      expect(res.headers.location).toContain('error=google_not_configured');
    });

    it('callback tanpa sesi Google tidak menghasilkan 500', async () => {
      const res = await request(server())
        .get(api('/auth/google/callback?code=kode-palsu'))
        .expect(302);

      expect(res.headers.location).toContain('/login?error=');
    });

    it('API tetap sehat setelah endpoint OAuth diakses', async () => {
      // Regresi: guard yang melakukan redirect lalu mengembalikan false
      // membuat exception filter menulis respons kedua dan mematikan proses.
      await request(server()).get(api('/auth/google')).expect(302);
      await request(server()).get(api('/health')).expect(200);
    });
  });

  describe('Validasi query', () => {
    it('menolak parameter yang tidak dideklarasikan di DTO', async () => {
      const res = await request(server())
        .get(api('/courses?parameterSiluman=1'))
        .expect(400);

      expect(String(res.body.message)).toContain('parameterSiluman');
    });

    it('menolak limit di luar batas', async () => {
      await request(server()).get(api('/courses?limit=500')).expect(400);
      await request(server()).get(api('/courses?page=0')).expect(400);
    });
  });
});
