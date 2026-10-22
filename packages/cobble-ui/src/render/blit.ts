import type { NineSliceScaling, SpriteScaling } from './scaling.ts';

/** A decoded, non-premultiplied RGBA image. */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

export interface Sprite {
  readonly image: RgbaImage;
  readonly scaling: SpriteScaling;
}

/**
 * A software re-implementation of the parts of `GuiGraphicsExtractor` that
 * draw sprites (`blitSprite`, `blitNineSlicedSprite`, `blitTiledSprite`).
 *
 * Drawing happens at *device* resolution: every output pixel samples the
 * texture at its own centre with nearest-neighbour filtering, exactly like the
 * GPU does in-game. This keeps non-integer stretches (e.g. the 20×20 checkbox
 * sprite drawn into a 17×17 box) identical to vanilla at every GUI scale.
 */
class Canvas {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly scale: number;

  constructor(width: number, height: number, scale: number) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  /** Device pixel range covered by `[from, to)` in GUI units (top-left fill rule). */
  private span(from: number, to: number, limit: number): readonly [number, number] {
    const start = Math.max(0, Math.ceil(from * this.scale - 0.5));
    const end = Math.min(limit, Math.ceil(to * this.scale - 0.5));
    return [start, end];
  }

  /**
   * Draws a textured quad. `u`/`v` are normalised texture coordinates.
   * When `tileWidth`/`tileHeight` are given the UV range is repeated every
   * tile instead of being stretched across the quad (`innerTiledBlit`).
   */
  quad(
    texture: RgbaImage,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    u0: number,
    u1: number,
    v0: number,
    v1: number,
    tileWidth?: number,
    tileHeight?: number,
  ): void {
    if (x1 <= x0 || y1 <= y0) return;
    const [px0, px1] = this.span(x0, x1, this.width);
    const [py0, py1] = this.span(y0, y1, this.height);
    if (px1 <= px0 || py1 <= py0) return;

    const texW = texture.width;
    const texH = texture.height;
    const columns = new Int32Array(px1 - px0);
    for (let px = px0; px < px1; px++) {
      const local = (px + 0.5) / this.scale - x0;
      const t = tileWidth === undefined ? local / (x1 - x0) : (local % tileWidth) / tileWidth;
      const u = u0 + t * (u1 - u0);
      columns[px - px0] = Math.min(texW - 1, Math.max(0, Math.floor(u * texW)));
    }

    const src = texture.data;
    const dst = this.data;
    for (let py = py0; py < py1; py++) {
      const local = (py + 0.5) / this.scale - y0;
      const t = tileHeight === undefined ? local / (y1 - y0) : (local % tileHeight) / tileHeight;
      const v = v0 + t * (v1 - v0);
      const ty = Math.min(texH - 1, Math.max(0, Math.floor(v * texH)));
      const srcRow = ty * texW;
      let o = (py * this.width + px0) * 4;
      for (let i = 0; i < columns.length; i++) {
        const s = (srcRow + (columns[i] ?? 0)) * 4;
        dst[o] = src[s] ?? 0;
        dst[o + 1] = src[s + 1] ?? 0;
        dst[o + 2] = src[s + 2] ?? 0;
        dst[o + 3] = src[s + 3] ?? 0;
        o += 4;
      }
    }
  }

  toImage(): RgbaImage {
    return { width: this.width, height: this.height, data: this.data };
  }
}

/** Size, in device pixels, of a GUI-unit length at the given device scale. */
export function deviceSize(guiSize: number, scale: number): number {
  return Math.max(0, Math.ceil(guiSize * scale - 0.5));
}

/** `blitSprite(sprite, spriteW, spriteH, texX, texY, x, y, w, h)` — a sub-region stretch. */
function blitRegion(
  canvas: Canvas,
  texture: RgbaImage,
  spriteWidth: number,
  spriteHeight: number,
  textureX: number,
  textureY: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (width === 0 || height === 0) return;
  canvas.quad(
    texture,
    x,
    y,
    x + width,
    y + height,
    textureX / spriteWidth,
    (textureX + width) / spriteWidth,
    textureY / spriteHeight,
    (textureY + height) / spriteHeight,
  );
}

function blitTiled(
  canvas: Canvas,
  texture: RgbaImage,
  x: number,
  y: number,
  width: number,
  height: number,
  textureX: number,
  textureY: number,
  tileWidth: number,
  tileHeight: number,
  spriteWidth: number,
  spriteHeight: number,
): void {
  if (width <= 0 || height <= 0) return;
  canvas.quad(
    texture,
    x,
    y,
    x + width,
    y + height,
    textureX / spriteWidth,
    (textureX + tileWidth) / spriteWidth,
    textureY / spriteHeight,
    (textureY + tileHeight) / spriteHeight,
    tileWidth,
    tileHeight,
  );
}

function blitInnerSegment(
  canvas: Canvas,
  nineSlice: NineSliceScaling,
  texture: RgbaImage,
  x: number,
  y: number,
  width: number,
  height: number,
  textureX: number,
  textureY: number,
  textureWidth: number,
  textureHeight: number,
): void {
  if (width <= 0 || height <= 0) return;
  const sw = nineSlice.width;
  const sh = nineSlice.height;
  if (nineSlice.stretchInner) {
    canvas.quad(
      texture,
      x,
      y,
      x + width,
      y + height,
      textureX / sw,
      (textureX + textureWidth) / sw,
      textureY / sh,
      (textureY + textureHeight) / sh,
    );
  } else {
    blitTiled(
      canvas,
      texture,
      x,
      y,
      width,
      height,
      textureX,
      textureY,
      textureWidth,
      textureHeight,
      sw,
      sh,
    );
  }
}

