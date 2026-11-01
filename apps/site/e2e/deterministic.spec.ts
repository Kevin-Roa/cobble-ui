import { expect, test, type Page } from '@playwright/test';

/** Style checks that need no Mojang assets: they only read computed CSS. */

async function gotoDocs(page: Page): Promise<void> {
  await page.goto('/docs/button');
  await page.locator('.cobble-root').first().waitFor({ state: 'attached' });
}

interface TextStyle {
  readonly textShadow: string;
  readonly textDecorationLine: string;
  readonly textDecorationThickness: string;
  readonly textUnderlineOffset: string;
}

/** Adds a `.cobble-text` span next to the provider root and returns its computed style. */
async function textStyle(
  page: Page,
  attrs: Record<string, string>,
  style: string,
): Promise<TextStyle> {
  return page.evaluate(
    ([a, s]) => {
      const root = document.querySelector('.cobble-root');
      if (!root) throw new Error('no .cobble-root');
      const el = document.createElement('span');
      el.className = 'cobble-text';
      el.textContent = 'Text';
      el.setAttribute('style', s);
      for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
      // The root is `display: contents`, so a sibling would miss its custom properties.
      root.append(el);
      const cs = getComputedStyle(el);
      const out = {
        textShadow: cs.textShadow,
        textDecorationLine: cs.textDecorationLine,
        textDecorationThickness: cs.textDecorationThickness,
        textUnderlineOffset: cs.textUnderlineOffset,
      };
      el.remove();
      return out;
    },
    [attrs, style] as const,
  );
}

test('text shadow is offset one GUI unit with the explicit shadow color', async ({ page }) => {
  await gotoDocs(page);
  const s = await textStyle(
    page,
    { 'data-shadow': '' },
    '--cobble-px: 2px; --cobble-text-shadow-color: rgb(63, 63, 63)',
  );
  expect(s.textShadow).toBe('rgb(63, 63, 63) 2px 2px 0px');
});

test('text without data-shadow has no shadow', async ({ page }) => {
  await gotoDocs(page);
  expect((await textStyle(page, {}, '')).textShadow).toBe('none');
});

test('underline sits one unit below the baseline and is one unit thick', async ({ page }) => {
  await gotoDocs(page);
  const s = await textStyle(page, { 'data-underlined': '' }, '--cobble-px: 3px');
  expect(s.textDecorationLine).toBe('underline');
  expect(s.textDecorationThickness).toBe('3px');
  expect(s.textUnderlineOffset).toBe('3px');
});

test('strikethrough is an underline offset by -3.5 units', async ({ page }) => {
  await gotoDocs(page);
  const s = await textStyle(page, { 'data-strikethrough': '' }, '--cobble-px: 2px');
  expect(s.textDecorationLine).toBe('underline');
  expect(s.textDecorationThickness).toBe('2px');
  expect(s.textUnderlineOffset).toBe('-7px');
});

for (const dpr of [1, 1.25, 1.5, 2, 3]) {
  test(`--cobble-scale snaps to whole device pixels at dpr ${String(dpr)}`, async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor: dpr });
    const page = await context.newPage();
    await gotoDocs(page);
    const scale = Number(
      await page.evaluate(() => {
        const root = document.querySelector('.cobble-root');
        return root ? getComputedStyle(root).getPropertyValue('--cobble-scale') : '';
      }),
    );
    const device = scale * dpr;
    expect(scale).toBeGreaterThan(0);
    expect(Math.abs(device - Math.round(device))).toBeLessThan(1e-6);
    await context.close();
  });
}
