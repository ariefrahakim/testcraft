import { FooterView } from '@/components/footer-view';
import { getSettings } from '@/lib/content';

/**
 * Pemuat data (server) — pengaturan situs diambil dari CMS lalu diserahkan
 * ke komponen tampilan yang berjalan di klien agar bisa ikut berganti bahasa.
 */
export async function Footer() {
  const settings = await getSettings();

  return (
    <FooterView
      brandName={settings.brandName}
      contactEmail={settings.contactEmail}
      whatsapp={settings.whatsapp}
      address={settings.address ?? null}
      socials={settings.socials ?? {}}
      apiDocsUrl={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1'}`.replace(
        /\/api\/v1\/?$/,
        '/docs',
      )}
    />
  );
}
