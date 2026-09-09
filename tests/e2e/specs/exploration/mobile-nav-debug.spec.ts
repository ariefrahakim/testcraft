import { test } from '@playwright/test';

test('Mobile nav layout debug', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  
  const hamburger = page.locator('button[aria-label="Buka menu navigasi"]');
  await hamburger.click();
  await page.waitForTimeout(400);
  
  // Check the nav and its children
  const nav = page.locator('nav[aria-label="Navigasi utama"]');
  const navBox = await nav.boundingBox();
  console.log('Nav box:', JSON.stringify(navBox));
  
  // Check the inner container div
  const innerDiv = nav.locator('> div').first();
  const innerBox = await innerDiv.boundingBox();
  console.log('Inner div box:', JSON.stringify(innerBox));
  
  // Check the drawer
  const drawer = page.locator('#nav-drawer');
  const drawerBox = await drawer.boundingBox();
  console.log('Drawer box:', JSON.stringify(drawerBox));
  
  // Check nav offset
  const navStyles = await nav.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return { 
      left: cs.left, position: cs.position, 
      width: cs.width, marginLeft: cs.marginLeft,
      transform: cs.transform 
    };
  });
  console.log('Nav styles:', navStyles);
});
