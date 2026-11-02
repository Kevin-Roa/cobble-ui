import { useTranslation } from '../../i18n/Translation.tsx';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { InventorySlot, SLOT_SIZE } from './InventorySlot.tsx';
import { SlotGrid, type SlotGridItem } from './SlotGrid.tsx';

/** Offset of the result slot from the grid's top-left: `(124 - 30, 35 - 17)` in `CraftingScreen`. */
export const CRAFTING_RESULT_OFFSET: { readonly x: number; readonly y: number } = { x: 94, y: 18 };

export interface CraftingGridOwnProps {
  /** `3` for a crafting table, `2` for the inventory's grid. */
  readonly size?: 2 | 3;
  /** The ingredient slots in reading order. */
  readonly ingredients?: readonly (SlotGridItem | undefined)[];
  /** The crafted item, or nothing while the recipe is incomplete. */
  readonly result?: SlotGridItem | undefined;
  /** Called with an ingredient slot's index. */
  readonly onIngredientClick?: (index: number) => void;
  /** Called when the result slot is clicked. */
  readonly onResultClick?: () => void;
}

export type CraftingGridProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  CraftingGridOwnProps
>;

/**
 * A crafting grid with its result slot: 3×3 (or 2×2) ingredient slots and the output slot to the
 * right, laid out like the crafting table. The arrow between them is part of the screen's
 * background texture in the game and is not drawn here. The result offset is recalled from
 * vanilla and is an approximation.
 */
export function CraftingGrid<E extends ElementType = 'div'>(
  props: CraftingGridProps<E>,
): JSX.Element {
  const {
    as,
    size = 3,
    ingredients,
    result,
    onIngredientClick,
    onResultClick,
    className,
    style,
    ...rest
  } = props as CraftingGridProps<'div'>;
  const { tOr } = useTranslation();
  const Component: ElementType = as ?? 'div';
  const gridSize = size * SLOT_SIZE;
  const resultY = Math.trunc((gridSize - SLOT_SIZE) / 2);
  const resultX = size === 3 ? CRAFTING_RESULT_OFFSET.x : 76;
  const rootStyle: CssVariables = {
    '--cobble-width': resultX + SLOT_SIZE,
    '--cobble-height': gridSize,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-crafting-grid', className), style: rootStyle },
        rest,
      )}
    >
      <SlotGrid
        columns={size}
        rows={size}
        label={tOr('container.crafting', 'Crafting')}
        {...(ingredients === undefined ? {} : { items: ingredients })}
        {...(onIngredientClick === undefined ? {} : { onSlotClick: onIngredientClick })}
      />
      <InventorySlot
        className="cobble-crafting-result"
        aria-label={result?.label ?? tOr('cobble.crafting.result', 'Crafting result')}
        style={placeAt(resultX, resultY)}
        {...(result?.count === undefined ? {} : { count: result.count })}
        {...(onResultClick === undefined ? {} : { onClick: onResultClick })}
      >
        {result?.content}
      </InventorySlot>
    </Component>
  );
}
