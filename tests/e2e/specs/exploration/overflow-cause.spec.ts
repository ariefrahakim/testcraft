import { test } from '@playwright/test';

test('Find overflow cause', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  const result = await page.evaluate(() => {
    // Find which element causes the 446px scrollWidth
    const hero = document.querySelector('#home') as HTMLElement;
    if (hero) {
      const heroRect = hero.getBoundingClientRect();
      const heroStyle = window.getComputedStyle(hero);
      return {
        heroWidth: heroRect.width,
        heroOverflow: heroStyle.overflow,
        heroOverflowX: heroStyle.overflowX,
        scrollWidth: document.documentElement.scrollWidth,
      };
    }
    return null;
  });
  console.log('Hero section:', JSON.stringify(result));
  
  // Check inner hero grid
  const innerGrid = await page.evaluate(() => {
    const inner = document.querySelector('.hero-inner') as HTMLElement;
    if (inner) {
      return {
        width: inner.getBoundingClientRect().width,
        scrollWidth: inner.scrollWidth,
        gridTemplateColumns: window.getComputedStyle(inner).gridTemplateColumns,
      };
    }
    return null;
  });
  console.log('Hero inner grid:', JSON.stringify(innerGrid));
});
