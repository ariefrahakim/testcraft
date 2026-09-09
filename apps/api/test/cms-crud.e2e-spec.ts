import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, bearer, CREDENTIALS, createTestApp } from './helpers';

/**
 * CRUD lengkap seluruh entitas CMS.
 *
 * Setiap entitas diuji dengan siklus penuh buat → baca → ubah → hapus,
 * plus jalur negatifnya, karena inilah yang dipakai admin setiap hari dan
 * kesalahan di sini langsung terlihat pengunjung situs.
 */
describe('CMS — CRUD lengkap (e2e)', () => {
  let app: INestApplication;
  let admin: string;
  let student: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = async (creds: { email: string; password: string }) =>
      (await request(app.getHttpServer()).post(api('/auth/login')).send(creds)).body
        .tokens.accessToken as string;

    admin = await login(CREDENTIALS.admin);
    student = await login(CREDENTIALS.student);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const stamp = () => Date.now() + Math.floor(Math.random() * 1000);

  describe('Kategori', () => {
    let id: string;

    it('membuat kategori', async () => {
      const res = await request(server())
        .post(api('/categories'))
        .set(bearer(admin))
        .send({ name: `Kategori ${stamp()}`, slug: `kategori-${stamp()}`, icon: '🧪' })
        .expect(201);

      id = res.body.id;
      expect(res.body.icon).toBe('🧪');
    });

    it('tampil di daftar publik dengan jumlah kursus', async () => {
      const res = await request(server()).get(api('/categories')).expect(200);
      const found = res.body.find((c: { id: string }) => c.id === id);
      expect(found.courseCount).toBe(0);
    });

    it('memperbarui kategori', async () => {
      await request(server())
        .patch(api(`/categories/${id}`))
        .set(bearer(admin))
        .send({ featured: true, order: 99 })
        .expect(200)
        .expect((r) => expect(r.body.featured).toBe(true));
    });

    it('menolak slug ganda', async () => {
      // Nama maupun slug sama-sama unik di skema, jadi keduanya diberi
      // penanda waktu agar test tetap bisa dijalankan berulang kali.
      const slug = `duplikat-${stamp()}`;
      await request(server())
        .post(api('/categories'))
        .set(bearer(admin))
        .send({ name: `Kategori Awal ${stamp()}`, slug })
        .expect(201);

      await request(server())
        .post(api('/categories'))
        .set(bearer(admin))
        .send({ name: `Kategori Kedua ${stamp()}`, slug })
        .expect(409)
        .expect((r) => expect(r.body.code).toBe('db.duplicate'));
    });

    it('menghapus kategori', async () => {
      await request(server())
        .delete(api(`/categories/${id}`))
        .set(bearer(admin))
        .expect(200);
    });

    it('menolak siswa mengelola kategori', async () => {
      await request(server())
        .post(api('/categories'))
        .set(bearer(student))
        .send({ name: `Kategori Siswa ${stamp()}`, slug: `kategori-siswa-${stamp()}` })
        .expect(403);
    });
  });

  describe('Paket harga', () => {
    let id: string;

    it('membuat paket', async () => {
      const res = await request(server())
        .post(api('/cms/pricing-plans'))
        .set(bearer(admin))
        .send({
          slug: `paket-${stamp()}`,
          name: 'Paket Uji',
          priceIDR: 500_000,
          priceUSD: 32,
          features: ['Fitur A', 'Fitur B'],
          active: true,
        })
        .expect(201);

      id = res.body.id;
      expect(res.body.features).toHaveLength(2);
    });

    it('paket aktif tampil di endpoint publik', async () => {
      const res = await request(server()).get(api('/content/pricing-plans')).expect(200);
      expect(res.body.some((p: { id: string }) => p.id === id)).toBe(true);
    });

    it('paket nonaktif hilang dari endpoint publik', async () => {
      await request(server())
        .patch(api(`/cms/pricing-plans/${id}`))
        .set(bearer(admin))
        .send({ active: false })
        .expect(200);

      const res = await request(server()).get(api('/content/pricing-plans'));
      expect(res.body.some((p: { id: string }) => p.id === id)).toBe(false);
    });

    it('menghapus paket', async () => {
      await request(server())
        .delete(api(`/cms/pricing-plans/${id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Testimoni', () => {
    let id: string;

    it('membuat testimoni unggulan', async () => {
      const res = await request(server())
        .post(api('/cms/testimonials'))
        .set(bearer(admin))
        .send({
          name: 'Alumni Uji',
          role: 'QA Engineer',
          company: 'PT Uji',
          quote: 'Kelasnya sangat membantu karier saya.',
          rating: 5,
          featured: true,
        })
        .expect(201);

      id = res.body.id;
    });

    it('hanya yang unggulan tampil di beranda', async () => {
      const featured = await request(server())
        .get(api('/content/testimonials?featured=true'))
        .expect(200);
      expect(featured.body.some((t: { id: string }) => t.id === id)).toBe(true);

      await request(server())
        .patch(api(`/cms/testimonials/${id}`))
        .set(bearer(admin))
        .send({ featured: false })
        .expect(200);

      const after = await request(server()).get(api('/content/testimonials?featured=true'));
      expect(after.body.some((t: { id: string }) => t.id === id)).toBe(false);
    });

    it('menolak rating di luar 1–5', async () => {
      await request(server())
        .post(api('/cms/testimonials'))
        .set(bearer(admin))
        .send({ name: 'X', quote: 'Kutipan cukup panjang', rating: 9 })
        .expect(400);
    });

    it('menghapus testimoni', async () => {
      await request(server())
        .delete(api(`/cms/testimonials/${id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('FAQ', () => {
    let id: string;

    it('membuat FAQ sebagai draf', async () => {
      const res = await request(server())
        .post(api('/cms/faqs'))
        .set(bearer(admin))
        .send({
          question: 'Pertanyaan uji?',
          answer: 'Jawaban uji.',
          group: 'uji',
          published: false,
        })
        .expect(201);
      id = res.body.id;
    });

    it('draf tidak tampil di publik, terbit tampil', async () => {
      const draft = await request(server()).get(api('/content/faqs')).expect(200);
      expect(draft.body.some((f: { id: string }) => f.id === id)).toBe(false);

      await request(server())
        .patch(api(`/cms/faqs/${id}`))
        .set(bearer(admin))
        .send({ published: true })
        .expect(200);

      const live = await request(server()).get(api('/content/faqs'));
      expect(live.body.some((f: { id: string }) => f.id === id)).toBe(true);
    });

    it('admin melihat draf maupun terbit', async () => {
      const res = await request(server())
        .get(api('/cms/faqs'))
        .set(bearer(admin))
        .expect(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('menghapus FAQ', async () => {
      await request(server())
        .delete(api(`/cms/faqs/${id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Menu navigasi', () => {
    let id: string;

    it('membuat item menu', async () => {
      const res = await request(server())
        .post(api('/cms/navigation'))
        .set(bearer(admin))
        .send({ menu: 'header', label: 'Menu Uji', url: '/uji', order: 9 })
        .expect(201);
      id = res.body.id;
    });

    it('tersaring berdasarkan nama menu', async () => {
      const res = await request(server())
        .get(api('/content/navigation?menu=header'))
        .expect(200);
      expect(res.body.every((n: { menu: string }) => n.menu === 'header')).toBe(true);
    });

    it('item tersembunyi tidak ikut tampil', async () => {
      await request(server())
        .patch(api(`/cms/navigation/${id}`))
        .set(bearer(admin))
        .send({ visible: false })
        .expect(200);

      const res = await request(server()).get(api('/content/navigation'));
      expect(res.body.some((n: { id: string }) => n.id === id)).toBe(false);
    });

    it('menghapus item menu', async () => {
      await request(server())
        .delete(api(`/cms/navigation/${id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Halaman', () => {
    let id: string;
    const slug = `halaman-uji-${stamp()}`;

    it('membuat halaman draf beserta bloknya', async () => {
      const res = await request(server())
        .post(api('/cms/pages'))
        .set(bearer(admin))
        .send({
          slug,
          title: 'Halaman Uji',
          status: 'DRAFT',
          blocks: [
            { type: 'HERO', order: 0, data: { heading: 'Halo' } },
            { type: 'CTA', order: 1, data: { heading: 'Ayo mulai' } },
          ],
        })
        .expect(201);

      id = res.body.id;
      expect(res.body.blocks).toHaveLength(2);
    });

    it('draf tidak bisa diakses publik', async () => {
      await request(server())
        .get(api(`/content/pages/${slug}`))
        .expect(404)
        .expect((r) => expect(r.body.code).toBe('page.notFound'));
    });

    it('terbit lewat endpoint publish', async () => {
      await request(server())
        .post(api(`/cms/pages/${id}/publish`))
        .set(bearer(admin))
        .expect(201);

      const res = await request(server()).get(api(`/content/pages/${slug}`)).expect(200);
      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.publishedAt).toBeTruthy();
    });

    it('daftar halaman bisa disaring per status', async () => {
      const res = await request(server())
        .get(api('/cms/pages?status=PUBLISHED'))
        .set(bearer(admin))
        .expect(200);
      expect(res.body.every((p: { status: string }) => p.status === 'PUBLISHED')).toBe(true);
    });

    it('mengubah blok mengganti seluruh isinya', async () => {
      const res = await request(server())
        .patch(api(`/cms/pages/${id}`))
        .set(bearer(admin))
        .send({
          title: 'Judul Baru',
          blocks: [{ type: 'FAQ', order: 0, visible: true, data: {} }],
        })
        .expect(200);

      expect(res.body.title).toBe('Judul Baru');
      expect(res.body.blocks).toHaveLength(1);
      expect(res.body.blocks[0].type).toBe('FAQ');
    });

    it('menolak halaman yang tidak ada', async () => {
      await request(server())
        .patch(api('/cms/pages/id-tidak-ada'))
        .set(bearer(admin))
        .send({ title: 'X' })
        .expect(404);
    });

    it('menghapus halaman', async () => {
      await request(server())
        .delete(api(`/cms/pages/${id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Media', () => {
    it('daftar media bisa disaring per folder', async () => {
      await request(server()).get(api('/cms/media')).set(bearer(admin)).expect(200);
      await request(server())
        .get(api('/cms/media?folder=kursus'))
        .set(bearer(admin))
        .expect(200)
        .expect((r) => expect(Array.isArray(r.body)).toBe(true));
    });
  });

  describe('Banner', () => {
    it('banner terjadwal di masa depan belum tampil', async () => {
      const key = `jadwal-${stamp()}`;
      const besok = new Date(Date.now() + 86_400_000).toISOString();

      const created = await request(server())
        .post(api('/cms/banners'))
        .set(bearer(admin))
        .send({ key, title: 'Nanti', active: true, startsAt: besok })
        .expect(201);

      const res = await request(server()).get(api('/content/banners'));
      expect(res.body.some((b: { key: string }) => b.key === key)).toBe(false);

      await request(server())
        .delete(api(`/cms/banners/${created.body.id}`))
        .set(bearer(admin))
        .expect(200);
    });

    it('banner yang sudah lewat tidak tampil', async () => {
      const key = `lewat-${stamp()}`;
      const kemarin = new Date(Date.now() - 86_400_000).toISOString();

      const created = await request(server())
        .post(api('/cms/banners'))
        .set(bearer(admin))
        .send({ key, title: 'Sudah lewat', active: true, endsAt: kemarin })
        .expect(201);

      const res = await request(server()).get(api('/content/banners'));
      expect(res.body.some((b: { key: string }) => b.key === key)).toBe(false);

      await request(server())
        .delete(api(`/cms/banners/${created.body.id}`))
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Kupon — jalur negatif', () => {
    it('menolak kupon yang belum mulai berlaku', async () => {
      const code = `NANTI${stamp()}`;
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({
          code,
          discountType: 'PERCENT',
          value: 20,
          active: true,
          startsAt: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .expect(201);

      const course = await request(server()).get(api('/courses/ai-for-testing'));
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Kupon',
          email: `kupon-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('coupon.invalid'));
    });

    it('menolak maxUses di bawah 1', async () => {
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({ code: `NOL${stamp()}`, discountType: 'PERCENT', value: 10, maxUses: 0 })
        .expect(400);
    });

    it('menolak kupon setelah kuotanya benar-benar habis terpakai', async () => {
      const code = `HABIS${stamp()}`;
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({ code, discountType: 'PERCENT', value: 10, maxUses: 1, active: true })
        .expect(201);

      const course = await request(server()).get(api('/courses/k6-performance'));

      const register = async (label: string) =>
        (
          await request(server())
            .post(api('/auth/register'))
            .send({
              name: label,
              email: `${label}-${stamp()}@testcraft.id`.toLowerCase(),
              password: 'Rahasia123',
            })
        ).body.tokens.accessToken as string;

      // Pembeli pertama memakai kupon lalu melunasi — usedCount menjadi 1.
      const first = await register('kuota-satu');
      const checkout = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(first))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(201);

      await request(server())
        .post(api('/payments/webhook/midtrans'))
        .send({ invoiceNo: checkout.body.invoiceNo, transactionStatus: 'settlement' })
        .expect(201);

      // Pembeli kedua kehabisan kuota.
      const second = await register('kuota-dua');
      await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(second))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('coupon.exhausted'));
    });

    it('menolak kupon yang belum memenuhi minimum belanja', async () => {
      const code = `MINIMUM${stamp()}`;
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({
          code,
          discountType: 'FIXED_IDR',
          value: 50_000,
          minPurchaseIDR: 99_000_000,
          active: true,
        })
        .expect(201);

      const course = await request(server()).get(api('/courses/ai-for-testing'));
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Minimum',
          email: `min-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('coupon.minPurchase'));
    });

    it('menolak kupon yang tidak berlaku untuk kursus terpilih', async () => {
      const code = `KHUSUS${stamp()}`;
      const lain = await request(server()).get(api('/courses/postman-api'));

      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({
          code,
          discountType: 'PERCENT',
          value: 15,
          active: true,
          appliesToCourseIds: [lain.body.id],
        })
        .expect(201);

      const course = await request(server()).get(api('/courses/ai-for-testing'));
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Khusus',
          email: `khusus-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(400)
        .expect((r) => expect(r.body.code).toBe('coupon.notApplicable'));
    });

    it('diskon nominal tidak boleh melebihi subtotal', async () => {
      const code = `BESAR${stamp()}`;
      await request(server())
        .post(api('/cms/coupons'))
        .set(bearer(admin))
        .send({
          code,
          discountType: 'FIXED_IDR',
          value: 999_999_999,
          active: true,
        })
        .expect(201);

      const course = await request(server()).get(api('/courses/ai-for-testing'));
      const buyer = await request(server())
        .post(api('/auth/register'))
        .send({
          name: 'Uji Besar',
          email: `besar-${stamp()}@testcraft.id`,
          password: 'Rahasia123',
        });

      const res = await request(server())
        .post(api('/payments/checkout'))
        .set(bearer(buyer.body.tokens.accessToken))
        .send({ courseIds: [course.body.id], couponCode: code })
        .expect(201);

      // Total tidak boleh negatif.
      expect(res.body.discount).toBe(res.body.subtotal);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });
  });
});
