import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { MINECRAFT_TTF_FILES } from '../provider/font.ts';

const FONT_RELEASE = 'v1.6';
const FONT_RELEASE_URL = `https://github.com/tryashtar/minecraft-ttf/releases/download/${FONT_RELEASE}`;

const HELP = `cobble-ui — helper commands for Cobble UI

Usage:
  cobble-ui fonts <directory>   Download the minecraft-ttf (${FONT_RELEASE}) font files into <directory>

Then pass \`font={minecraftTtf('/<public path>')}\` to <CobbleProvider>.

NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
`;

async function downloadFonts(directory: string): Promise<void> {
  const target = resolve(directory);
  await mkdir(target, { recursive: true });
  await Promise.all(
    Object.values(MINECRAFT_TTF_FILES).map(async (file) => {
      const response = await fetch(`${FONT_RELEASE_URL}/${file}`);
      if (!response.ok)
        throw new Error(`Downloading ${file} failed with status ${String(response.status)}`);
      await writeFile(join(target, file), new Uint8Array(await response.arrayBuffer()));
      process.stdout.write(`  ${file}\n`);
    }),
  );
  process.stdout.write(`Fonts written to ${target}\n`);
}

async function main(args: readonly string[]): Promise<number> {
  const [command, ...rest] = args;
  if (command === 'fonts' && rest[0] !== undefined) {
    await downloadFonts(rest[0]);
    return 0;
  }
  process.stdout.write(HELP);
  return command === undefined || command === '--help' || command === '-h' ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
