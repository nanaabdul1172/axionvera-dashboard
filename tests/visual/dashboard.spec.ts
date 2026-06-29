import { expect, test } from '@playwright/test';

const MASK_SELECTORS = [
  '[data-testid="current-time"]',
  '[data-visual-mask="true"]',
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-01-01T00:00:00.000Z').getTime();
    window.localStorage.setItem('theme', 'light');
    (window as any).freighter = {
      isConnected: async () => false,
      isAllowed: async () => false,
    };
  });

  await page.route('**/favicon.ico', (route) => route.abort());
});

async function stabilizePage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });
}

test.describe('visual regression baselines', () => {
  test('landing page matches baseline', async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      mask: MASK_SELECTORS.map((selector) => page.locator(selector)),
    });
  });

  test('404 page matches baseline', async ({ page }) => {
    await page.goto('/visual-regression-missing-route');
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('not-found-page.png', {
      fullPage: true,
      mask: MASK_SELECTORS.map((selector) => page.locator(selector)),
    });
  });

  test('dashboard protected route redirect matches landing baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/');
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('dashboard-redirect-landing.png', {
      fullPage: true,
      mask: MASK_SELECTORS.map((selector) => page.locator(selector)),
    });
  });
});
