import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../../common/decorators';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  UserProfileDto,
} from './dto/auth.dto';
import { GoogleOAuthGuard } from './google-oauth.guard';
import type { GoogleProfile } from './google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Daftar akun student baru',
    description:
      'Membuat akun dengan role STUDENT dan langsung mengembalikan pasangan token.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login dengan email & password' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Tukar refresh token dengan access token baru',
    description: 'Refresh token dirotasi — token lama langsung dicabut.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cabut refresh token (satu sesi atau semua sesi)' })
  @ApiBody({ type: RefreshTokenDto, required: false })
  logout(
    @CurrentUser('id') userId: string,
    @Body() dto?: Partial<RefreshTokenDto>,
  ) {
    return this.auth.logout(userId, dto?.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil user yang sedang login' })
  @ApiOkResponse({ type: UserProfileDto })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  /* ---------------------------- Google OAuth ---------------------------- */

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  @ApiOperation({
    summary: 'Mulai alur masuk dengan Google',
    description:
      'Mengalihkan pengguna ke halaman izin Google. Bila GOOGLE_CLIENT_ID dan ' +
      'GOOGLE_CLIENT_SECRET belum diisi, pengguna dikembalikan ke halaman masuk ' +
      'dengan pesan `?error=google_not_configured`.',
  })
  google(@Res() res: Response): void {
    // Bila Google aktif, guard sudah mengalihkan ke halaman izin Google.
    // Bila tidak, guard mengalihkan ke halaman masuk dengan pesan error.
    // Kedua jalur sudah mengirim respons, jadi handler ini tidak menulis apa pun.
    if (!res.headersSent) {
      const web = this.config.get<string>('urls.web') ?? 'http://localhost:3000';
      res.redirect(`${web}/login?error=google_failed`);
    }
  }

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (res.headersSent) return;
    const web = this.config.get<string>('urls.web') ?? 'http://localhost:3000';

    try {
      const profile = req.user as GoogleProfile | undefined;
      if (!profile) {
        res.redirect(`${web}/login?error=google_failed`);
        return;
      }

      const { tokens } = await this.auth.loginWithGoogle(profile);

      // Token dikirim lewat fragment (#), bukan query (?), agar tidak ikut
      // tercatat di log server maupun header Referer.
      const fragment = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: String(tokens.expiresIn),
      });
      res.redirect(`${web}/auth/callback#${fragment.toString()}`);
    } catch (err) {
      const reason =
        err instanceof UnauthorizedException ? 'account_inactive' : 'google_failed';
      res.redirect(`${web}/login?error=${reason}`);
    }
  }
}
