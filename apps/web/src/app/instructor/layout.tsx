'use client';

import {
  Award,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Video,
  Wallet,
} from 'lucide-react';
import { WorkspaceShell, type NavSection } from '@/components/workspace/workspace-shell';
import { useApi } from '@/lib/use-api';

interface PendingSummary {
  assignmentId: string;
  pending: number;
}

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  // Lencana jumlah tugas menunggu dinilai — kekurangan utama LMS mentor lain
  // adalah angka ini hanya muncul di dalam halaman, bukan di menu.
  const { data } = useApi<PendingSummary[]>('/instructor/submissions/pending-summary');
  const pending = (data ?? []).reduce((n, r) => n + r.pending, 0);

  const sections: NavSection[] = [
    {
      items: [
        { href: '/instructor', labelKey: 'menu.overview', icon: LayoutDashboard, exact: true },
        { href: '/instructor/courses', labelKey: 'menu.myClasses', icon: BookOpen },
        {
          href: '/instructor/grading',
          labelKey: 'menu.grading',
          icon: ClipboardCheck,
          badge: pending,
        },
        { href: '/instructor/feedback', labelKey: 'menu.feedback', icon: MessageSquare },
      ],
    },
    {
      titleKey: 'ws.materialsResults',
      items: [
        { href: '/instructor/content', labelKey: 'menu.content', icon: Video },
        { href: '/instructor/certificates', labelKey: 'menu.certificates', icon: Award },
        { href: '/instructor/payouts', labelKey: 'menu.payouts', icon: Wallet },
      ],
    },
  ];

  return (
    <WorkspaceShell
      sections={sections}
      allowed={['INSTRUCTOR', 'ADMIN']}
      titleKey="ws.instructorTitle"
    >
      {children}
    </WorkspaceShell>
  );
}
