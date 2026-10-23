import { mergeProps } from '@base-ui/react/merge-props';
import { Fragment, type ElementType, type JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { AnimatedSprite } from '../sprite/AnimatedSprite.tsx';
import { Sprite } from '../sprite/Sprite.tsx';
import { STAT_BAR_HEIGHT, STAT_BAR_WIDTH } from './StatBar.tsx';

/** Size of a waypoint dot sprite (`hud/locator_bar_dot/*`). */
export const LOCATOR_DOT_SIZE = 9;

/** Dot sprites: `default_0` is the farthest/faintest, `default_3` the nearest, plus `bowtie`. */
export type LocatorDot = 'default_0' | 'default_1' | 'default_2' | 'default_3' | 'bowtie';

/** Size of one frame of the up/down arrow sheets (`hud/locator_bar_arrow_*`, 7×10 = two 7×5 frames). */
export const LOCATOR_ARROW_WIDTH = 7;
export const LOCATOR_ARROW_HEIGHT = 5;

export interface LocatorWaypoint {
  /** Direction relative to where the player looks: -1 is the left edge of the bar, 1 the right edge. */
  readonly position: number;
  readonly dot?: LocatorDot;
  /** The waypoint is above (`up`) or below (`down`) the player's view: draws a blinking arrow by its dot. */
  readonly arrow?: 'up' | 'down';
}

/** Left edge of a dot for a `position` in `[-1, 1]`: `floor(position * 173 / 2) + 91 - 4`. */
export function locatorDotX(position: number): number {
  const clamped = Math.min(Math.max(position, -1), 1);
  return Math.floor((clamped * (STAT_BAR_WIDTH - 9)) / 2) + Math.trunc(STAT_BAR_WIDTH / 2) - 4;
}

export interface LocatorBarOwnProps {
  readonly waypoints?: readonly LocatorWaypoint[];
}

export type LocatorBarProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  LocatorBarOwnProps
>;

/**
 * The locator bar (`hud/locator_bar_background`, nine-sliced to 182×5) with
 * waypoint dots drawn over it, two units above and below the bar. The up/down arrows are
 * animated with the sheets' own timing. The dot placement formula and the arrow offsets (the
 * arrow sits directly above or below its dot) are approximations of the game's.
 */
export function LocatorBar<E extends ElementType = 'div'>(props: LocatorBarProps<E>): JSX.Element {
  const { as, waypoints = [], className, style, ...rest } = props as LocatorBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': STAT_BAR_WIDTH,
    '--cobble-height': STAT_BAR_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-stat-bar', 'cobble-locator-bar', className), style: rootStyle },
        rest,
      )}
    >
      <Sprite sprite="hud/locator_bar_background" width={STAT_BAR_WIDTH} height={STAT_BAR_HEIGHT} />
      {waypoints.map((waypoint, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- waypoints have no identity
        <Fragment key={index}>
          <Sprite
            sprite={`hud/locator_bar_dot/${waypoint.dot ?? 'default_0'}`}
            width={LOCATOR_DOT_SIZE}
            height={LOCATOR_DOT_SIZE}
            style={placeAt(locatorDotX(waypoint.position), -2)}
          />
          {waypoint.arrow === undefined ? null : (
            <AnimatedSprite
              className="cobble-locator-arrow"
              sprite={`hud/locator_bar_arrow_${waypoint.arrow}`}
              style={placeAt(
                locatorDotX(waypoint.position) + 1,
                waypoint.arrow === 'up' ? -2 - LOCATOR_ARROW_HEIGHT : -2 + LOCATOR_DOT_SIZE,
              )}
            />
          )}
        </Fragment>
      ))}
    </Component>
  );
}
