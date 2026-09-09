import { test } from '@playwright/test';
import * as path from 'path';

test('Marketing mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  // Open hamburger
  const hamburger = page.locator('button[aria-label="Buka menu navigasi"]');
  await hamburger.click();
  await page.waitForTimeout(400);
  
  // Screenshot the menu
  await page.screenshot({
    path: path.resolve(__dirname, '../../results/exploration/mobile-menu-fresh.png'),
    fullPage: false,
  });
  
  // Check drawer
  const drawer = page.locator('#nav-drawer');
  const box = await drawer.boundingBox();
  console.log('Drawer box:', JSON.stringify(box));
  const styles = await drawer.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return { padding: cs.padding, width: cs.width, overflow: cs.overflow };
  });
  console.log('Drawer styles:', styles);
});
