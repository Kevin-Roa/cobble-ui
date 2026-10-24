import type { ItemWorkerRequest, ItemWorkerResponse } from '../render/item-worker-core.ts';

const CACHE_LIMIT = 512;

/** Creates the item worker. Replaceable in tests. */
export type ItemWorkerFactory = () => Worker;

/**
 * The URL form must stay literal so Vite bundles the worker for the site; tsdown emits
 * `item-worker.js` next to `index.js` and rewrites the path.
 */
function createItemWorker(): Worker {
  return new Worker(new URL('../render/item-worker.ts', import.meta.url), { type: 'module' });
}

/** Whether items can be rasterized off the main thread in this environment. */
export function workerSupported(): boolean {
  return typeof Worker === 'function' && typeof OffscreenCanvas === 'function';
}

export interface ItemRasterizerOptions {
  /** Reads a client file; `undefined` when missing or when the assets are not loaded yet. */
  readonly file: (path: string) => Blob | undefined;
  /** Whether the assets are loaded, so files can be answered. */
  readonly ready: () => boolean;
  /** Called (coalesced) when new bitmaps are available. */
  readonly notify: () => void;
  readonly createWorker?: ItemWorkerFactory;
}

/**
 * Main-thread handle to the item worker. Asks it for item icons (resolved from the game's item
 * definitions, models and textures, decoded and rasterized off-thread) and caches the returned
 * `ImageBitmap`s. When workers or `OffscreenCanvas` are missing (or the worker fails), `supported`
 * is `false` and callers draw on the main thread instead.
 */
export class ItemRasterizer {
  private readonly options: ItemRasterizerOptions;
  private worker: Worker | undefined;
  private failed = false;
  private nextId = 0;
  private readonly bitmaps = new Map<string, ImageBitmap | null>();
  private readonly inflight = new Map<string, Promise<void>>();
  private readonly waiting = new Map<number, { key: string; done: () => void }>();
  private notifyQueued = false;

  constructor(options: ItemRasterizerOptions) {
    this.options = options;
  }

  /** Whether requests are served by the worker. */
  get supported(): boolean {
    if (this.failed) return false;
    return this.options.createWorker !== undefined || workerSupported();
  }

  private static key(name: string, unit: number): string {
    return `${name}@${unit.toFixed(4)}`;
  }

  /** The rasterized item, or `undefined` while it is not ready (a request is started). */
  get(name: string, unit: number): ImageBitmap | undefined {
    const key = ItemRasterizer.key(name, unit);
    const cached = this.bitmaps.get(key);
    if (cached !== undefined) {
      // Refresh LRU position.
      this.bitmaps.delete(key);
      this.bitmaps.set(key, cached);
      return cached ?? undefined;
    }
    void this.request(name, unit);
    return undefined;
  }

  /** Whether the item has been rasterized (even if nothing was drawn). */
  has(name: string, unit: number): boolean {
    return this.bitmaps.has(ItemRasterizer.key(name, unit));
  }

  /** Rasterizes an item in the background; resolves when it is cached. */
  request(name: string, unit: number): Promise<void> {
    const key = ItemRasterizer.key(name, unit);
    if (this.bitmaps.has(key)) return Promise.resolve();
    const existing = this.inflight.get(key);
    if (existing) return existing;
    if (!this.options.ready()) return Promise.resolve();
    const worker = this.ensureWorker();
    if (!worker) return Promise.resolve();
    const id = this.nextId++;
    const promise = new Promise<void>((resolve) => {
      this.waiting.set(id, {
        key,
        done: () => {
          this.inflight.delete(key);
          resolve();
        },
      });
    });
    this.inflight.set(key, promise);
    this.post({ type: 'render', id, name, unit });
    return promise;
  }

  /** Forgets everything (the assets were reloaded). */
  reset(): void {
    for (const bitmap of this.bitmaps.values()) bitmap?.close();
    this.bitmaps.clear();
    this.post({ type: 'reset' });
    // Renders in flight were started against the old files; their results are dropped.
    const stale = [...this.waiting.values()];
    this.waiting.clear();
    for (const entry of stale) entry.done();
    this.inflight.clear();
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
    const stale = [...this.waiting.values()];
    this.waiting.clear();
    for (const entry of stale) entry.done();
    this.inflight.clear();
    for (const bitmap of this.bitmaps.values()) bitmap?.close();
    this.bitmaps.clear();
  }

