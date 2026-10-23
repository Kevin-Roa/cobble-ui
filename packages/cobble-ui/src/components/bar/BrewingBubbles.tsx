import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

export const BREW_BUBBLES_WIDTH = 12;
export const BREW_BUBBLES_HEIGHT = 29;

/** `BrewingStandScreen.BUBBLELENGTHS`: how tall the bubbles are, cycling as the brew goes on. */
const BUBBLE_LENGTHS: readonly number[] = [29, 24, 20, 16, 11, 6, 0];

/** Visible height of the bubbles at `brewTime` ticks: `BUBBLELENGTHS[brewTime / 2 % 7]`, 0 when idle. */
export function brewBubbleLength(brewTime: number): number {
  if (!(brewTime > 0)) return 0;
  return BUBBLE_LENGTHS[Math.floor(brewTime / 2) % BUBBLE_LENGTHS.length] ?? 0;
}

export interface BrewBubblesOwnProps {
  /** Ticks left in the brew. Nothing is drawn at 0. */
  readonly brewTime: number;
}

export type BrewBubblesProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  BrewBubblesOwnProps
>;

/**
 * The bubbles that rise through the brewing stand while it brews (`container/brewing_stand/bubbles`,
 * 12×29). Drive it with the remaining brew time, counting down, and it cycles through the game's
 * bubble heights.
 */
export function BrewBubbles<E extends ElementType = 'div'>(
  props: BrewBubblesProps<E>,
): JSX.Element {
  const { as, brewTime, className, style, ...rest } = props as BrewBubblesProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const length = brewBubbleLength(brewTime);
  const rootStyle: CssVariables = {
    '--cobble-width': BREW_BUBBLES_WIDTH,
    '--cobble-height': BREW_BUBBLES_HEIGHT,
    '--cobble-clip-height': length,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-brew-bubbles', className),
          style: rootStyle,
          'aria-hidden': true,
        },
        rest,
      )}
    >
      {length > 0 ? (
        <span className="cobble-bottom-clip">
          <Sprite
            sprite="container/brewing_stand/bubbles"
            width={BREW_BUBBLES_WIDTH}
            height={BREW_BUBBLES_HEIGHT}
            style={placeAt(0, length - BREW_BUBBLES_HEIGHT)}
          />
        </span>
      ) : null}
    </Component>
  );
}
