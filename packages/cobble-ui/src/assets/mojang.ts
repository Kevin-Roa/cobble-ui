import { unzipSync, zipSync } from 'fflate';
import type { AssetBundle, AssetLoadOptions, AssetLoadProgress, AssetSource } from './types.ts';

/** The game version Cobble UI's components are modelled after. */
export const DEFAULT_GAME_VERSION = '26.3';

export const MOJANG_VERSION_MANIFEST_URL =
  'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
export const MOJANG_RESOURCES_URL = 'https://resources.download.minecraft.net';

const CACHE_NAME = 'cobble-ui-assets-v3';
const CACHE_ORIGIN = 'https://cobble-ui.invalid';

/** Client files kept after the jar is downloaded. Everything else is discarded. */
const DEFAULT_INCLUDE = (path: string): boolean =>
  path.startsWith('assets/minecraft/textures/gui/') ||
  path.startsWith('assets/minecraft/textures/item/') ||
  path.startsWith('assets/minecraft/textures/block/') ||
  path.startsWith('assets/minecraft/textures/mob_effect/') ||
  path.startsWith('assets/minecraft/items/') ||
  path.startsWith('assets/minecraft/models/item/') ||
  path.startsWith('assets/minecraft/models/block/') ||
  path === 'assets/minecraft/textures/misc/unknown_server.png' ||
  path === 'assets/minecraft/textures/misc/unknown_pack.png' ||
  path === 'assets/minecraft/textures/entity/player/wide/steve.png' ||
  path === 'assets/minecraft/textures/font/ascii.png';

/** Asset index objects that are kept (for sounds and the title panorama). */
const DEFAULT_INCLUDE_OBJECT = (name: string): boolean =>
  name.startsWith('minecraft/sounds/ui/') ||
  name.startsWith('minecraft/sounds/random/click') ||
  name.startsWith('minecraft/textures/gui/');

export interface MojangAssetsOptions {
  /** Game version to load. Defaults to {@link DEFAULT_GAME_VERSION}. */
  readonly version?: string;
  /** Override the version manifest URL (for example to go through your own proxy). */
  readonly manifestUrl?: string;
  /** Override the base URL used for asset index objects. */
  readonly resourcesUrl?: string;
  /**
   * Keep the extracted GUI files in the browser's Cache Storage so the client
   * jar is only downloaded once. Defaults to `true`.
   */
  readonly cache?: boolean;
  /** Custom `fetch` implementation. */
  readonly fetch?: typeof fetch;
}

interface VersionManifest {
  readonly versions: readonly { readonly id: string; readonly url: string }[];
}

interface Download {
  readonly sha1: string;
  readonly size: number;
  readonly url: string;
}

interface VersionInfo {
  readonly id: string;
  readonly downloads: { readonly client: Download };
  readonly assetIndex: Download & { readonly id: string };
}

interface AssetIndex {
  readonly objects: Readonly<Record<string, { readonly hash: string; readonly size: number }>>;
}

interface CachedMeta {
  readonly version: string;
  readonly clientSha1: string;
  /** Asset index subset: object name → hash. */
  readonly objects: Readonly<Record<string, string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetchImpl(url, { signal });
  if (!response.ok) throw new Error(`Request to ${url} failed with status ${response.status}`);
  return response.json();
}

function parseManifest(value: unknown): VersionManifest {
  if (!isRecord(value) || !Array.isArray(value['versions'])) {
    throw new Error('Unexpected version manifest format');
  }
  return value as unknown as VersionManifest;
}

function parseVersion(value: unknown): VersionInfo {
  if (!isRecord(value) || !isRecord(value['downloads']) || !isRecord(value['assetIndex'])) {
    throw new Error('Unexpected version info format');
  }
  return value as unknown as VersionInfo;
}

function parseIndex(value: unknown): AssetIndex {
  if (!isRecord(value) || !isRecord(value['objects'])) {
    throw new Error('Unexpected asset index format');
  }
  return value as unknown as AssetIndex;
}

async function readBody(
  response: Response,
  expectedSize: number,
  onProgress: ((progress: AssetLoadProgress) => void) | undefined,
): Promise<Uint8Array<ArrayBuffer>> {
  const total = expectedSize || Number(response.headers.get('content-length') ?? 0);
  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    onProgress?.({ phase: 'download', loaded: buffer.byteLength, total });
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    // Chunks must be read in order.
    // oxlint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.({ phase: 'download', loaded, total });
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function sha1Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function toBlobs(files: Record<string, Uint8Array>): Map<string, Blob> {
  const map = new Map<string, Blob>();
  for (const [path, bytes] of Object.entries(files)) {
    const type = path.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    map.set(path, new Blob([new Uint8Array(bytes)], { type }));
  }
  return map;
}

class MojangBundle implements AssetBundle {
  readonly version: string;
  private readonly files: ReadonlyMap<string, Blob>;
  private readonly objects: Readonly<Record<string, string>>;
  private readonly resourcesUrl: string;

  constructor(
    version: string,
    files: ReadonlyMap<string, Blob>,
    objects: Readonly<Record<string, string>>,
    resourcesUrl: string,
  ) {
    this.version = version;
    this.files = files;
    this.objects = objects;
    this.resourcesUrl = resourcesUrl;
  }

  file(path: string): Blob | undefined {
    return this.files.get(path);
  }

  paths(): Iterable<string> {
    return this.files.keys();
  }

  objectUrl(name: string): string | undefined {
    const hash = this.objects[name];
    return hash === undefined ? undefined : `${this.resourcesUrl}/${hash.slice(0, 2)}/${hash}`;
  }
}

async function openCache(enabled: boolean): Promise<Cache | undefined> {
  if (!enabled || typeof caches === 'undefined') return undefined;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    // Cache Storage is unavailable (e.g. insecure context or private mode).
    return undefined;
  }
}

