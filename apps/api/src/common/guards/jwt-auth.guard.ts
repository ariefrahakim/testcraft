import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * Guard global: semua endpoint butuh Bearer token kecuali ditandai @Public().
 *
 * Pada endpoint publik, token TETAP diperiksa bila dikirim — hanya saja
 * ketiadaannya tidak menolak permintaan. Ini penting untuk endpoint yang
 * jawabannya berbeda bagi staf, misalnya `GET /courses/:slug` yang boleh
 * menampilkan kursus draf kepada admin tetapi tidak kepada pengunjung.
 * Tanpa ini, `req.user` selalu kosong di rute publik dan admin ikut melihat
 * versi pengunjung.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return (await super.canActivate(context)) as boolean;
    }

    // Rute publik: coba autentikasi secara diam-diam.
    try {
      await super.canActivate(context);
    } catch {
      // Token tidak ada, kedaluwarsa, atau tidak valid — tetap dilanjutkan
      // sebagai pengunjung anonim.
    }
    return true;
  }

  /**
   * Dipanggil Passport setelah strategi selesai. Pada rute publik, ketiadaan
   * user bukan error sehingga tidak boleh melempar.
   */
  handleRequest<TUser>(err: unknown, user: TUser, _info: unknown, context: ExecutionContext): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return (user || undefined) as TUser;
    return super.handleRequest(err, user, _info, context);
  }
}
