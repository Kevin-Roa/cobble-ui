import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const library = fileURLToPath(new URL('../../packages/cobble-ui/src/', import.meta.url));

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: undefined }) },
    react({ include: /\.(mdx|tsx?)$/ }),
  ],
  resolve: {
    // Use the library sources directly so changes show up instantly.
    alias: [
      { find: /^cobble-ui\/styles\.css$/, replacement: `${library}styles.css` },
      { find: /^cobble-ui$/, replacement: `${library}index.ts` },
    ],
  },
});
