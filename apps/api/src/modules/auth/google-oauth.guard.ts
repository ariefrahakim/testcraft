import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

/**
 * Guard Google OAuth yang tetap ramah ketika kredensial belum dipasang.
 *
 * Tanpa penjagaan ini, `/auth/google` melempar 500 karena strategi 'google'
 * tidak terdaftar — membingungkan bagi yang baru menjalankan proyek. Di sini
 * pengguna dikembalikan ke halaman masuk dengan pesan yang bisa ditindaklanjuti.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const res = context.switchToHttp().getResponse<Response>();

    if (!this.config.get<boolean>('google.enabled')) {
      const web = this.config.get<string>('urls.web') ?? 'http://localhost:3000';
      res.redirect(`${web}/login?error=google_not_configured`);
      // Respons sudah dikirim. `true` dikembalikan agar Nest tidak melempar
      // ForbiddenException yang akan mencoba menulis respons kedua; handler
      // di controller memeriksa `headersSent` dan berhenti lebih awal.
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  /**
   * Kegagalan dari Google (pengguna menolak izin, state tidak cocok, dst.)
   * tidak boleh menjadi 500 — biarkan handler yang mengarahkan ulang dengan
   * pesan yang ramah.
   */
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}
