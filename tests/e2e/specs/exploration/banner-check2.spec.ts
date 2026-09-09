import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Welcome banner deep check', async ({ page }) => {
  const statePath = path.resolve(__dirname, '../../results/auth-state/student.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  for (const origin of state.origins || []) {
    await page.goto(origin.origin);
    for (const item of origin.localStorage || []) {
      await page.evaluate(({ k, v }: { k: string; v: string }) => localStorage.setItem(k, v), { k: item.name, v: item.value });
    }
  }
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Find ALL gradient elements
  const allGradients = await page.locator('.bg-gradient-to-r').all();
  console.log('Total .bg-gradient-to-r elements:', allGradients.length);
  for (const el of allGradients) {
    const box = await el.boundingBox();
    const text = (await el.textContent())?.slice(0, 50);
    console.log('  element box:', JSON.stringify(box), '| text:', text);
  }

  // Find the welcome banner div specifically
  const welcomeDiv = page.locator('.rounded-2xl.bg-gradient-to-r').first();
  const welcomeVisible = await welcomeDiv.isVisible().catch(() => false);
  console.log('Welcome div (.rounded-2xl.bg-gradient-to-r) visible:', welcomeVisible);
  
  if (welcomeVisible) {
    const box = await welcomeDiv.boundingBox();
    console.log('Welcome box:', JSON.stringify(box));
  }

  // Also check "from-navy"
  const fromNavy = page.locator('[class*="from-navy"]').first();
  const fromNavyVisible = await fromNavy.isVisible().catch(() => false);
  console.log('from-navy element visible:', fromNavyVisible);
  if (fromNavyVisible) {
    const box = await fromNavy.boundingBox();
    console.log('from-navy box:', JSON.stringify(box));
  }

  // Screenshot 
  await page.screenshot({
    path: path.resolve(__dirname, '../../results/exploration/banner-detail2.png'),
    clip: { x: 256, y: 64, width: 1024, height: 250 },
  });
});
