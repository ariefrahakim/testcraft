'use client';

import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import {
  InstagramIcon,
  LinkedInIcon,
  MastercardIcon,
  VisaIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/brand/icons';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { waLink } from '@/lib/format';

interface FooterViewProps {
  brandName: string;
  contactEmail: string;
  whatsapp: string;
  address: string | null;
  socials: Record<string, string>;
  apiDocsUrl: string;
}

const PRODUCT: Array<{ url: string; key: TranslationKey }> = [
  { url: '/catalog', key: 'footer.allCourses' },
  { url: '/paths', key: 'footer.paths' },
  { url: '/pricing', key: 'footer.pricing' },
  { url: '/corporate', key: 'footer.corporateTraining' },
];

const COMPANY: Array<{ url: string; key: TranslationKey }> = [
  { url: '/about', key: 'footer.about' },
  { url: '/verify', key: 'footer.verify' },
  { url: '/register?role=instructor', key: 'footer.becomeInstructor' },
  { url: '/terms', key: 'footer.terms' },
  { url: '/privacy', key: 'footer.privacy' },
];

export function FooterView({
  brandName,
  contactEmail,
  whatsapp,
  address,
  socials,
  apiDocsUrl,
}: FooterViewProps) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo showTagline />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            {t('footer.tagline')}
          </p>
          <div className="mt-5 flex items-center gap-3">
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            )}
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            )}
            {socials.youtube && (
              <a
                href={socials.youtube}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="YouTube"
              >
                <YouTubeIcon />
              </a>
            )}
          </div>
        </div>

        <FooterColumn title={t('footer.product')}>
          {PRODUCT.map((l) => (
            <li key={l.url}>
              <Link href={l.url} className="hover:text-primary">
                {t(l.key)}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={t('footer.company')}>
          {COMPANY.map((l) => (
            <li key={l.url}>
              <Link href={l.url} className="hover:text-primary">
                {t(l.key)}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary"
            >
              {t('footer.apiDocs')}
            </a>
          </li>
        </FooterColumn>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy dark:text-white">
            {t('footer.contact')}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li>
              <a
                href={waLink(whatsapp, 'Halo TestCraft, saya ingin bertanya.')}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2.5 hover:text-primary"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2.5 break-all hover:text-primary"
              >
                <Mail className="h-5 w-5 shrink-0" />
                {contactEmail}
              </a>
            </li>
            {address && (
              <li className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 shrink-0" />
                {address}
              </li>
            )}
          </ul>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('footer.paymentMethods')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <VisaIcon />
            <MastercardIcon />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5 dark:border-slate-800">
        <p className="container text-center text-xs text-slate-500">
          © {year} {brandName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy dark:text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-500">{children}</ul>
    </div>
  );
}
