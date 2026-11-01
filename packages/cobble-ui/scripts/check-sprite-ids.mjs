#!/usr/bin/env node
// Diffs the GUI sprite ids of the Minecraft client jar against src/assets/sprite-ids.ts.
//
// Only the jar's zip central directory (file names, a few hundred KB) is fetched, using HTTP range
// requests, so nothing is downloaded in full and no Mojang asset is stored or committed.
//
// Usage: node scripts/check-sprite-ids.mjs [--version <id>] [--write]
//   (no flag)  exit 1 when the file is out of date, printing added and removed ids
//   --write    regenerate src/assets/sprite-ids.ts from the jar listing
//   --version  game version to check (default: DEFAULT_GAME_VERSION in src/assets/mojang.ts)
/* oxlint-disable no-console -- CLI script */
import { readFileSync, writeFileSync } from 'node:fs';

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const SPRITE_PREFIX = 'assets/minecraft/textures/gui/sprites/';
const root = new URL('../', import.meta.url);
const idsFile = new URL('src/assets/sprite-ids.ts', root);
const mojangFile = new URL('src/assets/mojang.ts', root);

const args = process.argv.slice(2);
const write = args.includes('--write');
const versionFlag = args.indexOf('--version');
const version =
  (versionFlag >= 0 ? args[versionFlag + 1] : undefined) ??
  /DEFAULT_GAME_VERSION = '([^']+)'/.exec(readFileSync(mojangFile, 'utf8'))?.[1];
if (!version) throw new Error('Could not determine the game version');

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed with status ${res.status}`);
  return res.json();
}

async function getRange(url, start, end) {
  const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
  if (res.status !== 206) throw new Error(`Range request for ${url} returned ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Lists the entry names of a remote zip by reading only its central directory. */
async function listZipNames(url, size) {
  const tailSize = Math.min(size, 70_000);
  const tail = await getRange(url, size - tailSize, size - 1);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('End of central directory not found');
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  if (cdSize === 0xffffffff || cdOffset === 0xffffffff) throw new Error('Zip64 is not supported');
  const cd = await getRange(url, cdOffset, cdOffset + cdSize - 1);
  const names = [];
  for (let p = 0; p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50;) {
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const commentLen = cd.readUInt16LE(p + 32);
    names.push(cd.toString('utf8', p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

const manifest = await getJson(MANIFEST_URL);
const entry = manifest.versions.find((v) => v.id === version);
if (!entry) throw new Error(`Version "${version}" was not found in the Mojang manifest`);
const client = (await getJson(entry.url)).downloads.client;
const names = await listZipNames(client.url, client.size);

const actual = names
  .filter((n) => n.startsWith(SPRITE_PREFIX) && n.endsWith('.png'))
  .map((n) => n.slice(SPRITE_PREFIX.length, -'.png'.length))
  .toSorted();

const source = readFileSync(idsFile, 'utf8');
const current = [...source.matchAll(/^\s*\| '([^']+)'/gm)].map((m) => m[1]);

const currentSet = new Set(current);
const actualSet = new Set(actual);
const added = actual.filter((id) => !currentSet.has(id));
const removed = current.filter((id) => !actualSet.has(id));

if (write) {
  const out = `/**
 * Every GUI sprite id of the ${version} client (\`assets/minecraft/textures/gui/sprites/<id>.png\`).
 *
 * This is a list of names only, not assets: the textures themselves are downloaded by the
 * browser at runtime. Generated from the client jar file listing by
 * \`scripts/check-sprite-ids.mjs --write\`.
 */
export type SpriteId =
${actual.map((id) => `  | '${id}'`).join('\n')};
`;
  writeFileSync(idsFile, out);
  console.log(
    `Wrote ${actual.length} sprite ids for ${version} (+${added.length} -${removed.length}).`,
  );
  console.log('Run `pnpm format` to normalise the file.');
} else if (added.length === 0 && removed.length === 0) {
  console.log(`sprite-ids.ts matches the ${version} client (${actual.length} sprites).`);
} else {
  console.error(`sprite-ids.ts is out of date for ${version}.`);
  for (const id of added) console.error(`  + ${id}`);
  for (const id of removed) console.error(`  - ${id}`);
  console.error('Run `pnpm --filter cobble-ui sprite-ids:write` to regenerate it.');
  process.exit(1);
}
