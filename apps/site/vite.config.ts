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
  server: {
    // The Mojang API sends no CORS headers, so the docs reach it through the dev server.
    proxy: {
      '/mojang-api': {
        target: 'https://api.mojang.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mojang-api/, ''),
      },
      '/mojang-session': {
        target: 'https://sessionserver.mojang.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mojang-session/, ''),
      },
    },
  },
  resolve: {
    // Use the library sources directly so changes show up instantly.
    alias: [
      { find: /^cobble-ui\/styles\.css$/, replacement: `${library}styles.css` },
      { find: /^cobble-ui$/, replacement: `${library}index.ts` },
    ],
  },
});
