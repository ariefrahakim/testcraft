import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

/**
 * GoogleStrategy hanya didaftarkan bila kredensial tersedia. Tanpa penjagaan
 * ini, passport-google-oauth20 melempar "OAuth2Strategy requires a clientID"
 * saat aplikasi dinyalakan — API jadi mati total hanya karena fitur opsional.
 */
const googleStrategyProvider: Provider = {
  provide: GoogleStrategy,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    config.get<boolean>('google.enabled') ? new GoogleStrategy(config) : null,
};

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, googleStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