async function readCached(
  cache: Cache,
  version: string,
): Promise<{ meta: CachedMeta; files: Map<string, Blob> } | undefined> {
  const metaResponse = await cache.match(`${CACHE_ORIGIN}/${version}/meta.json`);
  if (!metaResponse) return undefined;
  const meta = (await metaResponse.json()) as CachedMeta;
  const zipResponse = await cache.match(`${CACHE_ORIGIN}/${version}/${meta.clientSha1}.zip`);
  if (!zipResponse) return undefined;
  const files = unzipSync(new Uint8Array(await zipResponse.arrayBuffer()));
  return { meta, files: toBlobs(files) };
}

async function writeCached(
  cache: Cache,
  meta: CachedMeta,
  files: Record<string, Uint8Array>,
): Promise<void> {
  const zipped = zipSync(files, { level: 0 });
  const previous = await cache.keys();
  await Promise.all(
    previous
      .filter((request) => request.url.startsWith(`${CACHE_ORIGIN}/${meta.version}/`))
      .map((request) => cache.delete(request)),
  );
  await cache.put(
    `${CACHE_ORIGIN}/${meta.version}/${meta.clientSha1}.zip`,
    new Response(new Uint8Array(zipped), { headers: { 'content-type': 'application/zip' } }),
  );
  await cache.put(
    `${CACHE_ORIGIN}/${meta.version}/meta.json`,
    new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }),
  );
}

/**
 * Loads the game's GUI textures and sounds straight from Mojang's servers at
 * runtime. Nothing copyrighted is shipped with Cobble UI: the visitor's
 * browser downloads the official client jar (≈41 MB, verified against the
 * SHA-1 published by Mojang), keeps only the GUI files and caches them.
 */
export function mojangAssets(options: MojangAssetsOptions = {}): AssetSource {
  const version = options.version ?? DEFAULT_GAME_VERSION;
  const manifestUrl = options.manifestUrl ?? MOJANG_VERSION_MANIFEST_URL;
  const resourcesUrl = (options.resourcesUrl ?? MOJANG_RESOURCES_URL).replace(/\/$/, '');
  const useCache = options.cache ?? true;

  return {
    key: `mojang:${version}:${manifestUrl}:${resourcesUrl}`,
    async load({ signal, onProgress }: AssetLoadOptions): Promise<AssetBundle> {
      const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
      const cache = await openCache(useCache);

      if (cache) {
        onProgress?.({ phase: 'cache', loaded: 0, total: 0 });
        const cached = await readCached(cache, version).catch(() => undefined);
        if (cached) {
          return new MojangBundle(version, cached.files, cached.meta.objects, resourcesUrl);
        }
      }

      onProgress?.({ phase: 'manifest', loaded: 0, total: 0 });
      const manifest = parseManifest(await fetchJson(fetchImpl, manifestUrl, signal));
      const entry = manifest.versions.find((v) => v.id === version);
      if (!entry) throw new Error(`Minecraft version "${version}" was not found in the manifest`);
      const info = parseVersion(await fetchJson(fetchImpl, entry.url, signal));
      const index = parseIndex(await fetchJson(fetchImpl, info.assetIndex.url, signal));

      const client = info.downloads.client;
      const response = await fetchImpl(client.url, { signal });
      if (!response.ok) {
        throw new Error(`Downloading the ${version} client failed with status ${response.status}`);
      }
      const jar = await readBody(response, client.size, onProgress);

      onProgress?.({ phase: 'verify', loaded: 0, total: 0 });
      const actualSha1 = await sha1Hex(jar);
      if (actualSha1 !== client.sha1) {
        throw new Error(
          `Client jar checksum mismatch (expected ${client.sha1}, got ${actualSha1})`,
        );
      }

      onProgress?.({ phase: 'extract', loaded: 0, total: 0 });
      const files = unzipSync(jar, { filter: (file) => DEFAULT_INCLUDE(file.name) });
      const objects: Record<string, string> = {};
      for (const [name, object] of Object.entries(index.objects)) {
        if (DEFAULT_INCLUDE_OBJECT(name)) objects[name] = object.hash;
      }

      const meta: CachedMeta = { version, clientSha1: client.sha1, objects };
      if (cache) {
        await writeCached(cache, meta, files).catch((error: unknown) => {
          console.warn('[cobble-ui] Could not cache game assets', error);
        });
      }
      return new MojangBundle(version, toBlobs(files), objects, resourcesUrl);
    },
  };
}
