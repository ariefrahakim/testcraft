/**
 * Test e2e berjalan terhadap database TERPISAH (`testcraft_test`) supaya data
 * pengembangan tidak pernah tersentuh. Database disiapkan oleh
 * `test/prepare-test-db.sh` yang dipanggil dari skrip npm `test:e2e`.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://testcraft:testcraft@localhost:5433/testcraft_test?schema=public';

// Rahasia JWT khusus test — tidak boleh mewarisi nilai dari .env pengembangan.
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '1d';
