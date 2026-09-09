'use client';

import {
  Award,
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Search,
  User,
} from 'lucide-react';
import { WorkspaceShell, type NavSection } from '@/components/workspace/workspace-shell';

// Menu siswa — disusun mengikuti alur belajar: pantau → belajar → tugas → hasil.
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/dashboard', labelKey: 'menu.overview', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/classes', labelKey: 'menu.myClasses', icon: BookOpen },
      { href: '/dashboard/assignments', labelKey: 'menu.assignments', icon: ClipboardList },
      { href: '/dashboard/certificates', labelKey: 'menu.certificates', icon: Award },
    ],
  },
  {
    titleKey: 'ws.account',
    items: [
      { href: '/dashboard/billing', labelKey: 'menu.billing', icon: CreditCard },
      { href: '/dashboard/profile', labelKey: 'menu.profile', icon: User },
      { href: '/catalog', labelKey: 'menu.exploreClasses', icon: Search },
    ],
  },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceShell
      sections={SECTIONS}
      allowed={['STUDENT', 'CORPORATE_ADMIN', 'INSTRUCTOR', 'ADMIN']}
      titleKey="ws.studentTitle"
    >
      {children}
    </WorkspaceShell>
  );
}
