import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import {
  STAT_BAR_HEIGHT,
  STAT_BAR_WIDTH,
  StatBarSprites,
  statBarFill,
  type StatBarLayers,
} from './StatBar.tsx';

const LAYERS: StatBarLayers = {
  background: ['hud/experience_bar_background'],
  progress: ['hud/experience_bar_progress'],
};

export interface ExperienceBarSlotProps {
  /** The level number above the bar. */
  readonly level?: SlotProps<'span'>;
}

export interface ExperienceBarOwnProps {
  /** Progress to the next level, from 0 to 1 (`Player#experienceProgress`). */
  readonly progress: number;
  /** The experience level. Hidden when 0 or omitted (`Gui#extractExperienceLevel`). */
  readonly level?: number;
  readonly slotProps?: ExperienceBarSlotProps;
}

export type ExperienceBarProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ExperienceBarOwnProps
>;

/**
 * The experience bar (`Gui#extractExperienceBar`): 182×5, with the level drawn in
 * outlined green 6 units above its top edge.
 */
export function ExperienceBar<E extends ElementType = 'div'>(
  props: ExperienceBarProps<E>,
): JSX.Element {
  const { as, progress, level, slotProps, className, style, ...rest } =
    props as ExperienceBarProps<'div'>;
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
          className: cx('cobble-stat-bar', 'cobble-experience-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
    >
      <StatBarSprites layers={LAYERS} fill={statBarFill(progress)} />
      {level !== undefined && level > 0 ? (
        <span
          {...slotProps?.level}
          className={cx('cobble-experience-level', 'cobble-text', slotProps?.level?.className)}
        >
          {level}
        </span>
      ) : null}
    </Component>
  );
}
