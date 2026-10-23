import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { ExperienceBar } from '../bar/ExperienceBar.tsx';
import { cx, placeAt } from '../shared.ts';
import { Air, Armor, Hearts, Hunger, type HeartVariant } from '../status/StatusIcons.tsx';
import { Hotbar, HOTBAR_WIDTH, type HotbarOwnProps } from './Hotbar.tsx';

/** Height of the whole HUD block: the armor row's top (`h - 49`) down to the hotbar's bottom. */
export const HOTBAR_STATS_HEIGHT = 49;

export interface HotbarWithStatsOwnProps {
  /** Health in half hearts (`20` is full). */
  readonly health?: number;
  readonly maxHealth?: number;
  readonly absorption?: number;
  readonly heartVariant?: HeartVariant;
  readonly hardcore?: boolean;
  /** Food level (`20` is full). */
  readonly food?: number;
  /** The food bar is green and rotten-looking, from the Hunger effect. */
  readonly hungry?: boolean;
  /** Armor points; the row is hidden at 0, like the game. */
  readonly armor?: number;
  /** Remaining air in ticks. Shown only below `maxAir`, like the game. */
  readonly air?: number;
  readonly maxAir?: number;
  /** Progress to the next level, 0 to 1. */
  readonly experience?: number;
  readonly level?: number;
  /** Props for the hotbar: items, selection, offhand. */
  readonly hotbar?: HotbarOwnProps;
}

export type HotbarWithStatsProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  HotbarWithStatsOwnProps
>;

/**
 * The survival HUD at the bottom of the screen, laid out as `Gui#extractHotbarAndDecorations`
 * does: the hotbar, the experience bar 7 units above it, hearts and food 17 above, and armor
 * and air 27 above. 182 units wide.
 */
export function HotbarWithStats<E extends ElementType = 'div'>(
  props: HotbarWithStatsProps<E>,
): JSX.Element {
  const {
    as,
    health = 20,
    maxHealth = 20,
    absorption = 0,
    heartVariant = 'normal',
    hardcore = false,
    food = 20,
    hungry = false,
    armor = 0,
    air,
    maxAir = 300,
    experience = 0,
    level,
    hotbar,
    className,
    style,
    ...rest
  } = props as HotbarWithStatsProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': HOTBAR_WIDTH,
    '--cobble-height': HOTBAR_STATS_HEIGHT,
    ...style,
  };
  const showAir = air !== undefined && air < maxAir;
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-station-panel cobble-hotbar-with-stats', className), style: rootStyle },
        rest,
      )}
    >
      {armor > 0 ? (
        <Armor className="cobble-placed" style={placeAt(0, 0)} value={armor} />
      ) : null}
      {showAir ? (
        <Air
          className="cobble-placed"
          style={placeAt(HOTBAR_WIDTH - 81, 0)}
          value={air}
          max={maxAir}
        />
      ) : null}
      <Hearts
        className="cobble-placed"
        style={placeAt(0, 10)}
        value={health}
        max={maxHealth}
        absorption={absorption}
        variant={heartVariant}
        hardcore={hardcore}
      />
      <Hunger
        className="cobble-placed"
        style={placeAt(HOTBAR_WIDTH - 81, 10)}
        value={food}
        hunger={hungry}
      />
      <ExperienceBar
        className="cobble-placed"
        style={placeAt(0, 20)}
        progress={experience}
        {...(level === undefined ? {} : { level })}
      />
      <Hotbar {...hotbar} className="cobble-placed" style={placeAt(0, 27)} />
    </Component>
  );
}
