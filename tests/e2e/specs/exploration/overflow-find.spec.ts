import { test } from '@playwright/test';

test('Find exact overflow element', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  const result = await page.evaluate(() => {
    const sections = document.querySelectorAll('section, div[id]');
    const wide: { id: string; tag: string; class: string; scrollWidth: number; clientWidth: number }[] = [];
    for (const el of Array.from(sections)) {
      const sw = (el as HTMLElement).scrollWidth;
      const cw = (el as HTMLElement).clientWidth;
      if (sw > 376) {
        wide.push({
          id: el.id || '',
          tag: el.tagName.toLowerCase(),
          class: el.className?.toString()?.slice(0, 40) || '',
          scrollWidth: sw,
          clientWidth: cw,
        });
      }
    }
    return wide;
  });
  console.log('Wide sections:', JSON.stringify(result, null, 2));
});
