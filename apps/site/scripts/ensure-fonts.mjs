// Downloads the minecraft-ttf fonts into public/fonts the first time the site runs.
// They are not committed: they are fetched from the font's GitHub release instead.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fonts = fileURLToPath(new URL('../public/fonts/', import.meta.url));
const files = [
  'MinecraftDefault-Regular.ttf',
  'MinecraftDefault-Bold.ttf',
  'MinecraftDefault-Italic.ttf',
  'MinecraftDefault-BoldItalic.ttf',
];

if (!files.every((file) => existsSync(fonts + file))) {
  const cli = fileURLToPath(new URL('../../../packages/cobble-ui/dist/cli.js', import.meta.url));
  if (!existsSync(cli)) {
    console.error('Build the library first: pnpm --filter cobble-ui build');
    process.exit(1);
  }
  execFileSync(process.execPath, [cli, 'fonts', fonts], { stdio: 'inherit' });
}
