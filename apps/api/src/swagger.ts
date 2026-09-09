import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('TestCraft Indonesia LMS API')
    .setDescription(
      [
        'REST API untuk platform LMS TestCraft Indonesia.',
        '',
        '### Autentikasi',
        'Semua endpoint memerlukan header `Authorization: Bearer <accessToken>`',
        'kecuali yang bertanda **Public**. Access token berlaku 15 menit;',
        'gunakan `POST /auth/refresh` untuk memperbarui (refresh token dirotasi',
        'setiap kali dipakai).',
        '',
        '### Format error',
        '```json',
        '{',
        '  "statusCode": 400,',
        '  "message": ["email harus berupa alamat email yang valid"],',
        '  "error": "Bad Request",',
        '  "path": "/api/v1/auth/register",',
        '  "timestamp": "2026-07-27T03:21:00.000Z"',
        '}',
        '```',
        '',
        '### Paginasi',
        'Endpoint list menerima `?page=1&limit=20&q=kata-kunci` dan mengembalikan',
        '`{ data: [...], meta: { page, limit, total, totalPages, hasNext, hasPrev } }`.',
        '',
        '### Rate limit',
        '120 request per menit per IP.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .setContact(
      'TestCraft Indonesia',
      'https://wa.me/6282395568743',
      'testcraftindonesia@gmail.com',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addServer('http://localhost:4000/api/v1', 'Local development')
    .addServer('https://api.testcraft.id/api/v1', 'Production')
    .addTag('Health', 'Status layanan')
    .addTag('Auth', 'Registrasi, login, refresh token')
    .addTag('Users', 'Profil pengguna & manajemen user')
    .addTag('Instructors', 'Data instruktur')
    .addTag('Categories', 'Kategori kursus')
    .addTag('Courses', 'Katalog & manajemen kursus')
    .addTag('Enrollments', 'Pendaftaran kursus & progres belajar')
    .addTag('Payments', 'Checkout, invoice, dan webhook pembayaran')
    .addTag('Content (Public)', 'Konten CMS untuk halaman publik')
    .addTag('CMS (Admin)', 'Pengelolaan konten, harga, kupon, dan pengaturan')
    .addTag('Analytics', 'Statistik untuk dashboard admin')
    .addTag('Leads', 'Prospek dari form landing page')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'TestCraft LMS API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
  });
  return document;
}
