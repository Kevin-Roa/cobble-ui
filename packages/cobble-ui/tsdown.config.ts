import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // `item-worker` is the web worker `ItemRasterizer` spawns; it is emitted next to `index.js`.
    entry: { index: 'src/index.ts', 'item-worker': 'src/render/item-worker.ts' },
    format: 'esm',
    platform: 'browser',
    dts: true,
    sourcemap: true,
    clean: true,
    copy: [{ from: 'src/styles.css', to: 'dist' }],
    plugins: [
      {
        // Vite resolves the `.ts` worker path in the sources; the built library must point at the
        // emitted `.js` file instead.
        name: 'cobble-item-worker-url',
        renderChunk(code: string) {
          // Same length changes only inside one string literal, so line mappings stay valid.
          return {
            code: code.replace(
              /new URL\((["'])[^"']*item-worker\.ts\1/g,
              "new URL('./item-worker.js'",
            ),
            map: null,
          };
        },
      },
    ],
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
