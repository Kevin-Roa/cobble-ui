/**
 * Entry point of the item worker. Bundled by Vite (`new Worker(new URL(...))`) and emitted by
 * tsdown as `item-worker.js` next to the library. Do not import it from library code.
 */
import {
  ItemRenderer,
  type ItemWorkerRequest,
  type ItemWorkerResponse,
} from './item-worker-core.ts';

interface WorkerScope {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<ItemWorkerRequest>) => void,
  ): void;
  postMessage(message: ItemWorkerResponse, transfer?: Transferable[]): void;
}

// Dedicated workers have no target origin to pass to `postMessage`.
function post(message: ItemWorkerResponse, transfer: Transferable[] = []): void {
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  scope.postMessage(message, transfer);
}

const scope = globalThis as unknown as WorkerScope;
const waiting = new Map<string, ((blob: Blob | null) => void)[]>();

const renderer = new ItemRenderer(
  (path) =>
    new Promise<Blob | null>((resolve) => {
      const list = waiting.get(path);
      if (list) list.push(resolve);
      else {
        waiting.set(path, [resolve]);
        post({ type: 'file', path });
      }
    }),
);

scope.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.type) {
    case 'file': {
      const list = waiting.get(message.path);
      waiting.delete(message.path);
      for (const resolve of list ?? []) resolve(message.blob);
      break;
    }
    case 'reset':
      renderer.reset();
      break;
    case 'render':
      renderer.render(message.name, message.unit).then(
        (bitmap) => {
          post({ type: 'result', id: message.id, bitmap }, bitmap ? [bitmap] : []);
        },
        () => {
          post({ type: 'result', id: message.id, bitmap: null });
        },
      );
      break;
  }
});

post({ type: 'ready' });
