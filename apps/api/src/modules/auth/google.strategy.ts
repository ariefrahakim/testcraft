import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

/**
 * Strategi Google OAuth 2.0.
 *
 * Provider ini HANYA didaftarkan bila GOOGLE_CLIENT_ID dan
 * GOOGLE_CLIENT_SECRET terisi (lihat auth.module.ts) — supaya API tetap
 * bisa dijalankan tanpa kredensial Google saat pengembangan lokal.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('google.clientId')!,
      clientSecret: config.get<string>('google.clientSecret')!,
      callbackURL: config.get<string>('google.callbackUrl')!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0];

    if (!email?.value) {
      done(new Error('Akun Google tidak memiliki alamat email'), undefined);
      return;
    }

    const user: GoogleProfile = {
      googleId: profile.id,
      email: email.value.toLowerCase(),
      name: profile.displayName || email.value.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
      // `verified` bertipe longgar pada tipe passport, jadi dibandingkan longgar.
      emailVerified: (email as { verified?: boolean | string }).verified !== false,
    };

    done(null, user);
  }
}
