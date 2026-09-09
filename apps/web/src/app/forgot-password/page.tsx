'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input } from '@/components/ui/field';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan email Anda, kami kirimkan tautan untuk membuat password baru."
      footer={
        <>
          Ingat password Anda?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Kembali masuk
          </Link>
        </>
      }
    >
      {sent ? (
        <Alert tone="success">
          Jika email tersebut terdaftar, tautan pemulihan sudah kami kirim. Periksa juga
          folder spam.
        </Alert>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // Pesan sengaja netral agar tidak membocorkan email mana yang terdaftar.
            setSent(true);
          }}
        >
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" size="lg" block>
            Kirim Tautan Pemulihan
          </Button>
          <p className="text-xs text-slate-500">
            Pengiriman email memerlukan konfigurasi RESEND_API_KEY pada layanan API.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
