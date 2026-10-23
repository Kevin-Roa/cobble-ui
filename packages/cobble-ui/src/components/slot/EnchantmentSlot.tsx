import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { cx, placeAt, useClickSound } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

export const ENCHANTMENT_SLOT_WIDTH = 108;
export const ENCHANTMENT_SLOT_HEIGHT = 19;
export const ENCHANTMENT_LEVEL_SIZE = 16;

/** Which of the three option rows this is; it picks the level icon. */
export type EnchantmentOption = 1 | 2 | 3;

/** Row sprite (`container/enchanting_table/enchantment_slot*`). */
export function enchantmentSlotSprite(disabled: boolean, highlighted: boolean): SpriteId {
  if (disabled) return 'container/enchanting_table/enchantment_slot_disabled';
  return highlighted
    ? 'container/enchanting_table/enchantment_slot_highlighted'
    : 'container/enchanting_table/enchantment_slot';
}

/** The level icon: lit when the option can be bought, dim when not (`level_N`, `level_N_disabled`). */
export function enchantmentLevelSprite(option: EnchantmentOption, disabled: boolean): SpriteId {
  return disabled
    ? `container/enchanting_table/level_${option}_disabled`
    : `container/enchanting_table/level_${option}`;
}

export interface EnchantmentSlotSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  readonly clue?: SlotProps<'span'>;
  readonly cost?: SlotProps<'span'>;
}

export interface EnchantmentSlotOwnProps {
  /** The hint text on the row (the game prints it in the Standard Galactic Alphabet). */
  readonly children?: ReactNode;
  /** The row number, 1 to 3: picks the level icon. */
  readonly option: EnchantmentOption;
  /** The level cost, drawn at the right end of the row. */
  readonly cost?: ReactNode;
  /** The option cannot be bought: dim row, dim icon, no interaction. */
  readonly disabled?: boolean;
  /** Accessible name, e.g. `Enchantment option 2, 2 levels`. */
  readonly label: string;
  /** Sound played on click, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: EnchantmentSlotSlotProps;
}

export type EnchantmentSlotProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  EnchantmentSlotOwnProps
>;

/**
 * One option row of the enchanting table: the 108×19 row with its level icon at the left. The
 * hint text and cost positions and colors are approximations of the game's.
 */
export function EnchantmentSlot<E extends ElementType = 'button'>(
  props: EnchantmentSlotProps<E>,
): JSX.Element {
  const {
    as,
    children,
    option,
    cost,
    disabled = false,
    label,
    sound = 'ui.button.click',
    slotProps,
    className,
    style,
    ...rest
  } = props as EnchantmentSlotProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction(disabled);
  const clickSound = useClickSound(sound, disabled);
  const rootStyle: CssVariables = {
    '--cobble-width': ENCHANTMENT_SLOT_WIDTH,
    '--cobble-height': ENCHANTMENT_SLOT_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-enchantment-slot', className),
          style: rootStyle,
          type: 'button',
          disabled,
          'aria-label': label,
          ...handlers,
          onPointerDown: clickSound.onPointerDown,
          onKeyDown: clickSound.onKeyDown,
        },
        rest,
      )}
    >
      <Sprite
        {...slotProps?.background}
        sprite={enchantmentSlotSprite(disabled, interaction.hovered || interaction.focused)}
        width={ENCHANTMENT_SLOT_WIDTH}
        height={ENCHANTMENT_SLOT_HEIGHT}
      />
      <Sprite
        sprite={enchantmentLevelSprite(option, disabled)}
        width={ENCHANTMENT_LEVEL_SIZE}
        height={ENCHANTMENT_LEVEL_SIZE}
        style={placeAt(1, 1)}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.clue}
          className={cx('cobble-enchantment-clue', 'cobble-text', slotProps?.clue?.className)}
          style={placeAt(20, 2, slotProps?.clue?.style)}
        >
          {children}
        </span>
      )}
      {cost === undefined ? null : (
        <span
          {...slotProps?.cost}
          className={cx('cobble-enchantment-cost', 'cobble-text', slotProps?.cost?.className)}
          data-shadow=""
        >
          {cost}
        </span>
      )}
    </Component>
  );
}
