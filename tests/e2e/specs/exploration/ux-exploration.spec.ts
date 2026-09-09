/**
 * UX Exploration Test — Comprehensive visual + functional audit
 * Tests all major pages across Marketing site and LMS
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../results/exploration');

function ensureDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function takeShot(page: Page, name: string) {
  ensureDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function takeViewportShot(page: Page, name: string) {
  ensureDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING SITE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Marketing Site', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('MKT-01: Homepage — desktop full scroll', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await takeShot(page, '01-marketing-homepage-top');

    // Scroll to check hero section
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01a-marketing-hero-scroll');

    // Scroll to stats bar
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01b-marketing-stats');

    // Scroll to programs
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01c-marketing-programs');

    // Scroll to testimonials
    await page.evaluate(() => window.scrollTo(0, 2800));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01d-marketing-testimonials');

    // Scroll to FAQ
    await page.evaluate(() => window.scrollTo(0, 3800));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01e-marketing-faq');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await takeViewportShot(page, '01f-marketing-footer');

    // Full page at end
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeShot(page, '01g-marketing-homepage-full');

    // Check for console errors
    console.log(`Marketing homepage console errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('MKT-02: Homepage — mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await takeShot(page, '02-marketing-homepage-mobile');

    // Check hamburger menu
    const hamburger = page.locator('[data-testid="hamburger"], button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);
    console.log(`Hamburger visible on mobile: ${hamburgerVisible}`);
    if (hamburgerVisible) {
      await hamburger.click();
      await page.waitForTimeout(400);
      await takeViewportShot(page, '02a-marketing-mobile-menu-open');
    }

    // Scroll down on mobile
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(400);
    await takeViewportShot(page, '02b-marketing-mobile-scroll');
  });

  test('MKT-03: Navbar links and hover states', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get all nav links
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    console.log(`Nav links found: ${count}`);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent().catch(() => '');
      const href = await link.getAttribute('href').catch(() => '');
      console.log(`  Nav link ${i}: "${text?.trim()}" → ${href}`);
    }

    await takeViewportShot(page, '03-marketing-navbar');

    // Hover over first nav link
    if (count > 0) {
      await navLinks.first().hover();
      await page.waitForTimeout(300);
      await takeViewportShot(page, '03a-marketing-navbar-hover');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LMS PUBLIC PAGES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('LMS Public Pages', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('LMS-01: Homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/', { waitUntil: 'networkidle' });
    await takeShot(page, '04-lms-homepage');
    console.log(`LMS homepage console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('LMS-02: Course Catalog', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/catalog', { waitUntil: 'networkidle' });
    await takeShot(page, '05-lms-catalog');

    // Count course cards
    const cards = page.locator('[data-testid*="course"], .course-card, [class*="course"]');
    const cardCount = await cards.count();
    console.log(`Course cards found: ${cardCount}`);

    console.log(`Catalog console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('LMS-03: Course Detail', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/courses/pengantar-software-testing', { waitUntil: 'networkidle' });
    await takeShot(page, '06-lms-course-detail');

    console.log(`Course detail console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('LMS-04: Login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/login', { waitUntil: 'networkidle' });
    await takeShot(page, '07-lms-login');

    // Check for Google OAuth error
    const pageContent = await page.content();
    const hasGoogleError = pageContent.includes('Google') && pageContent.includes('error');
    console.log(`Login page Google error visible: ${hasGoogleError}`);

    console.log(`Login console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('LMS-05: Register page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/register', { waitUntil: 'networkidle' });
    await takeShot(page, '08-lms-register');

    console.log(`Register console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LMS STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('LMS Student Dashboard', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  async function loginAsStudent(page: Page) {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('[data-testid="email-input"], input[type="email"], input[name="email"]', 'student@testcraft.id');
    await page.fill('[data-testid="password-input"], input[type="password"], input[name="password"]', 'Student#123');
    await page.click('[data-testid="login-button"], button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(async () => {
      // May redirect elsewhere
      await page.waitForLoadState('networkidle');
    });
  }

  test('STU-01: Dashboard overview', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await takeShot(page, '09-student-dashboard');

    // Check sidebar
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav[class*="sidebar"]');
    const sidebarVisible = await sidebar.first().isVisible().catch(() => false);
    console.log(`Sidebar visible: ${sidebarVisible}`);

    // Check gradient banner
    const banner = page.locator('[data-testid="welcome-banner"], [class*="gradient"], [class*="banner"]');
    const bannerVisible = await banner.first().isVisible().catch(() => false);
    console.log(`Welcome banner visible: ${bannerVisible}`);

    // Check stat cards
    const statCards = page.locator('[data-testid*="stat"], [class*="stat-card"], [class*="card"]');
    const cardCount = await statCards.count();
    console.log(`Stat cards found: ${cardCount}`);

    console.log(`Dashboard console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    // Viewport shot for above-fold
    await takeViewportShot(page, '09a-student-dashboard-viewport');
  });

  test('STU-02: My Classes', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/dashboard/classes', { waitUntil: 'networkidle' });
    await takeShot(page, '10-student-classes');

    console.log(`Classes console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('STU-03: Assignments', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/dashboard/assignments', { waitUntil: 'networkidle' });
    await takeShot(page, '11-student-assignments');

    console.log(`Assignments console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('STU-04: Certificates', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/dashboard/certificates', { waitUntil: 'networkidle' });
    await takeShot(page, '12-student-certificates');

    console.log(`Certificates console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('STU-05: Profile', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/dashboard/profile', { waitUntil: 'networkidle' });
    await takeShot(page, '13-student-profile');

    console.log(`Profile console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('STU-06: Catalog while logged in', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsStudent(page);
    await page.goto('/catalog', { waitUntil: 'networkidle' });
    await takeShot(page, '14-student-catalog-loggedin');

    console.log(`Catalog (logged in) console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('STU-07: Dashboard mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAsStudent(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await takeShot(page, '09m-student-dashboard-mobile');
    await takeViewportShot(page, '09mv-student-dashboard-mobile-viewport');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LMS ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('LMS Admin Dashboard', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  async function loginAsAdmin(page: Page) {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'admin@testcraft.id');
    await page.fill('#password', 'Admin#12345');
    await page.getByRole('button', { name: /masuk|login|sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(async () => {
      await page.waitForLoadState('networkidle');
    });
  }

  test('ADM-01: Admin overview', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await takeShot(page, '15-admin-dashboard');

    // Check stat cards
    const statCards = page.locator('[data-testid*="stat"], [class*="stat"], [class*="card"]');
    const cardCount = await statCards.count();
    console.log(`Admin stat cards found: ${cardCount}`);

    // Check gradient banner
    const banner = page.locator('[class*="gradient"], [class*="banner"], [class*="welcome"]');
    const bannerCount = await banner.count();
    console.log(`Admin gradient elements found: ${bannerCount}`);

    console.log(`Admin dashboard console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));

    await takeViewportShot(page, '15a-admin-dashboard-viewport');
  });

  test('ADM-02: Courses table', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsAdmin(page);
    await page.goto('/admin/courses', { waitUntil: 'networkidle' });
    await takeShot(page, '16-admin-courses');

    const rows = page.locator('table tbody tr, [data-testid*="row"]');
    const rowCount = await rows.count();
    console.log(`Admin courses table rows: ${rowCount}`);

    console.log(`Admin courses console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('ADM-03: Users table', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsAdmin(page);
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await takeShot(page, '17-admin-users');

    const rows = page.locator('table tbody tr, [data-testid*="row"]');
    const rowCount = await rows.count();
    console.log(`Admin users table rows: ${rowCount}`);

    console.log(`Admin users console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('ADM-04: CMS Pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await loginAsAdmin(page);
    await page.goto('/admin/pages', { waitUntil: 'networkidle' });
    await takeShot(page, '18-admin-cms-pages');

    console.log(`Admin CMS pages console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  });

  test('ADM-05: Admin mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await takeShot(page, '15m-admin-dashboard-mobile');
    await takeViewportShot(page, '15mv-admin-dashboard-mobile-viewport');
  });
});
