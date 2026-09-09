import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

describe('CMS (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send(CREDENTIALS.admin);
    adminToken = admin.body.tokens.accessToken;

    const student = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send(CREDENTIALS.student);
    studentToken = student.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('Harga kelas', () => {
    it('perubahan harga langsung terlihat di katalog publik', async () => {
      const before = await request(server()).get(api('/courses/postman-api')).expect(200);
      const courseId = before.body.id;
      const newPrice = before.body.priceIDR === 777_000 ? 888_000 : 777_000;

      await request(server())
        .patch(api(`/courses/${courseId}/pricing`))
        .set(bearer(adminToken))
        .send({ priceIDR: newPrice, priceUSD: 49, compareAtIDR: 1_500_000 })
        .expect(200);

      const after = await request(server()).get(api('/courses/postman-api')).expect(200);
      expect(after.body.priceIDR).toBe(newPrice);
      expect(after.body.compareAtIDR).toBe(1_500_000);
    });

    it('perubahan massal bersifat transaksional — satu id salah membatalkan semuanya', async () => {
      const list = await request(server()).get(api('/courses?limit=2'));
      const [first, second] = list.body.data;

      await request(server())
        .patch(api('/courses/pricing/bulk'))
        .set(bearer(adminToken))
        .send({
          items: [
            { courseId: first.id, priceIDR: 123_000, priceUSD: 9 },
            { courseId: 'id-yang-tidak-ada', priceIDR: 456_000, priceUSD: 29 },
          ],
        })
        .expect(404);

      // Harga kursus pertama harus tetap seperti semula.
      const check = await request(server()).get(api(`/courses/${first.slug}`));
      expect(check.body.priceIDR).toBe(first.priceIDR);
      expect(second).toBeDefined();
    });

    it('menolak harga negatif', async () => {
      const list = await request(server()).get(api('/courses?limit=1'));
      await request(server())
        .patch(api(`/courses/${list.body.data[0].id}/pricing`))
        .set(bearer(adminToken))
        .send({ priceIDR: -1000, priceUSD: 10 })
        .expect(400);
    });
  });

  describe('Kupon', () => {
    let couponId: string;
    const code = `UJI${Date.now()}`;

    it('membuat kupon dan menormalkan kode menjadi huruf kapital', async () => {
      const res = await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(adminToken))
        .send({
          code: code.toLowerCase(),
          discountType: 'PERCENT',
          value: 20,
          maxUses: 10,
          active: true,
        })
        .expect(201);

      expect(res.body.code).toBe(code.toUpperCase());
      couponId = res.body.id;
    });

    it('menolak kode kupon ganda', async () => {
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(adminToken))
        .send({ code, discountType: 'PERCENT', value: 5 })
        .expect(409);
    });

    it('memperbarui dan menghapus kupon', async () => {
      await request(server())
        .patch(api(`/cms/coupons/${couponId}`))
        .set(bearer(adminToken))
        .send({ value: 35, active: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.value).toBe(35);
          expect(res.body.active).toBe(false);
        });

      await request(server())
        .delete(api(`/cms/coupons/${couponId}`))
        .set(bearer(adminToken))
        .expect(200);
    });
  });

  describe('Blok halaman', () => {
    it('mengganti seluruh blok dan mengembalikan urutan yang benar', async () => {
      const page = await request(server())
        .get(api('/cms/pages/home'))
        .set(bearer(adminToken))
        .expect(200);

      const original = page.body.blocks.map(
        (b: { type: string; order: number; visible: boolean; data: unknown }) => ({
          type: b.type,
          order: b.order,
          visible: b.visible,
          data: b.data,
        }),
      );

      const updated = await request(server())
        .patch(api(`/cms/pages/${page.body.id}`))
        .set(bearer(adminToken))
        .send({
          blocks: [
            {
              type: 'CTA',
              order: 0,
              visible: true,
              data: { heading: 'Blok uji', ctaLabel: 'Klik', ctaUrl: '/catalog' },
            },
          ],
        })
        .expect(200);

      expect(updated.body.blocks).toHaveLength(1);
      expect(updated.body.blocks[0].type).toBe('CTA');

      // Kembalikan susunan semula agar test lain tidak terpengaruh.
      await request(server())
        .patch(api(`/cms/pages/${page.body.id}`))
        .set(bearer(adminToken))
        .send({ blocks: original })
        .expect(200);
    });

    it('endpoint publik hanya menyajikan halaman yang terbit', async () => {
      const res = await request(server()).get(api('/content/pages/home')).expect(200);
      expect(res.body.status).toBe('PUBLISHED');

      await request(server()).get(api('/content/pages/halaman-hantu')).expect(404);
    });
  });

  describe('Pengaturan situs', () => {
    it('menggabungkan perubahan tanpa menghapus field lain', async () => {
      const before = await request(server())
        .get(api('/cms/settings'))
        .set(bearer(adminToken))
        .expect(200);

      await request(server())
        .patch(api('/cms/settings'))
        .set(bearer(adminToken))
        .send({ ...before.body, taxPercent: 12 })
        .expect(200);

      const after = await request(server()).get(api('/content/settings')).expect(200);
      expect(after.body.taxPercent).toBe(12);
      expect(after.body.brandName).toBe(before.body.brandName);
      expect(after.body.whatsapp).toBe(before.body.whatsapp);

      await request(server())
        .patch(api('/cms/settings'))
        .set(bearer(adminToken))
        .send(before.body)
        .expect(200);
    });
  });

  describe('Banner', () => {
    it('hanya menampilkan banner aktif di endpoint publik', async () => {
      const key = `uji-${Date.now()}`;

      const created = await request(server())
        .post(api('/cms/banners'))
        .set(bearer(adminToken))
        .send({ key, title: 'Banner nonaktif', active: false })
        .expect(201);

      const publicList = await request(server()).get(api('/content/banners')).expect(200);
      expect(publicList.body.some((b: { key: string }) => b.key === key)).toBe(false);

      const adminList = await request(server())
        .get(api('/cms/banners'))
        .set(bearer(adminToken));
      expect(adminList.body.some((b: { key: string }) => b.key === key)).toBe(true);

      await request(server())
        .delete(api(`/cms/banners/${created.body.id}`))
        .set(bearer(adminToken))
        .expect(200);
    });
  });

  describe('Otorisasi', () => {
    it('menolak seluruh operasi tulis CMS dari siswa', async () => {
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(studentToken))
        .send({ code: 'CURANG', discountType: 'PERCENT', value: 100 })
        .expect(403);

      await request(server())
        .patch(api('/cms/settings'))
        .set(bearer(studentToken))
        .send({ taxPercent: 0 })
        .expect(403);
    });

    it('menolak siswa mengubah harga kursus', async () => {
      const list = await request(server()).get(api('/courses?limit=1'));
      await request(server())
        .patch(api(`/courses/${list.body.data[0].id}/pricing`))
        .set(bearer(studentToken))
        .send({ priceIDR: 1, priceUSD: 1 })
        .expect(403);
    });
  });
});
