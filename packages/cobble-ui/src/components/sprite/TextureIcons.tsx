import type { EffectId } from '../../assets/effect-ids.ts';
import { useRef, type JSX, type Ref } from 'react';
import { useIsomorphicLayoutEffect, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import type { RgbaImage } from '../../render/blit.ts';
import { useCobble } from '../../provider/context.ts';
import type { AssetStore } from '../../assets/store.ts';
import { drawItem, firstFrame, tintedCanvas, type Region } from '../../render/item-raster.ts';
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

const createDomCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/** Copies a region of a decoded texture onto a canvas, optionally darkening it. */
function toCanvas(image: RgbaImage, region: Region, shade = 1, tint?: number): HTMLCanvasElement {
  return tintedCanvas(image, region, shade, tint, createDomCanvas) as HTMLCanvasElement;
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
      const unit = (size * scale) / ITEM_ICON_SIZE;
      if (store.items.supported) {
        // Resolved, decoded and rasterized in the item worker; blank until the bitmap arrives.
        const bitmap = store.items.get(name, unit);
        if (bitmap) context.drawImage(bitmap, 0, 0, 16 * unit, 16 * unit);
        return;
      }
      drawItemOnMainThread(context, store, name, unit);
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

/** Draws an item on the main thread; the fallback when no worker is available. */
function drawItemOnMainThread(
  context: CanvasRenderingContext2D,
  store: AssetStore,
  name: string,
  unit: number,
): void {
  drawItem(
    context,
    {
      json: (path) => store.getJson(path),
      texture: (id) => store.getTexture(id),
      hasTexture: (id) => store.hasTexture(id),
      createCanvas: createDomCanvas,
    },
    name,
    unit,
  );
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
    <span
      className="cobble-player-head"
      data-flow=""
      style={{
        width: `calc(${String(size)} * var(--cobble-px))`,
        height: `calc(${String(size)} * var(--cobble-px))`,
        display: 'inline-block',
        position: 'relative',
      }}
    >
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
