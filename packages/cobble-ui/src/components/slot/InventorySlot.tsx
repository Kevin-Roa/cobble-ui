import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import { useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of the `container/slot` sprite. */
export const SLOT_SIZE = 18;
/** Size of the item area inside a slot. */
export const SLOT_ITEM_SIZE = 16;
/** Size of the `container/slot_highlight_*` sprites, drawn 4 units outside the item area. */
export const SLOT_HIGHLIGHT_SIZE = 24;

/** Placeholder icons of empty equipment and ingredient slots (`container/slot/*`). */
export type EmptySlotIcon =
  | 'amethyst_shard'
  | 'axe'
  | 'banner'
  | 'banner_pattern'
  | 'boots'
  | 'brewing_fuel'
  | 'chestplate'
  | 'diamond'
  | 'dye'
  | 'emerald'
  | 'helmet'
  | 'hoe'
  | 'horse_armor'
  | 'ingot'
  | 'lapis_lazuli'
  | 'leggings'
  | 'llama_armor'
  | 'nautilus_armor'
  | 'nautilus_armor_inventory'
  | 'pickaxe'
  | 'potion'
  | 'quartz'
  | 'redstone_dust'
  | 'saddle'
  | 'shield'
  | 'shovel'
  | 'smithing_template_armor_trim'
  | 'smithing_template_netherite_upgrade'
  | 'spear'
  | 'sword';

export interface InventorySlotSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  /** The 16×16 area holding the item. */
  readonly item?: SlotProps<'span'>;
}

export interface InventorySlotOwnProps {
  /** The item, drawn in the 16×16 area. Item textures are not GUI assets, so supply your own. */
  readonly children?: ReactNode;
  /** Stack size. Drawn in the corner like vanilla when above 1. */
  readonly count?: number;
  /** Icon shown while the slot is empty, like the armor slots' silhouettes. */
  readonly emptyIcon?: EmptySlotIcon;
  readonly disabled?: boolean;
  /**
   * Draw no slot sprite, only the item and the hover highlight. For slots that sit on artwork
   * which already has the slot drawn (a container screen's background).
   */
  readonly bare?: boolean;
  readonly slotProps?: InventorySlotSlotProps;
}

export type InventorySlotProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  InventorySlotOwnProps
>;

/** The slot highlight frame (`container/slot_highlight_back` or `_front`), 3 units outside the slot. */
function SlotHighlight(props: { readonly kind: 'back' | 'front' }): JSX.Element {
  return (
    <Sprite
      sprite={`container/slot_highlight_${props.kind}`}
      width={SLOT_HIGHLIGHT_SIZE}
      height={SLOT_HIGHLIGHT_SIZE}
      style={placeAt(-3, -3)}
    />
  );
}

/**
 * One inventory slot (`container/slot`, 18×18) with the item area inset by one unit.
 * Hovering or focusing it draws the highlight frame behind the item and the
 * translucent highlight over it (`AbstractContainerScreen#extractSlotHighlightBack/Front`).
 */
export function InventorySlot<E extends ElementType = 'button'>(
  props: InventorySlotProps<E>,
): JSX.Element {
  const {
    as,
    children,
    emptyIcon,
    count,
    disabled = false,
    bare = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as InventorySlotProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction(disabled);
  const highlighted = interaction.hovered || interaction.focused;
  const empty = children === undefined || children === null || children === false;
  const rootStyle: CssVariables = {
    '--cobble-width': SLOT_SIZE,
    '--cobble-height': SLOT_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', className),
          style: rootStyle,
          type: 'button',
          disabled,
          ...handlers,
        },
        rest,
      )}
      data-highlighted={highlighted ? '' : undefined}
      data-empty={empty ? '' : undefined}
      data-bare={bare ? '' : undefined}
    >
      {bare ? null : (
        <Sprite
          {...slotProps?.background}
          sprite="container/slot"
          width={SLOT_SIZE}
          height={SLOT_SIZE}
        />
      )}
      {highlighted ? <SlotHighlight kind="back" /> : null}
      {empty && emptyIcon !== undefined ? (
        <Sprite
          sprite={`container/slot/${emptyIcon}`}
          width={SLOT_ITEM_SIZE}
          height={SLOT_ITEM_SIZE}
          style={placeAt(1, 1)}
        />
      ) : null}
      {empty ? null : (
        <span
          {...slotProps?.item}
          className={cx('cobble-inventory-slot-item', slotProps?.item?.className)}
          style={placeAt(1, 1, slotProps?.item?.style)}
        >
          {children}
        </span>
      )}
      {!empty && count !== undefined && count > 1 ? (
        <span className="cobble-inventory-slot-count cobble-text" data-shadow="">
          {count}
        </span>
      ) : null}
      {highlighted ? <SlotHighlight kind="front" /> : null}
    </Component>
  );
}
