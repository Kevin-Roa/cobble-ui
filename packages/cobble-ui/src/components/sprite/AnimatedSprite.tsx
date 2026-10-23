import type { SpriteId } from '../../assets/sprite-id.ts';
import { useEffect, useMemo, useState, type JSX } from 'react';
import type { CssVariables, SlotProps } from '../../internal/polymorphic.ts';
import type { AnimationFrame } from '../../render/animation.ts';
import { useSpriteAnimation, useSpriteSize } from '../../provider/hooks.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from './Sprite.tsx';

/** Milliseconds per game tick, the unit of `.mcmeta` animation times. */
export const TICK_MS = 50;

export type { AnimationFrame };

/**
 * The frame sequence of an animated sprite (`SpriteContents.AnimatedTexture`): either the
 * explicit `frames` of the `.mcmeta`, or every frame of the sheet in order for `frametime` ticks.
 */
export function animationFrames(
  frameCount: number,
  frametime = 1,
  frames?: readonly AnimationFrame[],
): readonly AnimationFrame[] {
  if (frames !== undefined && frames.length > 0) return frames;
  return Array.from({ length: Math.max(frameCount, 1) }, (_, index) => ({
    index,
    time: frametime,
  }));
}

export interface AnimatedSpriteProps extends Omit<SlotProps<'span'>, 'children'> {
  /** Sprite id of the sheet: all frames stacked vertically, e.g. `realm_status/expires_soon`. */
  readonly sprite: SpriteId;
  /** Width of one frame in GUI units. Defaults to the sheet's `.mcmeta` `animation.width`. */
  readonly frameWidth?: number;
  /** Height of one frame in GUI units. Defaults to the sheet's `.mcmeta` `animation.height`. */
  readonly frameHeight?: number;
  /** Ticks per frame when `frames` is not given. Defaults to the sheet's `animation.frametime`. */
  readonly frametime?: number;
  /** Explicit frame order and times. Defaults to the sheet's `animation.frames`. */
  readonly frames?: readonly AnimationFrame[];
}

/**
 * A sprite sheet played like an `.mcmeta` animation (`SpriteContents.AnimatedTexture`). The frame
 * size and timing come from the sheet's own `animation` metadata, so passing the sprite id is
 * enough; any prop given overrides the metadata. Draws nothing until the sheet has loaded unless
 * the frame size is given.
 */
export function AnimatedSprite(props: AnimatedSpriteProps): JSX.Element {
  const { sprite, className, style, ...rest } = props;
  const {
    frameWidth: widthOverride,
    frameHeight: heightOverride,
    frametime: frametimeOverride,
    frames: framesOverride,
    ...root
  } = rest;
  const meta = useSpriteAnimation(sprite);
  const size = useSpriteSize(sprite);
  const frameWidth = widthOverride ?? meta?.frameWidth ?? size?.width ?? 0;
  const frameHeight = heightOverride ?? meta?.frameHeight ?? size?.height ?? 0;
  const frametime = frametimeOverride ?? meta?.frametime;
  const frames = framesOverride ?? meta?.frames;
  const sheetWidth = size?.width ?? frameWidth;
  const sheetHeight = size?.height ?? frameHeight;
  const frameCount = Math.max(frameHeight === 0 ? 1 : Math.floor(sheetHeight / frameHeight), 1);
  const sequence = useMemo(
    () => animationFrames(frameCount, frametime, frames),
    [frameCount, frametime, frames],
  );
  const [position, setPosition] = useState(0);
  const current = sequence[position % sequence.length] ?? sequence[0];

  useEffect(() => {
    if (sequence.length < 2) return undefined;
    let next = 0;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      timer = setTimeout(
        () => {
          next = (next + 1) % sequence.length;
          setPosition(next);
          schedule();
        },
        Math.max(sequence[next]?.time ?? 1, 1) * TICK_MS,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [sequence]);

  const rootStyle: CssVariables = {
    '--cobble-width': frameWidth,
    '--cobble-height': frameHeight,
    ...style,
  };
  return (
    <span
      aria-hidden
      {...root}
      className={cx('cobble-animated-sprite', className)}
      style={rootStyle}
      data-frame={current?.index ?? 0}
    >
      <Sprite
        sprite={sprite}
        width={sheetWidth}
        height={sheetHeight}
        style={placeAt(0, -(current?.index ?? 0) * frameHeight)}
      />
    </span>
  );
}
