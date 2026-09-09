import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, createTestApp } from './helpers';

describe('Katalog publik (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it('mengembalikan bentuk paginasi yang seragam', async () => {
    const res = await request(server()).get(api('/courses?limit=5')).expect(200);

    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
      hasNext: true,
      hasPrev: false,
    });
  });

  it('hanya menampilkan kursus yang sudah terbit kepada publik', async () => {
    const res = await request(server()).get(api('/courses?limit=100')).expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    for (const course of res.body.data) {
      expect(course.status).toBe('PUBLISHED');
    }
  });

  it('memfilter berdasarkan kategori', async () => {
    const res = await request(server())
      .get(api('/courses?category=api-testing&limit=50'))
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    for (const course of res.body.data) {
      expect(course.category.slug).toBe('api-testing');
    }
  });

  it('memfilter berdasarkan level', async () => {
    const res = await request(server())
      .get(api('/courses?level=ADVANCED&limit=50'))
      .expect(200);

    for (const course of res.body.data) {
      expect(course.level).toBe('ADVANCED');
    }
  });

  it('mencari berdasarkan kata kunci', async () => {
    const res = await request(server())
      .get(api('/courses?q=playwright'))
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title.toLowerCase()).toContain('playwright');
  });

  it('mengurutkan harga dari termurah', async () => {
    const res = await request(server())
      .get(api('/courses?sort=price_asc&limit=50'))
      .expect(200);

    const prices = res.body.data.map((c: { priceIDR: number }) => c.priceIDR);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('menghormati rentang harga', async () => {
    const res = await request(server())
      .get(api('/courses?minPrice=1000000&maxPrice=1300000&limit=50'))
      .expect(200);

    for (const course of res.body.data) {
      expect(course.priceIDR).toBeGreaterThanOrEqual(1_000_000);
      expect(course.priceIDR).toBeLessThanOrEqual(1_300_000);
    }
  });

  it('memberi halaman kedua yang berbeda dari halaman pertama', async () => {
    const first = await request(server()).get(api('/courses?limit=4&page=1'));
    const second = await request(server()).get(api('/courses?limit=4&page=2'));

    const firstIds = first.body.data.map((c: { id: string }) => c.id);
    const secondIds = second.body.data.map((c: { id: string }) => c.id);

    expect(secondIds.some((id: string) => firstIds.includes(id))).toBe(false);
    expect(second.body.meta.hasPrev).toBe(true);
  });

  describe('GET /courses/:slug', () => {
    it('menyertakan kurikulum tanpa membocorkan kunci jawaban kuis', async () => {
      const res = await request(server())
        .get(api('/courses/postman-api'))
        .expect(200);

      expect(res.body.slug).toBe('postman-api');
      expect(res.body.modules.length).toBeGreaterThan(0);
      expect(res.body.modules[0].lessons.length).toBeGreaterThan(0);
      expect(res.body.modules[0]).toHaveProperty('hasQuiz');

      // Detail kursus tidak boleh membawa jawaban kuis dalam bentuk apa pun.
      const payload = JSON.stringify(res.body);
      expect(payload).not.toContain('"answer"');
      expect(payload).not.toContain('"explain"');
    });

    it('meratakan data instruktur agar mudah dipakai frontend', async () => {
      const res = await request(server()).get(api('/courses/postman-api')).expect(200);

      expect(res.body.instructor).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        headline: expect.any(String),
      });
      expect(res.body.instructor).not.toHaveProperty('user');
    });

    it('mengembalikan 404 untuk slug yang tidak ada', async () => {
      await request(server()).get(api('/courses/tidak-ada-kelas-ini')).expect(404);
    });
  });

  describe('Endpoint pendukung katalog', () => {
    it('kategori menyertakan jumlah kursus terbit', async () => {
      const res = await request(server()).get(api('/categories')).expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('courseCount');
    });

    it('learning path menyertakan urutan kursusnya', async () => {
      const res = await request(server()).get(api('/learning-paths')).expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].steps.length).toBeGreaterThan(0);
      expect(res.body[0].steps[0].course).toHaveProperty('title');
    });

    it('daftar instruktur bisa diakses publik', async () => {
      const res = await request(server()).get(api('/instructors')).expect(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
