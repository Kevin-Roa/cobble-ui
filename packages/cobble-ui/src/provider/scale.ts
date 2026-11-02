/**
 * Mirrors `com.mojang.blaze3d.platform.Window#calculateScale`: the largest
 * scale at which the GUI is still at least 320×240 units, optionally capped.
 *
 * @param width  Available width (CSS pixels).
 * @param height Available height (CSS pixels).
 * @param max    Upper bound, or `0` for no limit (vanilla's "Auto").
 * @param enforceUnicode Vanilla's "Force Unicode Font": an odd scale is bumped to the next even one.
 */
export function calculateAutoGuiScale(
  width: number,
  height: number,
  max = 0,
  enforceUnicode = false,
): number {
  let scale = 1;
  while (
    scale !== max &&
    scale < width &&
    scale < height &&
    Math.trunc(width / (scale + 1)) >= 320 &&
    Math.trunc(height / (scale + 1)) >= 240
  ) {
    scale++;
  }
  if (enforceUnicode && scale % 2 !== 0) scale++;
  return scale;
}

export interface ResolvedScale {
  /** CSS pixels per GUI unit. */
  readonly unit: number;
  /** Device pixels per GUI unit. */
  readonly device: number;
}

/**
 * Resolves the CSS size of one GUI unit. With `snap`, the size is rounded so
 * one GUI unit covers a whole number of device pixels, which keeps sprites
 * crisp on fractional device pixel ratios.
 */
export function resolveScale(
  guiScale: number,
  devicePixelRatio: number,
  snap: boolean,
): ResolvedScale {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  if (!snap) return { unit: guiScale, device: guiScale * dpr };
  const device = Math.max(1, Math.round(guiScale * dpr));
  return { unit: device / dpr, device };
}
