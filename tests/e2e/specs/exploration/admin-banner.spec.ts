import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Admin banner check', async ({ page }) => {
  const state = JSON.parse(fs.readFileSync(
    '/Users/ariefrahman/Desktop/testcraft/tests/e2e/results/auth-state/admin.json', 'utf-8'));
  for (const origin of state.origins || []) {
    await page.goto(origin.origin);
    for (const item of origin.localStorage || []) {
      await page.evaluate(({ k, v }: { k: string; v: string }) => localStorage.setItem(k, v), { k: item.name, v: item.value });
    }
  }
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  
  const fromNavy = page.locator('[class*="from-navy"]').first();
  console.log('Admin from-navy visible:', await fromNavy.isVisible().catch(() => false));
  
  const gradients = await page.locator('.bg-gradient-to-r').all();
  console.log('Admin gradient elements:', gradients.length);
  for (const g of gradients) {
    const box = await g.boundingBox();
    const txt = (await g.textContent())?.slice(0, 30);
    console.log('  box:', JSON.stringify(box), 'text:', txt);
  }
  
  await page.screenshot({
    path: '/Users/ariefrahman/Desktop/testcraft/tests/e2e/results/exploration/admin-banner-detail.png',
    clip: { x: 256, y: 64, width: 1024, height: 250 },
  });
});
