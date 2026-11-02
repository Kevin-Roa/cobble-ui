// Verifies that every routed page of the docs site carries the required disclaimer.
// Pages are rendered by three components (see router.tsx), so each must render the shared
// <Disclaimer /> (or the DISCLAIMER constant), and the doc pages must go through DocsScreen.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const TEXT =
  'NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.';
expect(
  read('src/components/Disclaimer.tsx').includes(TEXT),
  'Disclaimer.tsx lost the disclaimer text',
);

// Every route element in router.tsx maps to a page component that must show the disclaimer.
const router = read('src/router.tsx');
const elements = [...router.matchAll(/element:\s*<(\w+)/g)]
  .map((match) => match[1])
  .filter((name) => name !== 'Navigate'); // redirects render nothing
expect(elements.length > 0, 'no routes found in router.tsx');
const files = {
  DocPage: 'src/pages/DocPage.tsx',
  Home: 'src/pages/Home.tsx',
  Settings: 'src/pages/Settings.tsx',
  Language: 'src/pages/Language.tsx',
};
for (const name of elements) {
  const file = files[name];
  if (!file) {
    expect(false, `route component ${name} is not covered by check-disclaimer.mjs`);
    continue;
  }
  const source = read(file);
  const direct = /<Disclaimer\b/.test(source) || /\{DISCLAIMER\}/.test(source);
  const viaDocsScreen = name === 'DocPage' && /<DocsScreen\b/.test(source);
  expect(direct || viaDocsScreen, `${file} does not render the disclaimer`);
}
expect(
  /<Disclaimer\b/.test(read('src/components/DocsScreen.tsx')),
  'DocsScreen.tsx does not render <Disclaimer />',
);

// Static surfaces.
expect(read('index.html').includes(TEXT), 'index.html is missing the disclaimer');
expect(read('../../README.md').includes(TEXT), 'README.md is missing the disclaimer');
expect(
  read('../../packages/cobble-ui/package.json').includes(TEXT),
  'package description is missing the disclaimer',
);

if (failures.length > 0) {
  for (const failure of failures) console.error(`disclaimer check failed: ${failure}`);
  process.exit(1);
}
console.warn(`disclaimer check passed (${String(elements.length)} routes)`);
