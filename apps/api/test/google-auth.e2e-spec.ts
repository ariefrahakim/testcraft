import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Profile } from 'passport-google-oauth20';
import { AuthService } from '../src/modules/auth/auth.service';
import { GoogleStrategy, type GoogleProfile } from '../src/modules/auth/google.strategy';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers';

/**
 * Alur Google diuji di tingkat service, bukan lewat HTTP.
 *
 * Menembak endpoint sungguhan berarti memanggil server Google — lambat, butuh
 * kredensial, dan tidak bisa dijalankan di CI. Yang penting diuji justru
 * keputusan setelah Google mengirim profil: kapan akun dibuat, kapan
 * ditautkan, dan kapan penautan ditolak.
 */
describe('Login Google (e2e)', () => {
  let app: INestApplication;
  let auth: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    auth = app.get(AuthService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const stamp = () => Date.now() + Math.floor(Math.random() * 10_000);

  const profile = (over: Partial<GoogleProfile> = {}): GoogleProfile => ({
    googleId: `google-${stamp()}`,
    email: `google-${stamp()}@example.com`,
    name: 'Pengguna Google',
    avatarUrl: 'https://example.com/foto.jpg',
    emailVerified: true,
    ...over,
  });

  describe('Pengguna baru', () => {
    it('membuat akun STUDENT beserta tokennya', async () => {
      const p = profile();
      const res = await auth.loginWithGoogle(p);

      expect(res.user.email).toBe(p.email);
      expect(res.user.role).toBe('STUDENT');
      expect(res.tokens.accessToken).toEqual(expect.any(String));
      expect(res.tokens.refreshToken).toEqual(expect.any(String));
    });

    it('menandai email terverifikasi bila Google menyatakannya', async () => {
      const p = profile({ emailVerified: true });
      const res = await auth.loginWithGoogle(p);

      const row = await prisma.user.findUnique({ where: { id: res.user.id } });
      expect(row?.emailVerifiedAt).toBeTruthy();
      expect(row?.googleId).toBe(p.googleId);
    });

    it('tidak menandai terverifikasi bila Google tidak menjaminnya', async () => {
      const res = await auth.loginWithGoogle(profile({ emailVerified: false }));

      const row = await prisma.user.findUnique({ where: { id: res.user.id } });
      expect(row?.emailVerifiedAt).toBeNull();
    });

    it('menyimpan foto profil dari Google', async () => {
      const res = await auth.loginWithGoogle(profile());
      expect(res.user.avatarUrl).toBe('https://example.com/foto.jpg');
    });
  });

  describe('Pengguna yang sudah pernah masuk lewat Google', () => {
    it('dikenali dari googleId, tidak membuat akun kedua', async () => {
      const p = profile();

      const first = await auth.loginWithGoogle(p);
      const second = await auth.loginWithGoogle(p);

      expect(second.user.id).toBe(first.user.id);

      const count = await prisma.user.count({ where: { email: p.email } });
      expect(count).toBe(1);
    });

    it('memperbarui waktu login terakhir', async () => {
      const p = profile();
      const created = await auth.loginWithGoogle(p);

      await new Promise((r) => setTimeout(r, 10));
      await auth.loginWithGoogle(p);

      const row = await prisma.user.findUnique({ where: { id: created.user.id } });
      expect(row?.lastLoginAt).toBeTruthy();
    });

    it('menolak akun yang dinonaktifkan', async () => {
      const p = profile();
      const created = await auth.loginWithGoogle(p);

      await prisma.user.update({
        where: { id: created.user.id },
        data: { isActive: false },
      });

      await expect(auth.loginWithGoogle(p)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Penautan ke akun berpassword', () => {
    it('menautkan bila email sudah terdaftar dan terverifikasi Google', async () => {
      const email = `tautan-${stamp()}@testcraft.id`;
      const existing = await auth.register({
        name: 'Sudah Punya Password',
        email,
        password: 'Rahasia123',
      });

      const linked = await auth.loginWithGoogle(
        profile({ email, emailVerified: true }),
      );

      expect(linked.user.id).toBe(existing.user.id);

      const row = await prisma.user.findUnique({ where: { id: existing.user.id } });
      expect(row?.googleId).toBeTruthy();
      // Password lama tetap ada — pengguna boleh memakai keduanya.
      expect(row?.passwordHash).toBeTruthy();
    });

    it('menolak penautan bila email Google belum terverifikasi', async () => {
      const email = `belum-verif-${stamp()}@testcraft.id`;
      await auth.register({ name: 'Calon Korban', email, password: 'Rahasia123' });

      // Tanpa penjagaan ini, siapa pun yang membuat akun Google dengan alamat
      // orang lain bisa mengambil alih akun berpassword.
      await expect(
        auth.loginWithGoogle(profile({ email, emailVerified: false })),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('menolak penautan ke akun yang dinonaktifkan', async () => {
      const email = `nonaktif-google-${stamp()}@testcraft.id`;
      const created = await auth.register({
        name: 'Dinonaktifkan',
        email,
        password: 'Rahasia123',
      });

      await prisma.user.update({
        where: { id: created.user.id },
        data: { isActive: false },
      });

      await expect(
        auth.loginWithGoogle(profile({ email, emailVerified: true })),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Pemetaan profil dari Google', () => {
    let strategy: GoogleStrategy;

    beforeAll(() => {
      // Strategi tidak terdaftar di container ketika kredensial kosong,
      // jadi dibuat manual dengan konfigurasi tiruan.
      const config = {
        get: (key: string) =>
          ({
            'google.clientId': 'uji-client-id',
            'google.clientSecret': 'uji-secret',
            'google.callbackUrl': 'http://localhost:4001/api/v1/auth/google/callback',
          })[key],
      } as unknown as ConfigService;

      strategy = new GoogleStrategy(config);
    });

    const googleProfile = (over: Partial<Profile> = {}) =>
      ({
        id: '1234567890',
        displayName: 'Arief Rahman',
        emails: [{ value: 'Arief@Example.COM', verified: true }],
        photos: [{ value: 'https://example.com/a.jpg' }],
        ...over,
      }) as Profile;

    it('memetakan profil lengkap', () => {
      const done = jest.fn();
      strategy.validate('a', 'r', googleProfile(), done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          googleId: '1234567890',
          email: 'arief@example.com', // dinormalkan ke huruf kecil
          name: 'Arief Rahman',
          avatarUrl: 'https://example.com/a.jpg',
          emailVerified: true,
        }),
      );
    });

    it('memakai bagian depan email bila nama tidak dikirim', () => {
      const done = jest.fn();
      strategy.validate('a', 'r', googleProfile({ displayName: '' }), done);

      expect(done.mock.calls[0][1]).toMatchObject({ name: 'Arief' });
    });

    it('menganggap terverifikasi kecuali Google menyatakan sebaliknya', () => {
      const done = jest.fn();
      strategy.validate(
        'a',
        'r',
        googleProfile({ emails: [{ value: 'x@y.com', verified: false }] }),
        done,
      );
      expect(done.mock.calls[0][1]).toMatchObject({ emailVerified: false });

      const done2 = jest.fn();
      strategy.validate(
        'a',
        'r',
        googleProfile({ emails: [{ value: 'x@y.com' }] as Profile['emails'] }),
        done2,
      );
      expect(done2.mock.calls[0][1]).toMatchObject({ emailVerified: true });
    });

    it('menolak profil tanpa email', () => {
      const done = jest.fn();
      strategy.validate('a', 'r', googleProfile({ emails: undefined }), done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);
    });

    it('tidak jatuh ketika foto tidak ada', () => {
      const done = jest.fn();
      strategy.validate('a', 'r', googleProfile({ photos: undefined }), done);

      expect(done.mock.calls[0][1]).toMatchObject({ avatarUrl: undefined });
    });
  });
});
