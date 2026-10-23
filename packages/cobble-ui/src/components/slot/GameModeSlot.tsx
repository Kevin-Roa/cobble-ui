import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of a game mode switcher slot (`gamemode_switcher/slot`, `selection`). */
export const GAME_MODE_SLOT_SIZE = 26;
/** Size of the icon area, centred in the slot. */
export const GAME_MODE_ICON_SIZE = 16;

export interface GameModeSlotSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  readonly icon?: SlotProps<'span'>;
}

export interface GameModeSlotOwnProps {
  /** The mode's icon (an item image). Supply your own. */
  readonly children?: ReactNode;
  /** The slot the switcher is currently pointing at: draws the selection frame over it. */
  readonly selected?: boolean;
  /** Accessible name of the mode, e.g. `Creative Mode`. */
  readonly label: string;
  readonly slotProps?: GameModeSlotSlotProps;
}

export type GameModeSlotProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  GameModeSlotOwnProps
>;

/**
 * One slot of the F3+F4 game mode switcher (`gamemode_switcher/slot`, 26×26), with the
 * `selection` frame drawn over it while selected and the icon centred inside.
 */
export function GameModeSlot<E extends ElementType = 'button'>(
  props: GameModeSlotProps<E>,
): JSX.Element {
  const {
    as,
    children,
    selected = false,
    label,
    slotProps,
    className,
    style,
    ...rest
  } = props as GameModeSlotProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const inset = (GAME_MODE_SLOT_SIZE - GAME_MODE_ICON_SIZE) / 2;
  const rootStyle: CssVariables = {
    '--cobble-width': GAME_MODE_SLOT_SIZE,
    '--cobble-height': GAME_MODE_SLOT_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-game-mode-slot', className),
          style: rootStyle,
          type: 'button',
          role: 'radio',
          'aria-checked': selected,
          'aria-label': label,
        },
        rest,
      )}
      data-selected={selected ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite="gamemode_switcher/slot"
        width={GAME_MODE_SLOT_SIZE}
        height={GAME_MODE_SLOT_SIZE}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.icon}
          className={cx('cobble-inventory-slot-item', slotProps?.icon?.className)}
          style={placeAt(inset, inset, slotProps?.icon?.style)}
        >
          {children}
        </span>
      )}
      {selected ? (
        <Sprite
          sprite="gamemode_switcher/selection"
          width={GAME_MODE_SLOT_SIZE}
          height={GAME_MODE_SLOT_SIZE}
        />
      ) : null}
    </Component>
  );
}
