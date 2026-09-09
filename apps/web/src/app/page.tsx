import { BlockRenderer } from '@/components/blocks/block-renderer';
import { PromoBanner } from '@/components/promo-banner';
import { getBanners, getPage } from '@/lib/content';

// Landing page dirender dari blok CMS halaman bernama "home".
export const revalidate = 60;

export default async function HomePage() {
  const [page, banners] = await Promise.all([getPage('home'), getBanners()]);

  return (
    <>
      {banners.map((b) => (
        <PromoBanner key={b.id} banner={b} />
      ))}

      {page?.blocks?.length ? (
        page.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
      ) : (
        <section className="container py-24 text-center">
          <h1 className="font-display text-3xl font-extrabold text-navy dark:text-white">
            TestCraft Indonesia
          </h1>
          <p className="mt-3 text-slate-500">
            Konten beranda belum dipublikasikan. Admin dapat menyusunnya di{' '}
            <span className="font-semibold">CMS → Halaman → Beranda</span>.
          </p>
        </section>
      )}
    </>
  );
}
