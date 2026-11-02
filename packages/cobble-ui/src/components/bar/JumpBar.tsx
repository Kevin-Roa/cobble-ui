import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import {
  STAT_BAR_HEIGHT,
  STAT_BAR_WIDTH,
  StatBarSprites,
  statBarFill,
  type StatBarLayers,
} from './StatBar.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

const CHARGE: StatBarLayers = {
  background: ['hud/jump_bar_background'],
  progress: ['hud/jump_bar_progress'],
};
const COOLDOWN: StatBarLayers = {
  background: ['hud/jump_bar_background', 'hud/jump_bar_cooldown'],
  progress: [],
};

export interface JumpBarOwnProps {
  /** Jump charge from 0 to 1 (`PlayerRideableJumping#getJumpRidingScale`). */
  readonly progress: number;
  /** The mount is recharging: the cooldown sprite replaces the charge (`JumpableVehicleBarRenderer`). */
  readonly cooldown?: boolean;
}

export type JumpBarProps<E extends ElementType = 'div'> = PolymorphicProps<E, JumpBarOwnProps>;

/** The horse jump bar: 182×5, filled by `(int)(progress * 183)` units, or fully covered while on cooldown. */
export function JumpBar<E extends ElementType = 'div'>(props: JumpBarProps<E>): JSX.Element {
  const {
    as,
    progress,
    cooldown = false,
    className,
    style,
    ...rest
  } = props as JumpBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { tOr } = useTranslation();
  const rootStyle: CssVariables = {
    '--cobble-width': STAT_BAR_WIDTH,
    '--cobble-height': STAT_BAR_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-jump-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': tOr('cobble.bar.jump', 'Jump'),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': cooldown ? 0 : Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
      data-cooldown={cooldown ? '' : undefined}
    >
      <StatBarSprites
        layers={cooldown ? COOLDOWN : CHARGE}
        fill={cooldown ? 0 : statBarFill(progress)}
      />
    </Component>
  );
}
