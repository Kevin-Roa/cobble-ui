import { defineConfig } from '@playwright/test';

const PORT = 5199;

/**
 * Visual regression + deterministic style checks for the docs site.
 *
 * Screenshots contain Mojang textures (downloaded at runtime), so baselines are
 * gitignored and generated locally; see "Visual regression tests" in the README.
 */
export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 120_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  },
  projects: [
    // Needs no Mojang assets; safe to run anywhere.
    { name: 'deterministic', testMatch: /deterministic\.spec\.ts/ },
    // Needs network access to download the client assets and local baselines.
    { name: 'visual', testMatch: /visual\.spec\.ts/ },
  ],
  webServer: {
    command: `node scripts/ensure-fonts.mjs && vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
