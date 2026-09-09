import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Admin courses status crop', async ({ page }) => {
  const state = JSON.parse(fs.readFileSync(
    '/Users/ariefrahman/Desktop/testcraft/tests/e2e/results/auth-state/admin.json', 'utf-8'));
  for (const origin of state.origins || []) {
    await page.goto(origin.origin);
    for (const item of origin.localStorage || []) {
      await page.evaluate(({ k, v }: { k: string; v: string }) => localStorage.setItem(k, v), { k: item.name, v: item.value });
    }
  }
  await page.goto('http://localhost:3000/admin/courses', { waitUntil: 'networkidle' });
  
  // Get all status badges
  const badges = await page.locator('[class*="rounded-full"]').all();
  const statuses: string[] = [];
  for (const b of badges) {
    const text = await b.textContent();
    if (text) statuses.push(text.trim());
  }
  console.log('Status badges:', [...new Set(statuses)]);
  
  // Screenshot the table area
  await page.screenshot({
    path: path.resolve(__dirname, '../../results/exploration/admin-courses-crop.png'),
    clip: { x: 256, y: 64, width: 1024, height: 400 },
  });
});
