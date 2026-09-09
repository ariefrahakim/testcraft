export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  google: {
    clientId?: string;
    clientSecret?: string;
    callbackUrl: string;
    /** True bila client id & secret sudah terisi. */
    enabled: boolean;
  };
  urls: { web: string; api: string };
  storage: {
    driver: 'local' | 's3';
    localDir: string;
    s3Bucket?: string;
    s3Region?: string;
  };
  payments: {
    midtransServerKey?: string;
    midtransClientKey?: string;
    xenditSecretKey?: string;
    stripeSecretKey?: string;
  };
  email: { resendApiKey?: string; from: string };
  seedAdmin: { email: string; password: string };
}

const split = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: split(process.env.CORS_ORIGINS) .length
    ? split(process.env.CORS_ORIGINS)
    : ['http://localhost:3000'],
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || undefined,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || undefined,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      `${process.env.API_URL ?? 'http://localhost:4001'}/${
        process.env.API_PREFIX ?? 'api/v1'
      }/auth/google/callback`,
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  urls: {
    web: process.env.WEB_URL ?? 'http://localhost:3000',
    api: process.env.API_URL ?? 'http://localhost:4001',
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER as 'local' | 's3') ?? 'local',
    localDir: process.env.STORAGE_LOCAL_DIR ?? 'uploads',
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
  },
  payments: {
    midtransServerKey: process.env.MIDTRANS_SERVER_KEY,
    midtransClientKey: process.env.MIDTRANS_CLIENT_KEY,
    xenditSecretKey: process.env.XENDIT_SECRET_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM ?? 'TestCraft <no-reply@testcraft.id>',
  },
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@testcraft.id',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin#12345',
  },
});
