import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Banner gradient check', async ({ page }) => {
  // Load student auth state
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

  // Check gradient banner
  const banner = page.locator('.bg-gradient-to-r').first();
  const bannerVisible = await banner.isVisible().catch(() => false);
  console.log('Gradient banner visible:', bannerVisible);

  if (bannerVisible) {
    const box = await banner.boundingBox();
    console.log('Banner bounding box:', JSON.stringify(box));

    const styles = await banner.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        background: cs.background.slice(0, 80),
        backgroundImage: cs.backgroundImage.slice(0, 80),
        display: cs.display,
        opacity: cs.opacity,
        height: cs.height,
        width: cs.width,
      };
    });
    console.log('Banner computed styles:', JSON.stringify(styles, null, 2));
  }

  // Take a cropped screenshot of just the top area
  await page.screenshot({
    path: path.resolve(__dirname, '../../results/exploration/banner-detail.png'),
    clip: { x: 256, y: 64, width: 1024, height: 200 },
  });

  // Also check the full background color in that region
  const topContent = page.locator('main').first();
  if (await topContent.isVisible().catch(() => false)) {
    const mainBox = await topContent.boundingBox();
    console.log('Main content box:', JSON.stringify(mainBox));
  }
});
