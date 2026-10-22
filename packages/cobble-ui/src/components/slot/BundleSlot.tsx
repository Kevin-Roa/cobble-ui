import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import { useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of a bundle tooltip slot (`container/bundle/slot_background`). */
export const BUNDLE_SLOT_SIZE = 24;
/** Inset of the 16×16 item area inside the slot (the nine-slice border). */
export const BUNDLE_SLOT_INSET = 4;

export interface BundleSlotSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  /** The 16×16 area holding the item. */
  readonly item?: SlotProps<'span'>;
}

export interface BundleSlotOwnProps {
  /** The item, drawn in the 16×16 area. Item textures are not GUI assets, so supply your own. */
  readonly children?: ReactNode;
  /** Draw the highlight frames, as for the slot the pointer is over. Hover and focus also draw them. */
  readonly highlighted?: boolean;
  readonly slotProps?: BundleSlotSlotProps;
}

export type BundleSlotProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  BundleSlotOwnProps
>;

/** The highlight frame (`container/bundle/slot_highlight_back` or `_front`), covering the whole slot. */
function BundleHighlight(props: { readonly kind: 'back' | 'front' }): JSX.Element {
  return (
    <Sprite
      sprite={`container/bundle/slot_highlight_${props.kind}`}
      width={BUNDLE_SLOT_SIZE}
      height={BUNDLE_SLOT_SIZE}
    />
  );
}

/**
 * A slot of the bundle contents grid: a 24×24 nine-sliced background with the item inset
 * by 4 units. Like {@link InventorySlot} it draws a highlight behind and in front of the
 * item, but at the slot's own size; the highlight placement is an approximation of the game's.
 */
export function BundleSlot<E extends ElementType = 'div'>(props: BundleSlotProps<E>): JSX.Element {
  const {
    as,
    children,
    highlighted: forced = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as BundleSlotProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const [interaction, handlers] = useInteraction();
  const highlighted = forced || interaction.hovered || interaction.focused;
  const rootStyle: CssVariables = {
    '--cobble-width': BUNDLE_SLOT_SIZE,
    '--cobble-height': BUNDLE_SLOT_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-bundle-slot', className),
          style: rootStyle,
          ...handlers,
        },
        rest,
      )}
      data-highlighted={highlighted ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite="container/bundle/slot_background"
        width={BUNDLE_SLOT_SIZE}
        height={BUNDLE_SLOT_SIZE}
      />
      {highlighted ? <BundleHighlight kind="back" /> : null}
      {children === undefined || children === null || children === false ? null : (
        <span
          {...slotProps?.item}
          className={cx('cobble-inventory-slot-item', slotProps?.item?.className)}
          style={placeAt(BUNDLE_SLOT_INSET, BUNDLE_SLOT_INSET, slotProps?.item?.style)}
        >
          {children}
        </span>
      )}
      {highlighted ? <BundleHighlight kind="front" /> : null}
    </Component>
  );
}
