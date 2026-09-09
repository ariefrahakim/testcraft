import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const REQUIRED_ENV_VARS = [
  'BASE_URL',
  'API_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'STUDENT_EMAIL',
  'STUDENT_PASSWORD',
  'INSTRUCTOR_EMAIL',
  'INSTRUCTOR_PASSWORD',
];

async function globalSetup(): Promise<void> {
  // Load environment variables from .env.test, fallback to .env.example defaults
  const envTestPath = path.resolve(__dirname, '.env.test');
  const envExamplePath = path.resolve(__dirname, '.env.example');

  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath });
    console.log('[global-setup] Loaded environment from .env.test');
  } else if (fs.existsSync(envExamplePath)) {
    dotenv.config({ path: envExamplePath });
    console.warn('[global-setup] .env.test not found — using .env.example defaults');
  }

  // Validate required env vars
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[global-setup] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
        `Copy tests/e2e/.env.example to tests/e2e/.env.test and fill in real values.`,
    );
  }

  // Optional: ping the API health endpoint to confirm the app is running
  const apiUrl = process.env.API_URL!;
  const healthUrl = `${apiUrl}/health`;

  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(
        `[global-setup] API health check returned ${res.status} — tests may fail if the server is not ready.`,
      );
    } else {
      const body = (await res.json()) as { status?: string; database?: string };
      console.log(
        `[global-setup] API is up — status="${body.status ?? 'unknown'}" database="${body.database ?? 'unknown'}"`,
      );
    }
  } catch (err) {
    console.warn(
      `[global-setup] Could not reach API at ${healthUrl} — ` +
        `make sure the API is running before executing E2E tests.\n  ${(err as Error).message}`,
    );
  }

  // Ensure results directory exists
  const resultsDir = path.resolve(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Ensure auth state directory exists
  const authDir = path.resolve(__dirname, 'results/auth-state');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
}

export default globalSetup;
