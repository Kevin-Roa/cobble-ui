import { composeSprite, type RgbaImage, type Sprite } from '../render/blit.ts';
import { decodePng } from '../render/png.ts';
import { parseSpriteScaling } from '../render/scaling.ts';
import type { AssetBundle, AssetLoadProgress, AssetSource } from './types.ts';

export type AssetStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AssetState {
  readonly status: AssetStatus;
  readonly progress: AssetLoadProgress | undefined;
  readonly error: unknown;
  readonly bundle: AssetBundle | undefined;
}

const COMPOSE_CACHE_LIMIT = 512;

/** Converts a sprite id like `widget/button` to its path inside the client jar. */
export function spritePath(id: string): string {
  const [namespace, path] = id.includes(':') ? id.split(':', 2) : ['minecraft', id];
  return `assets/${namespace ?? 'minecraft'}/textures/gui/sprites/${path ?? id}.png`;
}

/** Converts a texture id like `gui/menu_background` to its path inside the client jar. */
export function texturePath(id: string): string {
  const [namespace, path] = id.includes(':') ? id.split(':', 2) : ['minecraft', id];
  return `assets/${namespace ?? 'minecraft'}/textures/${path ?? id}.png`;
}

type Entry<T> =
  | { readonly status: 'pending' }
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'missing' };

/**
 * Owns the loaded game assets and everything derived from them (decoded
 * sprites, composed sprite images, object URLs). Shared by nested providers.
 */
export class AssetStore {
  readonly source: AssetSource;
  private state: AssetState = {
    status: 'idle',
    progress: undefined,
    error: undefined,
    bundle: undefined,
  };
  private readonly listeners = new Set<() => void>();
  private readonly sprites = new Map<string, Entry<Sprite>>();
  private readonly textures = new Map<string, Entry<RgbaImage>>();
  private readonly blobUrls = new Map<string, string>();
  private readonly composed = new Map<string, RgbaImage>();
  private controller: AbortController | undefined;
  private references = 0;
  private revision = 0;

  constructor(source: AssetSource) {
    this.source = source;
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Changes whenever anything observable in the store changes. */
  readonly getRevision = (): number => this.revision;

  readonly getState = (): AssetState => this.state;

  private emit(): void {
    this.revision++;
    for (const listener of this.listeners) listener();
  }

  private setState(patch: Partial<AssetState>): void {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  /** Starts loading (once) and keeps the store alive while retained. */
  retain(): () => void {
    this.references++;
    if (this.state.status === 'idle') this.load();
    return () => {
      this.references--;
    };
  }

  /** Discards any loaded assets and starts loading again. */
  reload(): void {
    this.controller?.abort();
    this.sprites.clear();
    this.textures.clear();
    this.composed.clear();
    for (const url of this.blobUrls.values()) URL.revokeObjectURL(url);
    this.blobUrls.clear();
    this.load();
  }

  private load(): void {
    const controller = new AbortController();
    this.controller = controller;
    this.setState({ status: 'loading', progress: undefined, error: undefined, bundle: undefined });
    this.source
      .load({
        signal: controller.signal,
        onProgress: (progress) => {
          if (!controller.signal.aborted) this.setState({ progress });
        },
      })
      .then(
        (bundle) => {
          if (!controller.signal.aborted) this.setState({ status: 'ready', bundle });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          console.error('[cobble-ui] Failed to load game assets', error);
          this.setState({ status: 'error', error });
        },
      );
  }

  /** Returns a decoded GUI sprite, or `undefined` while it is not available (yet). */
  getSprite(id: string): Sprite | undefined {
    const entry = this.sprites.get(id);
    if (entry) return entry.status === 'ready' ? entry.value : undefined;
    const bundle = this.state.bundle;
    if (!bundle) return undefined;

    const path = spritePath(id);
    const png = bundle.file(path);
    if (!png) {
      this.sprites.set(id, { status: 'missing' });
      console.warn(`[cobble-ui] Unknown sprite "${id}"`);
      return undefined;
    }
    this.sprites.set(id, { status: 'pending' });
    const mcmeta = bundle.file(`${path}.mcmeta`);
    Promise.all([png.arrayBuffer(), mcmeta?.text()])
      .then(([bytes, meta]) => {
        const sprite: Sprite = {
          image: decodePng(new Uint8Array(bytes)),
          scaling: parseSpriteScaling(meta === undefined ? undefined : JSON.parse(meta)),
        };
        this.sprites.set(id, { status: 'ready', value: sprite });
        this.emit();
      })
      .catch((error: unknown) => {
        console.error(`[cobble-ui] Failed to decode sprite "${id}"`, error);
        this.sprites.set(id, { status: 'missing' });
      });
    return undefined;
  }

  /** Returns a decoded texture (e.g. `gui/menu_background`). */
  getTexture(id: string): RgbaImage | undefined {
    const entry = this.textures.get(id);
    if (entry) return entry.status === 'ready' ? entry.value : undefined;
    const bundle = this.state.bundle;
    if (!bundle) return undefined;
    const png = bundle.file(texturePath(id));
    if (!png) {
      this.textures.set(id, { status: 'missing' });
      console.warn(`[cobble-ui] Unknown texture "${id}"`);
      return undefined;
    }
    this.textures.set(id, { status: 'pending' });
    png
      .arrayBuffer()
      .then((bytes) => {
        this.textures.set(id, { status: 'ready', value: decodePng(new Uint8Array(bytes)) });
        this.emit();
      })
      .catch((error: unknown) => {
        console.error(`[cobble-ui] Failed to decode texture "${id}"`, error);
        this.textures.set(id, { status: 'missing' });
      });
    return undefined;
  }

  /** Returns a `blob:` URL for a client file, suitable for `<img>` or CSS. */
  getFileUrl(path: string): string | undefined {
    const existing = this.blobUrls.get(path);
    if (existing) return existing;
    const blob = this.state.bundle?.file(path);
    if (!blob || typeof URL.createObjectURL !== 'function') return undefined;
    const url = URL.createObjectURL(blob);
    this.blobUrls.set(path, url);
    return url;
  }

  /** URL of an asset index object (sounds, panorama). */
  getObjectUrl(name: string): string | undefined {
    return this.state.bundle?.objectUrl(name);
  }

  /** Composes (and memoises) a sprite drawn at `width × height` GUI units. */
  compose(id: string, width: number, height: number, scale: number): RgbaImage | undefined {
    const sprite = this.getSprite(id);
    if (!sprite) return undefined;
    const key = `${id}|${width}x${height}@${scale}`;
    const cached = this.composed.get(key);
    if (cached) {
      // Refresh LRU position.
      this.composed.delete(key);
      this.composed.set(key, cached);
      return cached;
    }
    const image = composeSprite(sprite, width, height, scale);
    this.composed.set(key, image);
    if (this.composed.size > COMPOSE_CACHE_LIMIT) {
      const oldest = this.composed.keys().next().value;
      if (oldest !== undefined) this.composed.delete(oldest);
    }
    return image;
  }
}
