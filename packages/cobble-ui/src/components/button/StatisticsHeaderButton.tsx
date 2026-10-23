import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { useInteraction } from '../../internal/hooks.ts';
import { cx, useClickSound } from '../shared.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of the statistics header sprites. */
export const STATISTICS_HEADER_SIZE = 18;

/** What a statistics column counts (`statistics/*`). */
export type StatisticsColumn =
  | 'block_mined'
  | 'item_broken'
  | 'item_crafted'
  | 'item_dropped'
  | 'item_picked_up'
  | 'item_used';

/** Sort direction currently applied to the column, shown with an arrow. */
export type StatisticsSort = 'ascending' | 'descending';

/** Sprites drawn over each other: the header frame, the column icon, then the sort arrow. */
export function statisticsHeaderLayers(
  column: StatisticsColumn,
  sort: StatisticsSort | undefined,
): readonly SpriteId[] {
  const layers: SpriteId[] = ['statistics/header', `statistics/${column}`];
  if (sort !== undefined)
    layers.push(sort === 'ascending' ? 'statistics/sort_up' : 'statistics/sort_down');
  return layers;
}

export interface StatisticsHeaderButtonOwnProps {
  readonly column: StatisticsColumn;
  readonly sort?: StatisticsSort;
  /** Accessible name, e.g. `Blocks Mined`. */
  readonly label: string;
  /** Sound played on click, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
}

export type StatisticsHeaderButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  StatisticsHeaderButtonOwnProps
>;

/**
 * A column header of the item statistics table: the 18×18 `statistics/header` frame with the
 * column's icon, and an arrow when the table is sorted by it. The arrow is drawn over the
 * icon at the same position, which is an approximation of the game's placement.
 */
export function StatisticsHeaderButton<E extends ElementType = 'button'>(
  props: StatisticsHeaderButtonProps<E>,
): JSX.Element {
  const {
    as,
    column,
    sort,
    label,
    sound = 'ui.button.click',
    className,
    style,
    ...rest
  } = props as StatisticsHeaderButtonProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction();
  const clickSound = useClickSound(sound, false);
  const rootStyle: CssVariables = {
    '--cobble-width': STATISTICS_HEADER_SIZE,
    '--cobble-height': STATISTICS_HEADER_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-statistics-header', className),
          style: rootStyle,
          type: 'button',
          'aria-label': label,
          ...handlers,
          onPointerDown: clickSound.onPointerDown,
          onKeyDown: clickSound.onKeyDown,
        },
        rest,
      )}
      data-sort={sort}
      data-highlighted={interaction.hovered || interaction.focused ? '' : undefined}
    >
      {statisticsHeaderLayers(column, sort).map((sprite) => (
        <Sprite
          key={sprite}
          sprite={sprite}
          width={STATISTICS_HEADER_SIZE}
          height={STATISTICS_HEADER_SIZE}
        />
      ))}
    </Component>
  );
}