  private post(message: ItemWorkerRequest): void {
    this.worker?.postMessage(message);
  }

  private ensureWorker(): Worker | undefined {
    if (this.worker) return this.worker;
    if (!this.supported) return undefined;
    try {
      const worker = (this.options.createWorker ?? createItemWorker)();
      worker.addEventListener('message', (event: MessageEvent<ItemWorkerResponse>) => {
        this.handle(event.data);
      });
      worker.addEventListener('error', () => {
        this.fail();
      });
      this.worker = worker;
      return worker;
    } catch {
      this.fail();
      return undefined;
    }
  }

  private fail(): void {
    this.failed = true;
    this.dispose();
    this.queueNotify();
  }

  private handle(message: ItemWorkerResponse): void {
    switch (message.type) {
      case 'ready':
        break;
      case 'file': {
        const blob = this.options.ready() ? this.options.file(message.path) : undefined;
        this.post({ type: 'file', path: message.path, blob: blob ?? null });
        break;
      }
      case 'result': {
        const entry = this.waiting.get(message.id);
        if (!entry) {
          message.bitmap?.close();
          break;
        }
        this.waiting.delete(message.id);
        this.bitmaps.set(entry.key, message.bitmap);
        if (this.bitmaps.size > CACHE_LIMIT) {
          const oldest = this.bitmaps.keys().next().value;
          if (oldest !== undefined) {
            this.bitmaps.get(oldest)?.close();
            this.bitmaps.delete(oldest);
          }
        }
        entry.done();
        this.queueNotify();
        break;
      }
    }
  }

  private queueNotify(): void {
    if (this.notifyQueued) return;
    this.notifyQueued = true;
    setTimeout(() => {
      this.notifyQueued = false;
      this.options.notify();
    }, 0);
  }
}

// ---------------------------------------------------------------------------------- preloading

export interface PreloadOptions {
  readonly names: readonly string[];
  /**
   * Handles one item. Return `false` when it cannot be done yet (its files are still loading):
   * it is retried after the other items, up to `retries` times.
   */
  readonly step: (name: string) => boolean | void | Promise<boolean | void>;
  /** Items handled per idle slice. Defaults to 4. */
  readonly chunk?: number;
  readonly retries?: number;
  /** Runs `callback` when the browser is idle. Defaults to `requestIdleCallback` (or a timeout). */
  readonly schedule?: (callback: () => void) => () => void;
  readonly onDone?: () => void;
}

/** Runs `callback` when the main thread is idle. */
export function scheduleIdle(callback: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback, { timeout: 2000 });
    return () => {
      cancelIdleCallback(handle);
    };
  }
  const handle = setTimeout(callback, 16);
  return () => {
    clearTimeout(handle);
  };
}

/**
 * Works through `names` in idle-time slices so a long list never blocks input or rendering.
 * Returns a function that cancels the rest.
 */
export function runPreload(options: PreloadOptions): () => void {
  const { step, chunk = 4, retries = 20, schedule = scheduleIdle } = options;
  let queue = options.names.map((name) => ({ name, tries: 0 }));
  let cancelled = false;
  let cancelSlice: (() => void) | undefined;
  const slice = (): void => {
    cancelSlice = undefined;
    if (cancelled) return;
    const batch = queue.slice(0, chunk);
    queue = queue.slice(chunk);
    void Promise.all(
      batch.map(async (item) => {
        let result: boolean | void;
        try {
          result = await step(item.name);
        } catch {
          return;
        }
        if (result === false && ++item.tries <= retries) queue.push(item);
      }),
    ).then(() => {
      if (cancelled) return;
      if (queue.length === 0) options.onDone?.();
      else cancelSlice = schedule(slice);
    });
  };
  if (queue.length === 0) options.onDone?.();
  else cancelSlice = schedule(slice);
  return () => {
    cancelled = true;
    cancelSlice?.();
  };
}
