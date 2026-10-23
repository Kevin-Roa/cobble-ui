import type { SpriteId } from '../../assets/sprite-id.ts';
import { useRef, type JSX } from 'react';
import { useIsomorphicLayoutEffect, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import { useComposedSprite } from '../../provider/hooks.ts';
import type { RgbaImage } from '../../render/blit.ts';

export interface SpriteProps extends Omit<SlotProps<'canvas'>, 'width' | 'height' | 'children'> {
  /** Sprite id, e.g. `widget/button` or `icon/accessibility` (`minecraft:` is implied). */
  readonly sprite: SpriteId | undefined;
  /** Width in GUI units. */
  readonly width: number;
  /** Height in GUI units. */
  readonly height: number;
}

function draw(canvas: HTMLCanvasElement, image: RgbaImage | undefined): void {
  if (!image) {
    canvas.width = 0;
    canvas.height = 0;
    return;
  }
  if (canvas.width !== image.width) canvas.width = image.width;
  if (canvas.height !== image.height) canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context || image.width === 0 || image.height === 0) return;
  context.putImageData(
    new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    0,
    0,
  );
}

/**
 * Draws a GUI sprite at an exact size, applying its nine-slice / tile /
 * stretch scaling from the game's `.mcmeta` files. Rendered at device
 * resolution so it stays pixel-exact at every GUI scale.
 */
export function Sprite(props: SpriteProps): JSX.Element {
  const { sprite, width, height, ref, className, style, ...rest } = props;
  const image = useComposedSprite(sprite, width, height);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mergedRef = useMergedRefs(canvasRef, ref);

  useIsomorphicLayoutEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, image);
  }, [image]);

  const canvasStyle: CssVariables = {
    // Position variables inherit; reset them so a sprite is never offset by its parent's.
    '--cobble-x': 0,
    '--cobble-y': 0,
    '--cobble-sprite-width': width,
    '--cobble-sprite-height': height,
    ...style,
  };
  return (
    <canvas
      aria-hidden
      {...rest}
      ref={mergedRef}
      className={className === undefined ? 'cobble-sprite' : `cobble-sprite ${className}`}
      data-sprite={sprite}
      style={canvasStyle}
    />
  );
}
