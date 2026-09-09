import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Footer } from '@/components/footer';
import { SiteChrome } from '@/components/site-chrome';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider, LOCALE_INIT_SCRIPT } from '@/lib/i18n';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'TestCraft Indonesia — Learn. Build. Automate.',
    template: '%s · TestCraft Indonesia',
  },
  description:
    'Akademi Software Testing, QA Automation, API Testing, Performance Testing, dan AI for QA. Diajarkan praktisi industri.',
  applicationName: 'TestCraft LMS',
  // app/icon.svg otomatis menjadi favicon; dideklarasikan eksplisit agar
  // apple-touch-icon ikut memakai lambang yang sama.
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'TestCraft Indonesia',
    title: 'TestCraft Indonesia — Learn. Build. Automate.',
    description:
      'Kursus QA automation, API testing, performance testing, dan AI for QA oleh praktisi industri.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Zoom tetap diizinkan demi aksesibilitas.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` diperlukan karena skrip di bawah mengubah
    // class dan atribut lang pada <html> sebelum React melakukan hydration.
    <html lang="id" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Berjalan sebelum paint pertama — mencegah kedipan tema terang
            saat pengguna memilih gelap. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <SiteChrome footer={<Footer />}>{children}</SiteChrome>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
