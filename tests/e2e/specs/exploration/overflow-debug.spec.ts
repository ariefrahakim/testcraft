import { test } from '@playwright/test';

test('Find overflow element', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  const wide = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const overflowing: { tag: string; class: string; width: number; rect: string }[] = [];
    for (const el of Array.from(allElements)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 376) {
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          class: el.className?.toString()?.slice(0, 60) || '',
          width: Math.round(rect.width),
          rect: `x:${Math.round(rect.left)} w:${Math.round(rect.width)}`,
        });
        if (overflowing.length >= 5) break;
      }
    }
    return overflowing;
  });
  
  console.log('Wide elements:', JSON.stringify(wide, null, 2));
});
