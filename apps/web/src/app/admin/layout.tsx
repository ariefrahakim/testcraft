'use client';

import {
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  Megaphone,
  Settings,
  Tag,
  Ticket,
  UserCog,
  Users,
} from 'lucide-react';
import { WorkspaceShell, type NavSection } from '@/components/workspace/workspace-shell';

/**
 * Menu admin dikelompokkan per pekerjaan, bukan per tabel database:
 * Konten (CMS) · Akademik (kelas & penilaian) · Komersial (harga) · Orang · Sistem.
 */
const SECTIONS: NavSection[] = [
  {
    items: [{ href: '/admin', labelKey: 'menu.overview', icon: LayoutDashboard, exact: true }],
  },
  {
    titleKey: 'ws.contentCms',
    items: [
      { href: '/admin/pages', labelKey: 'menu.pages', icon: FileText },
      { href: '/admin/banners', labelKey: 'menu.banners', icon: Megaphone },
      { href: '/admin/testimonials', labelKey: 'menu.testimonials', icon: MessageSquareQuote },
      { href: '/admin/faqs', labelKey: 'menu.faqs', icon: HelpCircle },
      { href: '/admin/media', labelKey: 'menu.media', icon: ImageIcon },
    ],
  },
  {
    titleKey: 'ws.academic',
    items: [
      { href: '/admin/courses', labelKey: 'menu.courses', icon: BookOpen },
      { href: '/admin/categories', labelKey: 'menu.categories', icon: Layers },
      { href: '/admin/assignments', labelKey: 'menu.assignmentsCms', icon: ClipboardList },
    ],
  },
  {
    titleKey: 'ws.commercial',
    items: [
      { href: '/admin/pricing', labelKey: 'menu.coursePricing', icon: Tag },
      { href: '/admin/plans', labelKey: 'menu.plans', icon: CreditCard },
      { href: '/admin/coupons', labelKey: 'menu.coupons', icon: Ticket },
      { href: '/admin/payments', labelKey: 'menu.payments', icon: CreditCard },
    ],
  },
  {
    titleKey: 'ws.peopleSystem',
    items: [
      { href: '/admin/users', labelKey: 'menu.users', icon: Users },
      { href: '/admin/leads', labelKey: 'menu.leads', icon: UserCog },
      { href: '/admin/settings', labelKey: 'menu.settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceShell
      sections={SECTIONS}
      allowed={['ADMIN', 'SUPER_ADMIN']}
      titleKey="ws.adminTitle"
    >
      {children}
    </WorkspaceShell>
  );
}
