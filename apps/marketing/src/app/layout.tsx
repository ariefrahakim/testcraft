import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0E9C9C',
}

export const metadata: Metadata = {
  title: 'TestCraft Indonesia — Quality Software. Confident Delivery.',
  description:
    'TestCraft Indonesia — perusahaan pelatihan IT untuk Software Testing, QA Automation, API & Performance Testing, dan AI for QA. QA Bootcamp, public & corporate training.',
  keywords: [
    'software testing',
    'QA engineering',
    'test automation',
    'ISTQB',
    'Playwright',
    'Selenium',
    'QA Bootcamp',
    'pelatihan QA',
    'Indonesia',
  ],
  authors: [{ name: 'TestCraft Indonesia' }],
  creator: 'TestCraft Indonesia',
  metadataBase: new URL('https://testcraft.id'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'TestCraft Indonesia',
    title: 'TestCraft Indonesia — Quality Software. Confident Delivery.',
    description:
      'Pelatihan Software Testing & QA Engineering: public training, corporate training, sertifikasi, dan QA Bootcamp.',
    url: 'https://testcraft.id',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TestCraft Indonesia — Quality Software. Confident Delivery.',
    description: 'Pelatihan Software Testing & QA Engineering terlengkap di Indonesia.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.dataset.theme=localStorage.getItem("tcw_theme")||"light"}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  )
}
