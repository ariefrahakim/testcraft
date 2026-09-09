import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Daftar Akun',
  description: 'Buat akun TestCraft gratis dan mulai belajar QA automation.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
