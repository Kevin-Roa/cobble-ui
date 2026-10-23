/** Progress reported while an {@link AssetSource} loads. */
export interface AssetLoadProgress {
  /** What is currently happening. */
  readonly phase: 'cache' | 'manifest' | 'download' | 'verify' | 'extract';
  /** Bytes (or items) processed so far in this phase. */
  readonly loaded: number;
  /** Total bytes (or items) for this phase, or `0` when unknown. */
  readonly total: number;
}

export interface AssetLoadOptions {
  readonly signal: AbortSignal;
  readonly onProgress?: (progress: AssetLoadProgress) => void;
}

/**
 * The game files a {@link AssetSource} resolved.
 *
 * Paths are the same as inside the client jar, e.g.
 * `assets/minecraft/textures/gui/sprites/widget/button.png`.
 */
export interface AssetBundle {
  /** The game version these assets belong to, e.g. `"26.3"`. */
  readonly version: string;
  /** Returns an extracted client file, or `undefined` if the bundle does not contain it. */
  file(path: string): Blob | undefined;
  /**
   * Returns a URL for an object from the asset index (sounds, panorama
   * images, …), e.g. `minecraft/sounds/random/click_stereo.ogg`.
   *
   * These URLs point at a server that does not send CORS headers, so they can
   * only be used by `<img>`/`<audio>` elements, not read with `fetch`.
   */
  objectUrl(name: string): string | undefined;
  /** Lists every file path in the bundle, for explorers and tooling. Optional. */
  paths?(): Iterable<string>;
}

/** Something that can produce an {@link AssetBundle}. */
export interface AssetSource {
  /** Uniquely identifies the source so nested providers can share loaded assets. */
  readonly key: string;
  load(options: AssetLoadOptions): Promise<AssetBundle>;
}
