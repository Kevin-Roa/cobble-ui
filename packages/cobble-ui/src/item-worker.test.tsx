import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { png } from '../test/utils.tsx';
import { ItemRasterizer, runPreload, workerSupported } from './assets/item-rasterizer.ts';
import { AssetStore } from './assets/store.ts';
import { CobbleProvider, ItemIcon, memoryAssets } from './index.ts';
import { itemTextureIds } from './render/item-raster.ts';
import type { ItemWorkerRequest, ItemWorkerResponse } from './render/item-worker-core.ts';

const item = (name: string): string => `assets/minecraft/items/${name}.json`;

function itemFiles(): Record<string, Blob | Uint8Array> {
  return {
    [item('stick')]: new Blob([JSON.stringify({ model: { type: 'model', model: 'item/stick' } })]),
    'assets/minecraft/models/item/stick.json': new Blob([
      JSON.stringify({ parent: 'item/generated', textures: { layer0: 'item/stick' } }),
    ]),
    'assets/minecraft/textures/item/stick.png': png(16, 16, () => [200, 100, 50, 255]),
  };
}

const json = (path: string): unknown =>
  ({
    [item('stick')]: { model: { type: 'model', model: 'item/stick' } },
    'assets/minecraft/models/item/stick.json': {
      parent: 'item/generated',
      textures: { layer0: 'item/stick' },
    },
  })[path] ?? null;

class FakeWorker {
  private readonly listeners: Record<string, ((event: never) => void)[]> = {};
  addEventListener(type: string, listener: (event: never) => void): void {
    (this.listeners[type] ??= []).push(listener);
  }
  fail(): void {
    for (const listener of this.listeners['error'] ?? []) listener(undefined as never);
  }
  readonly sent: ItemWorkerRequest[] = [];
  terminated = false;
  postMessage(message: ItemWorkerRequest): void {
    this.sent.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  emit(message: ItemWorkerResponse): void {
    for (const listener of this.listeners['message'] ?? []) listener({ data: message } as never);
  }
}

function rasterizer(files: Record<string, Blob> = {}): {
  worker: FakeWorker;
  items: ItemRasterizer;
  notify: ReturnType<typeof vi.fn<() => void>>;
} {
  const worker = new FakeWorker();
  const notify = vi.fn<() => void>();
  const items = new ItemRasterizer({
    file: (path) => files[path],
    ready: () => true,
    notify,
    createWorker: () => worker as unknown as Worker,
  });
  return { worker, items, notify };
}

describe('background item rendering', () => {
  it('is unsupported without Worker/OffscreenCanvas (jsdom)', () => {
    expect(workerSupported()).toBe(false);
    const store = new AssetStore(memoryAssets({ files: {} }));
    expect(store.items.supported).toBe(false);
  });

  it('runPreload works in chunks, retries unfinished items and cancels', async () => {
    const queue: (() => void)[] = [];
    const schedule = (callback: () => void): (() => void) => {
      queue.push(callback);
      return () => undefined;
    };
    const seen: string[] = [];
    let attempts = 0;
    const done = vi.fn<() => void>();
    runPreload({
      names: ['a', 'b', 'c'],
      chunk: 2,
      schedule,
      onDone: done,
      step: (name) => {
        seen.push(name);
        return name === 'a' && ++attempts < 2 ? false : undefined;
      },
    });
    const flush = async (): Promise<void> => {
      queue.shift()?.();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };
    await flush();
    expect(seen).toEqual(['a', 'b']);
    await flush();
    expect(seen).toEqual(['a', 'b', 'c', 'a']);
    await flush();
    expect(done).toHaveBeenCalledOnce();

    const cancelled = vi.fn<(name: string) => void>();
    const cancel = runPreload({ names: ['x'], schedule, step: cancelled });
    cancel();
    await flush();
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('talks to the worker: renders, answers file requests, caches bitmaps', async () => {
    const stickJson = new Blob(['{}']);
    const { worker, items, notify } = rasterizer({ [item('stick')]: stickJson });
    expect(items.supported).toBe(true);
    expect(items.get('stick', 2)).toBeUndefined();
    expect(worker.sent).toEqual([{ type: 'render', id: 0, name: 'stick', unit: 2 }]);
    // Asking again while in flight does not send another request.
    items.get('stick', 2);
    expect(worker.sent).toHaveLength(1);

    worker.emit({ type: 'file', path: item('stick') });
    worker.emit({ type: 'file', path: 'missing.json' });
    expect(worker.sent[1]).toEqual({ type: 'file', path: item('stick'), blob: stickJson });
    expect(worker.sent[2]).toEqual({ type: 'file', path: 'missing.json', blob: null });

    const bitmap = { close: vi.fn<() => void>() } as unknown as ImageBitmap;
    worker.emit({ type: 'result', id: 0, bitmap });
    expect(items.get('stick', 2)).toBe(bitmap);
    expect(items.has('stick', 2)).toBe(true);
    await waitFor(() => {
      expect(notify).toHaveBeenCalledOnce();
    });

    items.reset();
    expect(bitmap.close).toHaveBeenCalled();
    expect(worker.sent.at(-1)).toEqual({ type: 'reset' });
    expect(items.has('stick', 2)).toBe(false);
  });

  it('falls back to the main thread when the worker fails', () => {
    const { worker, items } = rasterizer();
    items.get('stick', 1);
    worker.fail();
    expect(items.supported).toBe(false);
    expect(worker.terminated).toBe(true);
  });

  it('lists the textures an item needs', () => {
    expect(itemTextureIds('stick', json)).toEqual(['item/stick']);
    expect(itemTextureIds('nothing', json)).toEqual(['item/nothing']);
    expect(itemTextureIds('stick', () => undefined)).toBeUndefined();
  });

  it('preloads item textures on the main thread when workers are unavailable', async () => {
    const store = new AssetStore(memoryAssets({ files: itemFiles() }));
    const release = store.retain();
    await waitFor(() => {
      expect(store.getState().status).toBe('ready');
    });
    store.preloadItems(['stick'], 2);
    await waitFor(() => {
      expect(store.getTexture('item/stick')).toBeDefined();
    });
    release();
  });

  it('CobbleProvider backgroundPreloadItems renders item icons', async () => {
    const source = memoryAssets({ files: itemFiles() });
    const { unmount } = render(
      <CobbleProvider assets={source} guiScale={2} backgroundPreloadItems={['stick']}>
        <ItemIcon name="stick" />
      </CobbleProvider>,
    );
    await waitFor(() => {
      expect(document.querySelector('[data-item="stick"]')).not.toBeNull();
    });
    unmount();
  });

  it('accepts backgroundPreloadItems={true}', () => {
    const source = memoryAssets({ files: itemFiles() });
    const { unmount } = render(
      <CobbleProvider assets={source} backgroundPreloadItems>
        <div />
      </CobbleProvider>,
    );
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
