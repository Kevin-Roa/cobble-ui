import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Width of a creative inventory tab sprite. */
export const CREATIVE_TAB_WIDTH = 26;
/** Height of a creative inventory tab sprite. */
export const CREATIVE_TAB_HEIGHT = 32;

export type CreativeTabRow = 'top' | 'bottom';
/** The seven columns of a row; each has its own sprite. */
export type CreativeTabColumn = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Sprite id: `container/creative_inventory/tab_<row>_<selected|unselected>_<column>`, column 1–7. */
export function creativeTabSprite(
  row: CreativeTabRow,
  column: CreativeTabColumn,
  selected: boolean,
): SpriteId {
  return `container/creative_inventory/tab_${row}_${selected ? 'selected' : 'unselected'}_${column}`;
}

export interface CreativeTabSlotProps {
  readonly sprite?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  /** The 16×16 icon area. */
  readonly icon?: SlotProps<'span'>;
}

export interface CreativeTabOwnProps {
  /** The tab icon. Supply your own item image. */
  readonly children?: ReactNode;
  /** `top` tabs hang above the window, `bottom` tabs below it. */
  readonly row?: CreativeTabRow;
  /** Position within the row, 1 (leftmost) to 7: the sprite differs for each. */
  readonly column?: CreativeTabColumn;
  readonly selected?: boolean;
  /** Accessible name of the tab. */
  readonly label: string;
  readonly slotProps?: CreativeTabSlotProps;
}

export type CreativeTabProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  CreativeTabOwnProps
>;

/**
 * A creative inventory tab (`CreativeModeInventoryScreen`): 26×32, with a different
 * sprite for each of the 7 columns of the top and bottom rows. The icon offset is an
 * approximation of the game's placement.
 */
export function CreativeTab<E extends ElementType = 'button'>(
  props: CreativeTabProps<E>,
): JSX.Element {
  const {
    as,
    children,
    row = 'top',
    column = 1,
    selected = false,
    label,
    slotProps,
    className,
    style,
    ...rest
  } = props as CreativeTabProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const rootStyle: CssVariables = {
    '--cobble-width': CREATIVE_TAB_WIDTH,
    '--cobble-height': CREATIVE_TAB_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-advancement-tab', 'cobble-creative-tab', className),
          style: rootStyle,
          type: 'button',
          'aria-pressed': selected,
          'aria-label': label,
        },
        rest,
      )}
      data-row={row}
      data-selected={selected ? '' : undefined}
    >
      <Sprite
        {...slotProps?.sprite}
        sprite={creativeTabSprite(row, column, selected)}
        width={CREATIVE_TAB_WIDTH}
        height={CREATIVE_TAB_HEIGHT}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.icon}
          className={cx('cobble-advancement-icon', slotProps?.icon?.className)}
          style={placeAt(5, row === 'top' ? 9 : 7, slotProps?.icon?.style)}
        >
          {children}
        </span>
      )}
    </Component>
  );
}
