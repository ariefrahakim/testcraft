import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test first, fallback to .env
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './specs',
  outputDir: './results/artifacts',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 3 : 0,
  workers: isCI ? 2 : undefined,
  reporter: process.env.QASE_MODE === 'testops'
    ? [
        ['list'],
        ['html', { outputFolder: 'results/html-report', open: 'never' }],
        ['json', { outputFile: 'results/results.json' }],
        ['playwright-qase-reporter', {
          mode: 'testops',
          testops: {
            api: { token: process.env.QASE_TOKEN },
            project: process.env.QASE_PROJECT ?? 'TC',
            run: {
              title: process.env.QASE_RUN_TITLE ?? `Playwright Run ${new Date().toISOString().slice(0, 16)}`,
              complete: true,
            },
            uploadAttachments: true,
          },
        }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'results/html-report', open: 'never' }],
        ['json', { outputFile: 'results/results.json' }],
      ],
  globalSetup: require.resolve('./global-setup'),
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  },
  projects: [
    // — Auth setup projects (storageState seeding) —
    {
      name: 'setup:student',
      testMatch: /.*auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // — Main test projects —
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup:student'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup:student'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup:student'],
    },
    // — API tests run without a browser project —
    {
      name: 'api',
      testMatch: /specs\/api\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    // — Marketing site tests use a different baseURL —
    {
      name: 'marketing',
      testMatch: /specs\/marketing\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.MARKETING_URL ?? 'http://localhost:3001',
      },
    },
  ],
});
