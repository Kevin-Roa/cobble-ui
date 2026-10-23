import type { EffectId } from '../../assets/effect-ids.ts';
import { useRef, type JSX, type Ref } from 'react';
import { useIsomorphicLayoutEffect, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import type { RgbaImage } from '../../render/blit.ts';
import { useCobble } from '../../provider/context.ts';
import type { AssetStore } from '../../assets/store.ts';
import { projectModel, resolveItem } from '../../render/item-model.ts';
import { useAssetRevision, useTexture } from '../../provider/hooks.ts';
import { cx } from '../shared.ts';
import { PlayerAvatar } from '../player/PlayerAvatar.tsx';

/** Size of an item in a slot, in GUI units. */
export const ITEM_ICON_SIZE = 16;
/** Size of a mob effect icon (`textures/mob_effect/*.png`). */
export const EFFECT_ICON_SIZE = 18;
/** Size of a drawn player head, as in a chat line or tab list entry. */
export const PLAYER_HEAD_SIZE = 8;
/** The skin used when none is given (`DefaultPlayerSkin`'s Steve). */
export const DEFAULT_SKIN = 'entity/player/wide/steve';

type CanvasProps = Omit<SlotProps<'canvas'>, 'width' | 'height' | 'children'>;

interface Region {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Copies a region of a decoded texture onto a canvas, optionally darkening it. */
function toCanvas(image: RgbaImage, region: Region, shade = 1, tint?: number): HTMLCanvasElement {
  const tr = tint === undefined ? 1 : ((tint >> 16) & 255) / 255;
  const tg = tint === undefined ? 1 : ((tint >> 8) & 255) / 255;
  const tb = tint === undefined ? 1 : (tint & 255) / 255;
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext('2d');
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
function firstFrame(image: RgbaImage): Region {
  return { x: 0, y: 0, width: image.width, height: Math.min(image.height, image.width) };
}

/** A canvas of `size` GUI units at device resolution, redrawn when `deps` change. */
function useDrawing(
  size: number,
  draw: (context: CanvasRenderingContext2D, scale: number) => void,
  deps: readonly unknown[],
  ref: Ref<HTMLCanvasElement> | undefined,
): readonly [(node: HTMLCanvasElement | null) => void, CssVariables] {
  const { deviceScale } = useCobble();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const merged = useMergedRefs(canvasRef, ref);
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pixels = Math.max(Math.round(size * deviceScale), 1);
    canvas.width = pixels;
    canvas.height = pixels;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.imageSmoothingEnabled = false;
    draw(context, deviceScale);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `draw` only closes over `deps`
  }, [size, deviceScale, ...deps]);
  return [
    merged,
    {
      // Position variables inherit from slots and tabs; an icon is placed by its parent, not by them.
      '--cobble-x': 0,
      '--cobble-y': 0,
      '--cobble-sprite-width': size,
      '--cobble-sprite-height': size,
    } as CssVariables,
  ];
}

export interface ItemIconProps extends CanvasProps {
  /** The item's id: `diamond_sword`, `torch`, `grass_block`, … (`assets/minecraft/items/<name>.json`). */
  readonly name: string;
  /** Size in GUI units. Defaults to 16. */
  readonly size?: number;
}

/**
 * An item as the game draws it in a slot (16×16). Reads the item's own definition and model from
 * the game files: flat sprites for `item/generated` models, and elements with `display.gui`
 * rotation, scale and the GUI lighting for blocks and other 3D models (torches, stairs, fences, …).
 * Items drawn by code in the game (chests, beds, banners, shields, heads) show their base model,
 * which is empty for most of them. Without a definition, `textures/item/<name>.png` is drawn.
 */
export function ItemIcon(props: ItemIconProps): JSX.Element {
  const { name, size = ITEM_ICON_SIZE, ref, className, style, ...rest } = props;
  const { store } = useCobble();
  const revision = useAssetRevision();
  const [drawRef, drawStyle] = useDrawing(
    size,
    (context, scale) => {
      drawItem(context, store, name, (size * scale) / ITEM_ICON_SIZE);
    },
    [store, name, revision],
    ref,
  );
  return (
    <canvas
      aria-hidden
      {...rest}
      ref={drawRef}
      className={cx('cobble-sprite', className)}
      data-flow=""
      data-item={name}
      style={{ ...drawStyle, ...style }}
    />
  );
}

/** Draws an item into a 16-unit square scaled by `unit` device pixels per unit. */
function drawItem(
  context: CanvasRenderingContext2D,
  store: AssetStore,
  name: string,
  unit: number,
): void {
  const source = (path: string): unknown => store.getJson(path);
  const parts = resolveItem(name, source);
  if (!parts) {
    // No definition (or still loading): fall back to the plain item texture.
    const flat =
      parts === null && store.hasTexture(`item/${name}`)
        ? store.getTexture(`item/${name}`)
        : undefined;
    if (flat) context.drawImage(toCanvas(flat, firstFrame(flat)), 0, 0, 16 * unit, 16 * unit);
    return;
  }
  for (const part of parts) {
    const { model, tints } = part;
    if (model.layers) {
      model.layers.forEach((id, index) => {
        const texture = store.getTexture(id);
        if (!texture) return;
        context.drawImage(
          toCanvas(texture, firstFrame(texture), 1, tints[index]),
          0,
          0,
          16 * unit,
          16 * unit,
        );
      });
      continue;
    }
    for (const face of projectModel(model, tints)) {
      const texture = store.getTexture(face.texture);
      if (!texture) continue;
      const frame = firstFrame(texture);
      const k = frame.width / 16;
      const du = [face.uvTr[0] - face.uvTl[0], face.uvTr[1] - face.uvTl[1]] as const;
      const dv = [face.uvBl[0] - face.uvTl[0], face.uvBl[1] - face.uvTl[1]] as const;
      // Solve the affine map from texel space to slot space for the three known corners.
      const det = du[0] * dv[1] - du[1] * dv[0];
      if (Math.abs(det) < 1e-6) continue;
      const inverse = [dv[1] / det, -du[1] / det, -dv[0] / det, du[0] / det] as const;
      const a = (face.u[0] * inverse[0] + face.v[0] * inverse[1]) / k;
      const b = (face.u[1] * inverse[0] + face.v[1] * inverse[1]) / k;
      const c = (face.u[0] * inverse[2] + face.v[0] * inverse[3]) / k;
      const d = (face.u[1] * inverse[2] + face.v[1] * inverse[3]) / k;
      const e = face.origin[0] - (a * face.uvTl[0] + c * face.uvTl[1]) * k;
      const f = face.origin[1] - (b * face.uvTl[0] + d * face.uvTl[1]) * k;
      context.save();
      context.beginPath();
      context.moveTo(face.origin[0] * unit, face.origin[1] * unit);
      context.lineTo((face.origin[0] + face.u[0]) * unit, (face.origin[1] + face.u[1]) * unit);
      context.lineTo(
        (face.origin[0] + face.u[0] + face.v[0]) * unit,
        (face.origin[1] + face.u[1] + face.v[1]) * unit,
      );
      context.lineTo((face.origin[0] + face.v[0]) * unit, (face.origin[1] + face.v[1]) * unit);
      context.closePath();
      context.clip();
      context.setTransform(a * unit, b * unit, c * unit, d * unit, e * unit, f * unit);
      context.drawImage(toCanvas(texture, frame, face.shade, face.tint), 0, 0);
      context.restore();
    }
  }
}

export interface EffectIconProps extends CanvasProps {
  /** The effect's id: `speed` draws `textures/mob_effect/speed.png`. Typed, so a typo is a compile error. */
  readonly name: EffectId;
}

/** A mob effect icon (`textures/mob_effect/*.png`, 18×18), as drawn in the inventory and the HUD. */
export function EffectIcon(props: EffectIconProps): JSX.Element {
  const { name, ref, className, style, ...rest } = props;
  const texture = useTexture(`mob_effect/${name}`);
  const [drawRef, drawStyle] = useDrawing(
    EFFECT_ICON_SIZE,
    (context, scale) => {
      if (!texture) return;
      const target = EFFECT_ICON_SIZE * scale;
      context.drawImage(toCanvas(texture, firstFrame(texture)), 0, 0, target, target);
    },
    [texture],
    ref,
  );
  return (
    <canvas
      aria-hidden
      {...rest}
      ref={drawRef}
      className={cx('cobble-sprite', className)}
      data-flow=""
      data-effect={name}
      style={{ ...drawStyle, ...style }}
    />
  );
}

export interface PlayerHeadProps extends CanvasProps {
  /**
   * Username or UUID. The face is fetched from mc-heads.net by the browser; the local `skin` is
   * shown while it loads or if it fails.
   */
  readonly player?: string;
  /** Skin texture id, `entity/player/wide/steve` by default. Must be a 64×64 (or 64×32) skin. */
  readonly skin?: string;
  /** Size in GUI units. Defaults to 8. */
  readonly size?: number;
}

/**
 * A player's face with the hat layer over it (`PlayerFaceExtractor`). With `player` it is the
 * real face from mc-heads.net; otherwise it is cut from a skin texture.
 */
export function PlayerHead(props: PlayerHeadProps): JSX.Element {
  const {
    player,
    skin = DEFAULT_SKIN,
    size = PLAYER_HEAD_SIZE,
    ref,
    className,
    style,
    ...rest
  } = props;
  const texture = useTexture(skin);
  const [drawRef, drawStyle] = useDrawing(
    size,
    (context, scale) => {
      if (!texture) return;
      const target = size * scale;
      const face = toCanvas(texture, { x: 8, y: 8, width: 8, height: 8 });
      context.drawImage(face, 0, 0, target, target);
      // The hat layer is drawn over the face at the same size (`PlayerFaceExtractor`).
      const hat = toCanvas(texture, { x: 40, y: 8, width: 8, height: 8 });
      context.drawImage(hat, 0, 0, target, target);
    },
    [texture],
    ref,
  );
  const canvas = (
    <canvas
      aria-hidden
      {...rest}
      ref={drawRef}
      className={cx('cobble-sprite', className)}
      data-flow=""
      data-skin={skin}
      style={{ ...drawStyle, ...style }}
    />
  );
  if (player === undefined || player.trim() === '') return canvas;
  return (
    <span className="cobble-player-head" data-flow="" style={{ width: `calc(${String(size)} * var(--cobble-px))`, height: `calc(${String(size)} * var(--cobble-px))`, display: 'inline-block', position: 'relative' }}>
      {canvas}
      <PlayerAvatar
        aria-hidden
        player={player}
        render="avatar"
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0 }}
      />
    </span>
  );
}
