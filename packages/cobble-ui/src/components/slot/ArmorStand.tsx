import { useRef, type JSX } from 'react';
import { useIsomorphicLayoutEffect } from '../../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import type { RgbaImage } from '../../render/blit.ts';
import { useCobble } from '../../provider/context.ts';
import { useTexture } from '../../provider/hooks.ts';
import { cx } from '../shared.ts';

/** Width and height of an armor stand in model pixels (shoulders and arms span 14, head to base 31). */
export const ARMOR_STAND_WIDTH = 14;
export const ARMOR_STAND_HEIGHT = 31;

/** Where the smithing table screen stands its armor stand: the feet's centre (`SmithingScreen`). */
export const SMITHING_ARMOR_STAND_X = 141;
export const SMITHING_ARMOR_STAND_Y = 75;

/** One box of `ArmorStandModel`, seen from the front: x/y in model pixels from the head's neck, then its front face in the texture. */
const PARTS: readonly (readonly [
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  v: number,
])[] = [
  [-1, -7, 2, 7, 2, 2], // head stick
  [-6, 0, 12, 3, 3, 29], // shoulders
  [-7, 0, 2, 12, 26, 2], // right arm
  [5, 0, 2, 12, 34, 18], // left arm
  [-3, 3, 2, 7, 18, 2], // right body stick
  [1, 3, 2, 7, 50, 18], // left body stick
  [-4, 10, 8, 2, 2, 50], // hip
  [-2, 12, 2, 11, 10, 2], // right leg
  [0, 12, 2, 11, 42, 18], // left leg
  [-6, 23, 12, 1, 12, 44], // base plate edge
];

function drawPart(
  context: CanvasRenderingContext2D,
  image: RgbaImage,
  part: readonly number[],
  unit: number,
): void {
  const [x = 0, y = 0, w = 0, h = 0, u = 0, v = 0] = part;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const inner = canvas.getContext('2d');
  if (!inner) return;
  const data = inner.createImageData(w, h);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const source = ((v + row) * image.width + u + col) * 4;
      const target = (row * w + col) * 4;
      for (let channel = 0; channel < 4; channel++) {
        data.data[target + channel] = image.data[source + channel] ?? 0;
      }
    }
  }
  inner.putImageData(data, 0, 0);
  context.drawImage(canvas, (x + ARMOR_STAND_WIDTH / 2) * unit, (y + 7) * unit, w * unit, h * unit);
}

export interface ArmorStandProps extends Omit<
  SlotProps<'canvas'>,
  'width' | 'height' | 'children'
> {
  /** GUI units per model pixel. Defaults to 1.5, about the smithing table's preview size. */
  readonly scale?: number;
  /** Texture id of the stand. Defaults to the wooden armor stand. */
  readonly texture?: string;
}

/**
 * The armor stand the smithing table screen shows beside its slots (`SmithingScreen`), drawn flat
 * from the front out of the `ArmorStandModel` boxes. It is a stand-in for the game's 3D
 * entity renderer: no armor and no turning with the mouse.
 */
export function ArmorStand(props: ArmorStandProps): JSX.Element {
  const {
    scale = 1.5,
    texture: textureId = 'entity/armorstand/wood',
    className,
    style,
    ...rest
  } = props;
  const { deviceScale } = useCobble();
  const texture = useTexture(textureId);
  const ref = useRef<HTMLCanvasElement>(null);
  const width = ARMOR_STAND_WIDTH * scale;
  const height = ARMOR_STAND_HEIGHT * scale;
  useIsomorphicLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = Math.max(Math.round(width * deviceScale), 1);
    canvas.height = Math.max(Math.round(height * deviceScale), 1);
    const context = canvas.getContext('2d');
    if (!context || !texture) return;
    context.imageSmoothingEnabled = false;
    for (const part of PARTS) drawPart(context, texture, part, scale * deviceScale);
  }, [width, height, deviceScale, scale, texture]);
  const sizeVars: CssVariables = {
    '--cobble-sprite-width': width,
    '--cobble-sprite-height': height,
  };
  return (
    <canvas
      aria-hidden
      {...rest}
      ref={ref}
      className={cx('cobble-sprite', 'cobble-armor-stand', className)}
      style={{ ...sizeVars, ...style }}
    />
  );
}
