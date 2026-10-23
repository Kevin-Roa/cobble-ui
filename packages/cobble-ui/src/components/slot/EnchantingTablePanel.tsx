import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import {
  ENCHANTMENT_SLOT_HEIGHT,
  ENCHANTMENT_SLOT_WIDTH,
  EnchantmentSlot,
  type EnchantmentOption,
} from './EnchantmentSlot.tsx';
import { InventorySlot } from './InventorySlot.tsx';
import { useContainerBackground } from './StationPanels.tsx';
import type { SlotGridItem } from './SlotGrid.tsx';

/** Where the slots sit, in the enchanting screen's own coordinates (`EnchantmentMenu`). */
export const ENCHANTING_LAYOUT: {
  readonly itemSlot: { readonly x: number; readonly y: number };
  readonly lapisSlot: { readonly x: number; readonly y: number };
  readonly optionsX: number;
  readonly optionsY: number;
} = {
  itemSlot: { x: 15, y: 47 },
  lapisSlot: { x: 35, y: 47 },
  optionsX: 60,
  optionsY: 14,
};

export interface EnchantingOption {
  /** The hint text on the row. */
  readonly clue?: ReactNode;
  /** The level cost. */
  readonly cost?: ReactNode;
  /** The option cannot be bought. */
  readonly disabled?: boolean;
  /** Accessible name, e.g. `Enchantment option 2, 2 levels`. */
  readonly label?: string;
}

export interface EnchantingTablePanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** The item to enchant. */
  readonly item?: SlotGridItem | undefined;
  /** The lapis lazuli stack. */
  readonly lapis?: SlotGridItem | undefined;
  /** The three offered enchantments; missing entries are drawn as disabled rows. */
  readonly options?: readonly (EnchantingOption | undefined)[];
  readonly onItemClick?: () => void;
  readonly onLapisClick?: () => void;
  readonly onOptionClick?: (option: EnchantmentOption) => void;
}

export type EnchantingTablePanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  EnchantingTablePanelOwnProps
>;

const OPTIONS: readonly EnchantmentOption[] = [1, 2, 3];

/**
 * The interactive part of the enchanting table screen: the item slot, the lapis slot (with its
 * placeholder icon while empty) and the three option rows, at the game's own coordinates. The
 * book is not drawn; the screen background is, unless `background` is false. The slot coordinates are recalled from vanilla
 * and are approximations.
 */
export function EnchantingTablePanel<E extends ElementType = 'div'>(
  props: EnchantingTablePanelProps<E>,
): JSX.Element {
  const {
    as,
    item,
    lapis,
    options = [],
    onItemClick,
    onLapisClick,
    onOptionClick,
    background = true,
    className,
    style,
    ...rest
  } = props as EnchantingTablePanelProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { itemSlot, lapisSlot, optionsX, optionsY } = ENCHANTING_LAYOUT;
  const container = useContainerBackground(
    'enchanting',
    optionsX + ENCHANTMENT_SLOT_WIDTH,
    optionsY + 3 * ENCHANTMENT_SLOT_HEIGHT,
    background,
  );
  const rootStyle: CssVariables = {
    '--cobble-width': container.width,
    '--cobble-height': container.height,
    ...container.style,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-enchanting-panel', className),
          style: rootStyle,
          ...container.attributes,
        },
        rest,
      )}
    >
      <InventorySlot
        className="cobble-enchanting-slot"
        aria-label={item?.label ?? 'Item to enchant'}
        style={placeAt(itemSlot.x - 1, itemSlot.y - 1)}
        {...(item?.count === undefined ? {} : { count: item.count })}
        {...(onItemClick === undefined ? {} : { onClick: onItemClick })}
      >
        {item?.content}
      </InventorySlot>
      <InventorySlot
        className="cobble-enchanting-slot"
        aria-label={lapis?.label ?? 'Lapis Lazuli'}
        emptyIcon="lapis_lazuli"
        style={placeAt(lapisSlot.x - 1, lapisSlot.y - 1)}
        {...(lapis?.count === undefined ? {} : { count: lapis.count })}
        {...(onLapisClick === undefined ? {} : { onClick: onLapisClick })}
      >
        {lapis?.content}
      </InventorySlot>
      {OPTIONS.map((option) => {
        const entry = options[option - 1];
        return (
          <EnchantmentSlot
            key={option}
            className="cobble-enchanting-slot"
            option={option}
            label={entry?.label ?? `Enchantment option ${String(option)}`}
            disabled={entry === undefined || entry.disabled === true}
            style={placeAt(optionsX, optionsY + (option - 1) * ENCHANTMENT_SLOT_HEIGHT)}
            {...(entry?.cost === undefined ? {} : { cost: entry.cost })}
            {...(onOptionClick === undefined ? {} : { onClick: () => onOptionClick(option) })}
          >
            {entry?.clue}
          </EnchantmentSlot>
        );
      })}
    </Component>
  );
}
