import { expect, test } from '@playwright/test';

/**
 * Screenshots of key component pages. The pages render Mojang textures that the
 * browser downloads at runtime, so baselines are never committed (see README).
 * The first run writes the baselines (and reports them as missing); later runs compare.
 */
const PAGES = ['button', 'slider', 'text-field', 'tooltip', 'tabs', 'scroll-area', 'progress-bar'];

for (const slug of PAGES) {
  test(`docs page: ${slug}`, async ({ page }) => {
    await page.goto(`/docs/${slug}`);
    await page.locator('.cobble-root').first().waitFor({ state: 'attached' });
    // Wait for fonts and for the first client-jar download to decode sprites.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelectorAll('.cobble-sprite').length > 0, null, {
      timeout: 90_000,
    });
    await page.waitForLoadState('networkidle', { timeout: 90_000 });
    await expect(page).toHaveScreenshot(`${slug}.png`, { fullPage: true });
  });
}
