import { test } from '@playwright/test';

test('Page layout debug', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  const scroll = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    overflow: window.getComputedStyle(document.body).overflow,
    overflowX: window.getComputedStyle(document.body).overflowX,
  }));
  console.log('Page dimensions:', scroll);
});
