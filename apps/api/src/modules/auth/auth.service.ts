import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import type { GoogleProfile } from './google.strategy';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  avatarUrl: true,
  xp: true,
  level: true,
  streakDays: true,
  companyId: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) throw new ConflictException('auth.emailTaken');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        phone: dto.phone,
        passwordHash: await argon2.hash(dto.password),
        role: 'STUDENT',
      },
      select: USER_SELECT,
    });

    return { user, tokens: await this.issueTokens(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { ...USER_SELECT, passwordHash: true, isActive: true },
    });

    // Pesan error sengaja disamakan agar tidak membocorkan email terdaftar.
    if (!user?.passwordHash) {
      throw new UnauthorizedException('auth.invalidCredentials');
    }
    if (!(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('auth.invalidCredentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('auth.accountInactive');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _ph, isActive: _ia, ...profile } = user;
    return {
      user: profile,
      tokens: await this.issueTokens(user.id, user.email, user.role),
    };
  }

  /**
   * Masuk atau mendaftar lewat Google.
   *
   * Tiga kemungkinan keadaan:
   * 1. googleId sudah dikenal        → langsung masuk
   * 2. email sudah terdaftar (password) → akun ditautkan ke googleId
   * 3. benar-benar baru              → buat akun STUDENT
   *
   * Penautan berdasarkan email aman di sini karena Google sudah memverifikasi
   * kepemilikan email tersebut; bila `emailVerified` false, penautan ditolak.
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResponseDto> {
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
      select: { ...USER_SELECT, isActive: true },
    });

    if (existingByGoogleId) {
      if (!existingByGoogleId.isActive) {
        throw new UnauthorizedException('auth.accountInactive');
      }
      await this.prisma.user.update({
        where: { id: existingByGoogleId.id },
        data: { lastLoginAt: new Date() },
      });
      const { isActive: _ia, ...user } = existingByGoogleId;
      return {
        user,
        tokens: await this.issueTokens(user.id, user.email, user.role),
      };
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
      select: { id: true, isActive: true },
    });

    if (existingByEmail) {
      if (!profile.emailVerified) {
        throw new UnauthorizedException('auth.googleEmailUnverified');
      }
      if (!existingByEmail.isActive) {
        throw new UnauthorizedException('auth.accountInactive');
      }

      const linked = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          lastLoginAt: new Date(),
          emailVerifiedAt: new Date(),
          // Avatar hanya diisi bila pengguna belum punya.
          ...(profile.avatarUrl ? {} : {}),
        },
        select: USER_SELECT,
      });
      return {
        user: linked,
        tokens: await this.issueTokens(linked.id, linked.email, linked.role),
      };
    }

    const created = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        role: 'STUDENT',
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        lastLoginAt: new Date(),
      },
      select: USER_SELECT,
    });

    return {
      user: created,
      tokens: await this.issueTokens(created.id, created.email, created.role),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('auth.refreshInvalid');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('auth.refreshExpired');
    }

    // Rotasi: token lama langsung dicabut agar tidak bisa dipakai ulang.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: USER_SELECT,
    });
    return { user, tokens: await this.issueTokens(user.id, user.email, user.role) };
  }

  async logout(userId: string, refreshToken?: string): Promise<{ ok: true }> {
    await this.prisma.refreshToken.updateMany({
      where: refreshToken
        ? { userId, tokenHash: hashToken(refreshToken), revokedAt: null }
        : { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SELECT,
    });
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessTtl = this.config.get<string>('jwt.accessTtl')!;
    const refreshTtl = this.config.get<string>('jwt.refreshTtl')!;

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: randomBytes(16).toString('hex') },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: refreshTtl },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlToMs(refreshTtl)),
      },
    });

    return { accessToken, refreshToken, expiresIn: ttlToMs(accessTtl) / 1000 };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Mengubah notasi TTL jwt ("15m", "30d") menjadi milidetik. */
function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) return 900_000;
  const n = parseInt(m[1], 10);
  const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]]!;
  return n * unit;
}
