import type { AssetBundle, AssetSource } from './types.ts';

export interface MemoryAssetsOptions {
  /** Version label reported by the bundle. */
  readonly version?: string;
  /** Client files keyed by their path inside the jar. */
  readonly files: Readonly<Record<string, Blob | Uint8Array>>;
  /** Asset index objects keyed by name, mapped to a URL. */
  readonly objects?: Readonly<Record<string, string>>;
}

let nextId = 0;

/**
 * An {@link AssetSource} backed by in-memory files. Mainly useful in tests and
 * when rendering on the server, where downloading the game is not possible.
 */
export function memoryAssets(options: MemoryAssetsOptions): AssetSource {
  const files = new Map<string, Blob>();
  for (const [path, value] of Object.entries(options.files)) {
    files.set(path, value instanceof Blob ? value : new Blob([new Uint8Array(value)]));
  }
  const objects = options.objects ?? {};
  const bundle: AssetBundle = {
    version: options.version ?? 'memory',
    file: (path) => files.get(path),
    objectUrl: (name) => objects[name],
  };
  return {
    key: `memory:${String(++nextId)}:${bundle.version}`,
    load: () => Promise.resolve(bundle),
  };
}
