/**
 * The worker-side half of item rasterization: loads files through a {@link FileReader}, decodes
 * PNGs, resolves items with `item-model.ts` and draws them with `item-raster.ts` into an
 * `OffscreenCanvas`. It holds no DOM or worker globals, so tests can drive it directly.
 */
import type { RgbaImage } from './blit.ts';
import { decodePng } from './png.ts';
import {
  drawItem,
  itemPixelSize,
  itemTextureIds,
  type Context2D,
  type ItemDrawEnv,
} from './item-raster.ts';

/** Messages the main thread sends to the item worker. */
export type ItemWorkerRequest =
  | { readonly type: 'render'; readonly id: number; readonly name: string; readonly unit: number }
  /** Answers a `file` request; `blob` is `null` when the client has no such file. */
  | { readonly type: 'file'; readonly path: string; readonly blob: Blob | null }
  /** Forget every cached file (the assets were reloaded). */
  | { readonly type: 'reset' };

/** Messages the item worker sends back. */
export type ItemWorkerResponse =
  | { readonly type: 'ready' }
  | { readonly type: 'file'; readonly path: string }
  | { readonly type: 'result'; readonly id: number; readonly bitmap: ImageBitmap | null };

/** Reads a client file by its path in the jar. */
export type FileReader = (path: string) => Promise<Blob | undefined | null>;

type Entry<T> =
  | { readonly state: 'pending'; readonly promise: Promise<unknown> }
  | { readonly state: 'ready'; readonly value: T | null };

function texturePath(id: string): string {
  return `assets/minecraft/textures/${id.replace(/^minecraft:/, '')}.png`;
}

const MAX_ATTEMPTS = 64;

export class ItemRenderer {
  private readonly read: FileReader;
  private json = new Map<string, Entry<unknown>>();
  private textures = new Map<string, Entry<RgbaImage>>();
  private generation = 0;
  private pending = new Set<Promise<unknown>>();

  constructor(read: FileReader) {
    this.read = read;
  }

  /** Drops cached files; renders in flight finish against the old data and are discarded by the caller. */
  reset(): void {
    this.json = new Map();
    this.textures = new Map();
    this.generation++;
  }

  private lookup<T>(
    cache: Map<string, Entry<T>>,
    key: string,
    load: () => Promise<T | null>,
  ): T | null | undefined {
    const entry = cache.get(key);
    if (entry?.state === 'ready') return entry.value;
    if (entry) {
      this.pending.add(entry.promise);
      return undefined;
    }
    const promise = load().then(
      (value) => {
        if (cache.get(key) === pendingEntry) cache.set(key, { state: 'ready', value });
      },
      () => {
        if (cache.get(key) === pendingEntry) cache.set(key, { state: 'ready', value: null });
      },
    );
    const pendingEntry: Entry<T> = { state: 'pending', promise };
    cache.set(key, pendingEntry);
    this.pending.add(promise);
    return undefined;
  }

  private texture(id: string): RgbaImage | null | undefined {
    return this.lookup(this.textures, id, async () => {
      const blob = await this.read(texturePath(id));
      return blob ? decodePng(new Uint8Array(await blob.arrayBuffer())) : null;
    });
  }

  private readonly env: ItemDrawEnv = {
    json: (path) =>
      this.lookup(this.json, path, async () => {
        const blob = await this.read(path);
        return blob ? (JSON.parse(await blob.text()) as unknown) : null;
      }),
    texture: (id) => this.texture(id) ?? undefined,
    hasTexture: (id) => {
      const value = this.texture(id);
      return value === undefined ? undefined : value !== null;
    },
    createCanvas: (width, height) => new OffscreenCanvas(width, height),
  };

  /**
   * Draws an item at `unit` device pixels per GUI unit, waiting for the files it needs. Resolves
   * `null` when the assets were reset meanwhile.
   */
  async render(name: string, unit: number): Promise<ImageBitmap | null> {
    const generation = this.generation;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (generation !== this.generation) return null;
      this.pending = new Set();
      // Start every load up front so one round trip covers them all.
      const ids = itemTextureIds(name, (path) => this.env.json(path));
      if (ids) for (const id of ids) this.env.texture(id);
      if (this.pending.size === 0) {
        const size = itemPixelSize(unit);
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext('2d') as Context2D | null;
        if (!context) return null;
        context.imageSmoothingEnabled = false;
        drawItem(context, this.env, name, unit);
        if (this.pending.size === 0) return canvas.transferToImageBitmap();
      }
      // Each round waits for the loads it started, then draws again.
      // oxlint-disable-next-line no-await-in-loop
      await Promise.all(this.pending);
    }
    return null;
  }
}
