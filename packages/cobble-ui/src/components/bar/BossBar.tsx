import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import {
  STAT_BAR_HEIGHT,
  STAT_BAR_WIDTH,
  StatBarSprites,
  statBarFill,
  type StatBarLayers,
} from './StatBar.tsx';

/** `BossEvent.BossBarColor`. */
export type BossBarColor = 'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'white';
/** `BossEvent.BossBarOverlay`. */
export type BossBarOverlay = 'progress' | 'notched_6' | 'notched_10' | 'notched_12' | 'notched_20';

/** Sprites of a boss bar (`BossHealthOverlay#extractBar`): the colored bar, then the notch overlay. */
export function bossBarLayers(color: BossBarColor, overlay: BossBarOverlay): StatBarLayers {
  const background = [`boss_bar/${color}_background`];
  const progress = [`boss_bar/${color}_progress`];
  if (overlay !== 'progress') {
    background.push(`boss_bar/${overlay}_background`);
    progress.push(`boss_bar/${overlay}_progress`);
  }
  return { background, progress };
}

export interface BossBarSlotProps {
  /** The name above the bar. */
  readonly name?: SlotProps<'span'>;
}

export interface BossBarOwnProps {
  /** The boss's name, drawn centred above the bar. */
  readonly children?: ReactNode;
  /** Health from 0 to 1. */
  readonly progress: number;
  readonly color?: BossBarColor;
  readonly overlay?: BossBarOverlay;
  readonly slotProps?: BossBarSlotProps;
}

export type BossBarProps<E extends ElementType = 'div'> = PolymorphicProps<E, BossBarOwnProps>;

/**
 * A boss health bar (`BossHealthOverlay`): 182×5, with the name drawn one line
 * above it. Position it yourself; in the game it is centred at the top of the screen.
 */
export function BossBar<E extends ElementType = 'div'>(props: BossBarProps<E>): JSX.Element {
  const {
    as,
    children,
    progress,
    color = 'pink',
    overlay = 'progress',
    slotProps,
    className,
    style,
    ...rest
  } = props as BossBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': STAT_BAR_WIDTH,
    '--cobble-height': STAT_BAR_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-boss-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
      data-color={color}
      data-overlay={overlay}
    >
      <StatBarSprites layers={bossBarLayers(color, overlay)} fill={statBarFill(progress)} />
      {children === undefined ? null : (
        <span
          {...slotProps?.name}
          className={cx('cobble-boss-bar-name', 'cobble-text', slotProps?.name?.className)}
          data-shadow=""
        >
          {children}
        </span>
      )}
    </Component>
  );
}
