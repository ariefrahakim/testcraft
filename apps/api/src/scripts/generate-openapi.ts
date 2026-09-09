/**
 * Menghasilkan spesifikasi OpenAPI statis ke docs/openapi.json tanpa
 * menjalankan server. Dipakai CI dan generator SDK.
 *
 *   npm run docs:openapi
 */
import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AppModule } from '../app.module';
import { buildOpenApiDocument } from '../swagger';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.init();

  const document = buildOpenApiDocument(app);
  const out = resolve(__dirname, '../../../../docs/openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));

  const paths = Object.keys(document.paths).length;
  // eslint-disable-next-line no-console
  console.log(`✓ OpenAPI ditulis ke ${out} (${paths} path)`);

  await app.close();
  process.exit(0);
}

void main();
