import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { InventorySlot, SLOT_SIZE, type EmptySlotIcon } from './InventorySlot.tsx';

/** What a grid slot holds. */
export interface SlotGridItem {
  /** The item, drawn in the slot's 16×16 area. Supply your own. */
  readonly content: ReactNode;
  /** Stack size; drawn in the corner when above 1. */
  readonly count?: number;
  /** Accessible name of the slot, e.g. `Diamond Pickaxe`. Defaults to `Slot <n>`. */
  readonly label?: string;
}

export interface SlotGridOwnProps {
  readonly columns: number;
  readonly rows: number;
  /** The contents of each slot in reading order (left to right, then down). Missing entries are empty. */
  readonly items?: readonly (SlotGridItem | undefined)[];
  /** Placeholder icon shown in every empty slot. */
  readonly emptyIcon?: EmptySlotIcon;
  /** Called with the slot's index when it is clicked or activated. */
  readonly onSlotClick?: (index: number) => void;
  /** Accessible name of the grid, e.g. `Inventory`. */
  readonly label?: string;
}

export type SlotGridProps<E extends ElementType = 'div'> = PolymorphicProps<E, SlotGridOwnProps>;

/** Width of a grid of `columns` slots: 18 each, with no gaps (`container/slot` tiles seamlessly). */
export function slotGridWidth(columns: number): number {
  return Math.max(Math.trunc(columns), 0) * SLOT_SIZE;
}

/**
 * A rectangular grid of {@link InventorySlot}s 18 units apart, like the player inventory or a
 * chest. Slots are reached in reading order and report their index through `onSlotClick`.
 */
export function SlotGrid<E extends ElementType = 'div'>(props: SlotGridProps<E>): JSX.Element {
  const {
    as,
    columns,
    rows,
    items = [],
    emptyIcon,
    onSlotClick,
    label,
    className,
    style,
    ...rest
  } = props as SlotGridProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const total = Math.max(columns, 0) * Math.max(rows, 0);
  const rootStyle: CssVariables = {
    '--cobble-width': slotGridWidth(columns),
    '--cobble-height': Math.max(rows, 0) * SLOT_SIZE,
    '--cobble-columns': columns,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-slot-grid', className),
          style: rootStyle,
          role: 'group',
          'aria-label': label,
        },
        rest,
      )}
    >
      {Array.from({ length: total }, (_, index) => {
        const item = items[index];
        const slotProps: Record<string, unknown> = {
          'aria-label': item?.label ?? `Slot ${String(index + 1)}`,
          onClick: () => onSlotClick?.(index),
        };
        if (item?.count !== undefined) slotProps['count'] = item.count;
        if (emptyIcon !== undefined) slotProps['emptyIcon'] = emptyIcon;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- slots are identified by position
          <InventorySlot key={index} {...slotProps}>
            {item?.content}
          </InventorySlot>
        );
      })}
    </Component>
  );
}

/** Gap between the main inventory and the hotbar row (`InventoryMenu`: slots at y 84 and 142). */
export const INVENTORY_HOTBAR_GAP = 4;

export interface PlayerInventoryGridOwnProps {
  /** The 27 main inventory slots, in reading order. */
  readonly items?: readonly (SlotGridItem | undefined)[];
  /** The 9 hotbar slots, in order. */
  readonly hotbar?: readonly (SlotGridItem | undefined)[];
  /** Called with `'main'` or `'hotbar'` and the slot's index within it. */
  readonly onSlotClick?: (area: 'main' | 'hotbar', index: number) => void;
}

export type PlayerInventoryGridProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PlayerInventoryGridOwnProps
>;

/**
 * The player's inventory as every container screen shows it: three rows of nine, a 4-unit
 * gap, then the hotbar row. 162 units wide and 76 tall.
 */
export function PlayerInventoryGrid<E extends ElementType = 'div'>(
  props: PlayerInventoryGridProps<E>,
): JSX.Element {
  const { as, items, hotbar, onSlotClick, className, style, ...rest } =
    props as PlayerInventoryGridProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': slotGridWidth(9),
    '--cobble-height': 4 * SLOT_SIZE + INVENTORY_HOTBAR_GAP,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-player-inventory', className), style: rootStyle },
        rest,
      )}
    >
      <SlotGrid
        columns={9}
        rows={3}
        label="Inventory"
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('main', i) })}
      />
      <SlotGrid
        className="cobble-player-inventory-hotbar"
        columns={9}
        rows={1}
        label="Hotbar"
        {...(hotbar === undefined ? {} : { items: hotbar })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('hotbar', i) })}
      />
    </Component>
  );
}
