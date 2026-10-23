/** One step of an animated sprite: which frame of the sheet, for how many ticks. */
export interface AnimationFrame {
  /** Which frame of the sheet, counting from the top. */
  readonly index: number;
  /** How many ticks it is shown for. */
  readonly time: number;
}

/** The `animation` section of a `.png.mcmeta` file (`AnimationMetadataSection`), with defaults applied. */
export interface SpriteAnimation {
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** Ticks per frame for frames without their own time. */
  readonly frametime: number;
  /** Explicit frame order and times; every frame of the sheet in order when absent. */
  readonly frames: readonly AnimationFrame[] | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

/**
 * Parses the `animation` section of a `.png.mcmeta` file (`AnimationMetadataSection`). Missing
 * `width`/`height` follow `AnimationMetadataSection#calculateFrameSize`.
 */
export function parseSpriteAnimation(
  mcmeta: unknown,
  imageWidth: number,
  imageHeight: number,
): SpriteAnimation | undefined {
  if (!isRecord(mcmeta)) return undefined;
  const animation = mcmeta['animation'];
  if (!isRecord(animation)) return undefined;
  const frametime = positive(animation['frametime']) ?? 1;
  const width = positive(animation['width']);
  const height = positive(animation['height']);
  // `AnimationMetadataSection#calculateFrameSize`: a missing side takes the whole image's, and with
  // neither the frames are the largest square that fits.
  const square = Math.min(imageWidth, imageHeight);
  const frameWidth = width ?? (height === undefined ? square : imageWidth);
  const frameHeight = height ?? (width === undefined ? square : imageHeight);
  const raw = animation['frames'];
  const frames = Array.isArray(raw)
    ? raw.flatMap((entry: unknown): AnimationFrame[] => {
        if (typeof entry === 'number') return [{ index: entry, time: frametime }];
        if (isRecord(entry) && typeof entry['index'] === 'number')
          return [{ index: entry['index'], time: positive(entry['time']) ?? frametime }];
        return [];
      })
    : undefined;
  return { frameWidth, frameHeight, frametime, frames };
}