function blitNineSlice(
  canvas: Canvas,
  texture: RgbaImage,
  nineSlice: NineSliceScaling,
  width: number,
  height: number,
): void {
  const { border } = nineSlice;
  const left = Math.min(border.left, Math.trunc(width / 2));
  const right = Math.min(border.right, Math.trunc(width / 2));
  const top = Math.min(border.top, Math.trunc(height / 2));
  const bottom = Math.min(border.bottom, Math.trunc(height / 2));
  const sw = nineSlice.width;
  const sh = nineSlice.height;
  const x = 0;
  const y = 0;

  if (width === sw && height === sh) {
    blitRegion(canvas, texture, sw, sh, 0, 0, x, y, width, height);
  } else if (height === sh) {
    blitRegion(canvas, texture, sw, sh, 0, 0, x, y, left, height);
    blitInnerSegment(
      canvas,
      nineSlice,
      texture,
      x + left,
      y,
      width - right - left,
      height,
      left,
      0,
      sw - right - left,
      sh,
    );
    blitRegion(canvas, texture, sw, sh, sw - right, 0, x + width - right, y, right, height);
  } else if (width === sw) {
    blitRegion(canvas, texture, sw, sh, 0, 0, x, y, width, top);
    blitInnerSegment(
      canvas,
      nineSlice,
      texture,
      x,
      y + top,
      width,
      height - bottom - top,
      0,
      top,
      sw,
      sh - bottom - top,
    );
    blitRegion(canvas, texture, sw, sh, 0, sh - bottom, x, y + height - bottom, width, bottom);
  } else {
    const innerW = width - right - left;
    const innerH = height - bottom - top;
    const texInnerW = sw - right - left;
    const texInnerH = sh - bottom - top;
    blitRegion(canvas, texture, sw, sh, 0, 0, x, y, left, top);
    blitInnerSegment(canvas, nineSlice, texture, x + left, y, innerW, top, left, 0, texInnerW, top);
    blitRegion(canvas, texture, sw, sh, sw - right, 0, x + width - right, y, right, top);
    blitRegion(canvas, texture, sw, sh, 0, sh - bottom, x, y + height - bottom, left, bottom);
    blitInnerSegment(
      canvas,
      nineSlice,
      texture,
      x + left,
      y + height - bottom,
      innerW,
      bottom,
      left,
      sh - bottom,
      texInnerW,
      bottom,
    );
    blitRegion(
      canvas,
      texture,
      sw,
      sh,
      sw - right,
      sh - bottom,
      x + width - right,
      y + height - bottom,
      right,
      bottom,
    );
    blitInnerSegment(canvas, nineSlice, texture, x, y + top, left, innerH, 0, top, left, texInnerH);
    blitInnerSegment(
      canvas,
      nineSlice,
      texture,
      x + left,
      y + top,
      innerW,
      innerH,
      left,
      top,
      texInnerW,
      texInnerH,
    );
    blitInnerSegment(
      canvas,
      nineSlice,
      texture,
      x + width - right,
      y + top,
      right,
      innerH,
      sw - right,
      top,
      right,
      texInnerH,
    );
  }
}

/**
 * Renders a GUI sprite into a `width × height` GUI-unit box, at `scale` device
 * pixels per GUI unit. Returns a new image `deviceSize(width) × deviceSize(height)`.
 */
export function composeSprite(
  sprite: Sprite,
  width: number,
  height: number,
  scale: number,
): RgbaImage {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
    throw new RangeError(`Sprite size must be a non-negative integer, got ${width}×${height}`);
  }
  if (!(scale > 0)) throw new RangeError(`Scale must be positive, got ${scale}`);
  const canvas = new Canvas(deviceSize(width, scale), deviceSize(height, scale), scale);
  if (width === 0 || height === 0) return canvas.toImage();

  const { image, scaling } = sprite;
  switch (scaling.type) {
    case 'stretch':
      canvas.quad(image, 0, 0, width, height, 0, 1, 0, 1);
      break;
    case 'tile':
      blitTiled(
        canvas,
        image,
        0,
        0,
        width,
        height,
        0,
        0,
        scaling.width,
        scaling.height,
        scaling.width,
        scaling.height,
      );
      break;
    case 'nine_slice':
      blitNineSlice(canvas, image, scaling, width, height);
      break;
  }
  return canvas.toImage();
}

/**
 * Renders a full texture repeated every `tileWidth × tileHeight` GUI units, as
 * done by `blit(..., textureWidth, textureHeight)` for menu backgrounds and
 * separators. `offsetX`/`offsetY` shift the pattern (the `u`/`v` arguments).
 */
export function composeTiledTexture(
  texture: RgbaImage,
  width: number,
  height: number,
  tileWidth: number,
  tileHeight: number,
  scale: number,
  offsetX = 0,
  offsetY = 0,
): RgbaImage {
  const canvas = new Canvas(deviceSize(width, scale), deviceSize(height, scale), scale);
  const shiftX = ((offsetX % tileWidth) + tileWidth) % tileWidth;
  const shiftY = ((offsetY % tileHeight) + tileHeight) % tileHeight;
  canvas.quad(texture, -shiftX, -shiftY, width, height, 0, 1, 0, 1, tileWidth, tileHeight);
  return canvas.toImage();
}
