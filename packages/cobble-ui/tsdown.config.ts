import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: 'esm',
    platform: 'browser',
    dts: true,
    sourcemap: true,
    clean: true,
    copy: [{ from: 'src/styles.css', to: 'dist' }],
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: 'esm',
    platform: 'node',
    dts: false,
    clean: false,
    banner: { js: '#!/usr/bin/env node' },
    fixedExtension: false,
  },
]);
