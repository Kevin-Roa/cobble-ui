/**
 * Rasterizes an item icon (`ItemIcon`): resolves the item's definition and model with
 * `item-model.ts`, then draws the flat layers or projected faces with 2D canvas transforms.
 * Environment-agnostic: it runs on the main thread (DOM canvases) and in the item worker
 * (`OffscreenCanvas`), so every renderer that plugs into `resolveItem` works in both.
 */
import type { RgbaImage } from './blit.ts';
import { resolveItem, type ResolvedModel } from './item-model.ts';
import { blockEntityTextures } from './model3d/block-entity-models.ts';
import { renderBlockEntityIcon, renderEntityIcon, renderPartsIcon } from './model3d/entity-icon.ts';

export type CanvasLike = HTMLCanvasElement | OffscreenCanvas;
export type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface Region {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** What the rasterizer reads from, so it does not care where files come from. */
export interface ItemDrawEnv {
  /** Parsed JSON (`undefined` while loading, `null` when missing), like `AssetStore#getJson`. */
  json(path: string): unknown;
  /** A decoded texture (`item/stick`), `undefined` while loading or when missing. */
  texture(id: string): RgbaImage | undefined;
  /** Whether the client has the texture; `undefined` while that is not known yet. */
  hasTexture(id: string): boolean | undefined;
  createCanvas(width: number, height: number): CanvasLike;
}

/** Copies a region of a decoded texture onto a canvas, optionally darkening and tinting it. */
export function tintedCanvas(
  image: RgbaImage,
  region: Region,
  shade: number,
  tint: number | undefined,
  createCanvas: ItemDrawEnv['createCanvas'],
): CanvasLike {
  const tr = tint === undefined ? 1 : ((tint >> 16) & 255) / 255;
  const tg = tint === undefined ? 1 : ((tint >> 8) & 255) / 255;
  const tb = tint === undefined ? 1 : (tint & 255) / 255;
  const canvas = createCanvas(region.width, region.height);
  const context = canvas.getContext('2d') as Context2D | null;
  if (!context) return canvas;
  const out = context.createImageData(region.width, region.height);
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      const source = ((region.y + y) * image.width + region.x + x) * 4;
      const target = (y * region.width + x) * 4;
      out.data[target] = (image.data[source] ?? 0) * shade * tr;
      out.data[target + 1] = (image.data[source + 1] ?? 0) * shade * tg;
      out.data[target + 2] = (image.data[source + 2] ?? 0) * shade * tb;
      out.data[target + 3] = image.data[source + 3] ?? 0;
    }
  }
  context.putImageData(out, 0, 0);
  return canvas;
}

/** The first frame of a texture: animated sheets are stacked squares, so crop to a square. */
export function firstFrame(image: RgbaImage): Region {
  return { x: 0, y: 0, width: image.width, height: Math.min(image.height, image.width) };
}

/** Every texture id an item's models draw. */
export function modelTextureIds(model: ResolvedModel, ids: Set<string>): void {
  if (model.layers) for (const id of model.layers) ids.add(id);
  else
    for (const element of model.elements)
      for (const face of Object.values(element.faces)) {
        if (!face) continue;
        const texture = face.texture.startsWith('#')
          ? model.textures[face.texture.slice(1)]
          : face.texture.replace(/^minecraft:/, '');
        if (texture !== undefined) ids.add(texture);
      }
}

/**
 * The textures an item needs, or `undefined` while its definition is loading. Used to warm caches
 * ahead of time. Items without a definition need `item/<name>`.
 */
export function itemTextureIds(
  name: string,
  json: (path: string) => unknown,
): readonly string[] | undefined {
  const parts = resolveItem(name, json);
  if (parts === undefined) return undefined;
  if (parts === null) return [`item/${name}`];
  const ids = new Set<string>();
  for (const part of parts) {
    modelTextureIds(part.model, ids);
    if (part.entity) ids.add(part.entity.texture);
    if (part.blockEntity) for (const id of blockEntityTextures(part.blockEntity)) ids.add(id);
  }
  return [...ids];
}

/** Pixel size of the canvas an item at `unit` device pixels per GUI unit is drawn on. */
export function itemPixelSize(unit: number): number {
  return Math.max(Math.round(16 * unit), 1);
}

/** Draws an item into a 16-unit square scaled by `unit` device pixels per unit. */
export function drawItem(context: Context2D, env: ItemDrawEnv, name: string, unit: number): void {
  const parts = resolveItem(name, (path) => env.json(path));
  const tinted = (image: RgbaImage, region: Region, shade = 1, tint?: number): CanvasLike =>
    tintedCanvas(image, region, shade, tint, env.createCanvas);
  if (!parts) {
    // No definition (or still loading): fall back to the plain item texture.
    const flat =
      parts === null && env.hasTexture(`item/${name}`) === true
        ? env.texture(`item/${name}`)
        : undefined;
    if (flat) context.drawImage(tinted(flat, firstFrame(flat)), 0, 0, 16 * unit, 16 * unit);
    return;
  }
  let elementsDrawn = false;
  for (const part of parts) {
    const { model, tints } = part;
    if (part.blockEntity) {
      // Chests, banners, shields, ...: code-defined models drawn with `display.gui` and GUI lights.
      const size = itemPixelSize(unit);
      const image = renderBlockEntityIcon(
        part.blockEntity,
        (id) => env.texture(id),
        model.gui,
        size,
        model.light === 'front',
      );
      const layer = env.createCanvas(size, size);
      const layerContext = layer.getContext('2d') as Context2D | null;
      if (layerContext) {
        layerContext.putImageData(
          new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
          0,
          0,
        );
        context.drawImage(layer, 0, 0, 16 * unit, 16 * unit);
      }
      continue;
    }
    if (part.entity) {
      // Heads and the copper golem are code-defined models (`special`), drawn with the base
      // model's `display.gui` transform by the software renderer.
      const texture = env.texture(part.entity.texture);
      if (texture) {
        const size = itemPixelSize(unit);
        const image = renderEntityIcon(part.entity, texture, model.gui, size);
        const layer = env.createCanvas(size, size);
        const layerContext = layer.getContext('2d') as Context2D | null;
        if (layerContext) {
          layerContext.putImageData(
            new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
            0,
            0,
          );
          context.drawImage(layer, 0, 0, 16 * unit, 16 * unit);
        }
      }
      continue;
    }
    if (model.layers) {
      model.layers.forEach((id, index) => {
        const texture = env.texture(id);
        if (!texture) return;
        context.drawImage(
          tinted(texture, firstFrame(texture), 1, tints[index]),
          0,
          0,
          16 * unit,
          16 * unit,
        );
      });
      continue;
    }
    // Element models (blocks, shelves, walls, beds) go through the software 3D renderer: its depth
    // buffer resolves concave shapes, and the item node's `transformation` places composite halves.
    // All element parts share one render so their depths compete with each other.
    if (elementsDrawn) continue;
    elementsDrawn = true;
    const size = itemPixelSize(unit);
    const image = renderPartsIcon(
      parts.filter((p) => !p.entity && !p.blockEntity && !p.model.layers),
      (id) => env.texture(id),
      size,
    );
    const layer = env.createCanvas(size, size);
    const layerContext = layer.getContext('2d') as Context2D | null;
    if (layerContext) {
      layerContext.putImageData(
        new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
        0,
        0,
      );
      context.drawImage(layer, 0, 0, 16 * unit, 16 * unit);
    }
  }
}
