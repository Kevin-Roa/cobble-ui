import { mergeProps } from '@base-ui/react/merge-props';
import {
  useState,
  type ElementType,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type WheelEvent,
} from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `Inventory.SELECTION_HOTBAR_SIZE`. */
export const HOTBAR_SLOTS = 9;
/** Width of the `hud/hotbar` sprite. */
export const HOTBAR_WIDTH = 182;
/** Height of the `hud/hotbar` sprite. */
export const HOTBAR_HEIGHT = 22;
/** Width of the `hud/hotbar_selection` sprite. */
export const HOTBAR_SELECTION_SIZE = 24;
/** Height of the `hud/hotbar_selection` sprite (24×23). */
export const HOTBAR_SELECTION_HEIGHT = 23;
/** Size of the `hud/hotbar_offhand_*` sprites. */
export const HOTBAR_OFFHAND_WIDTH = 29;
export const HOTBAR_OFFHAND_HEIGHT = 24;
/** Distance between slot origins. */
export const HOTBAR_SLOT_STRIDE = 20;
/** Size of the item area of a slot. */
export const HOTBAR_ITEM_SIZE = 16;

/** `Inventory#setSelectedSlot` after `swapPaint`: moves by the sign of `delta` and wraps. */
export function scrollHotbar(
  selected: number,
  delta: number,
  slots: number = HOTBAR_SLOTS,
): number {
  const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  return (((selected - direction) % slots) + slots) % slots;
}

export interface HotbarSlotProps {
  /** One slot's 16×16 item area. */
  readonly slot?: SlotProps<'button'>;
  /** The selection frame. */
  readonly selection?: SlotProps<'canvas'>;
}

/** The offhand slot drawn beside the hotbar (`Gui#extractItemHotbar`). */
export interface HotbarOffhand {
  /** Which side of the hotbar it sits on; the game puts it opposite the main hand. */
  readonly side: 'left' | 'right';
  /** The item, drawn in the 16×16 area. */
  readonly content?: ReactNode;
}

export interface HotbarOwnProps {
  /** Draws the offhand slot beside the bar, outside its 182-unit box. */
  readonly offhand?: HotbarOffhand;
  /** Contents of each slot (up to 9), drawn in the 16×16 item area. */
  readonly slots?: readonly ReactNode[];
  readonly selected?: number;
  readonly defaultSelected?: number;
  readonly onSelectedChange?: (selected: number) => void;
  /** Change the selection with the mouse wheel, like the game. Off by default so page scrolling is untouched. */
  readonly wheel?: boolean;
  readonly slotProps?: HotbarSlotProps;
}

export type HotbarProps<E extends ElementType = 'div'> = PolymorphicProps<E, HotbarOwnProps>;

/**
 * The item hotbar (`Gui#extractItemHotbar`): the 182×22 bar, with a 24×24
 * selection frame. Slot `i` has its item at `(3 + 20i, 3)`. Number keys 1–9 and
 * the arrow keys select a slot.
 */
export function Hotbar<E extends ElementType = 'div'>(props: HotbarProps<E>): JSX.Element {
  const {
    as,
    slots = [],
    selected,
    defaultSelected = 0,
    onSelectedChange,
    wheel = false,
    offhand,
    slotProps,
    className,
    style,
    ...rest
  } = props as HotbarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const [uncontrolled, setUncontrolled] = useState(defaultSelected);
  const current = Math.min(Math.max(selected ?? uncontrolled, 0), HOTBAR_SLOTS - 1);

  const select = (next: number): void => {
    if (selected === undefined) setUncontrolled(next);
    if (next !== current) onSelectedChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next: number | undefined;
    if (event.key >= '1' && event.key <= '9') next = Number(event.key) - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = (current + 1) % HOTBAR_SLOTS;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (current + HOTBAR_SLOTS - 1) % HOTBAR_SLOTS;
    if (next === undefined) return;
    if (event.key.startsWith('Arrow')) event.preventDefault();
    select(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  const onWheel = (event: WheelEvent): void => {
    if (wheel) select(scrollHotbar(current, event.deltaY === 0 ? -event.deltaX : -event.deltaY));
  };

  const rootStyle: CssVariables = {
    '--cobble-width': HOTBAR_WIDTH,
    '--cobble-height': HOTBAR_HEIGHT,
    ...style,
  };

  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-hotbar', className),
          style: rootStyle,
          role: 'radiogroup',
          'aria-label': 'Hotbar',
          onKeyDown,
          onWheel,
        },
        rest,
      )}
    >
      <Sprite sprite="hud/hotbar" width={HOTBAR_WIDTH} height={HOTBAR_HEIGHT} />
      <Sprite
        {...slotProps?.selection}
        className={cx('cobble-hotbar-selection', slotProps?.selection?.className)}
        sprite="hud/hotbar_selection"
        width={HOTBAR_SELECTION_SIZE}
        height={HOTBAR_SELECTION_HEIGHT}
        style={placeAt(current * HOTBAR_SLOT_STRIDE - 1, -1, slotProps?.selection?.style)}
      />
      {offhand === undefined ? null : (
        <>
          <Sprite
            sprite={`hud/hotbar_offhand_${offhand.side}`}
            width={HOTBAR_OFFHAND_WIDTH}
            height={HOTBAR_OFFHAND_HEIGHT}
            style={placeAt(offhand.side === 'left' ? -HOTBAR_OFFHAND_WIDTH : HOTBAR_WIDTH, -1)}
          />
          <span
            className="cobble-hotbar-slot cobble-hotbar-offhand"
            style={placeAt(offhand.side === 'left' ? -26 : HOTBAR_WIDTH + 10, 3)}
          >
            {offhand.content}
          </span>
        </>
      )}
      {Array.from({ length: HOTBAR_SLOTS }, (_, index) => (
        <button
          key={index}
          type="button"
          {...slotProps?.slot}
          className={cx('cobble-hotbar-slot', slotProps?.slot?.className)}
          role="radio"
          aria-checked={index === current}
          aria-label={`Slot ${String(index + 1)}`}
          tabIndex={index === current ? 0 : -1}
          data-selected={index === current ? '' : undefined}
          onClick={(event) => {
            slotProps?.slot?.onClick?.(event);
            select(index);
          }}
          style={placeAt(3 + index * HOTBAR_SLOT_STRIDE, 3, slotProps?.slot?.style)}
        >
          {slots[index]}
        </button>
      ))}
    </Component>
  );
}
