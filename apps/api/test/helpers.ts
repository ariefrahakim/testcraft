import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { createValidationPipe } from '../src/common/pipes/validation.pipe';

export const CREDENTIALS = {
  admin: { email: 'admin@testcraft.id', password: 'Admin#12345' },
  instructor: { email: 'sari.wulandari@testcraft.id', password: 'Instructor#123' },
  otherInstructor: { email: 'budi.santoso@testcraft.id', password: 'Instructor#123' },
  student: { email: 'student@testcraft.id', password: 'Student#123' },
} as const;

/**
 * Membangun aplikasi Nest dengan pipe & filter yang sama persis dengan
 * `main.ts`. Kalau konfigurasi produksi berubah, test ikut merasakannya.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app;
}

export const api = (path: string) => `/api/v1${path}`;

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
