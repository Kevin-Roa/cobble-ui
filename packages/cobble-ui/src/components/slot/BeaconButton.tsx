import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { cx, placeAt, useClickSound } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of a beacon button (`container/beacon/button`). */
export const BEACON_BUTTON_SIZE = 22;
/** Size of the icon inside it. */
export const BEACON_ICON_SIZE = 18;

/** `effect` buttons hold a mob effect icon you supply; `confirm` and `cancel` have their own. */
export type BeaconButtonKind = 'effect' | 'confirm' | 'cancel';

/** Background sprite for a state (`BeaconScreen.BeaconButton#getSprite`). */
export function beaconButtonSprite(state: {
  readonly disabled: boolean;
  readonly selected: boolean;
  readonly highlighted: boolean;
}): SpriteId {
  if (state.disabled) return 'container/beacon/button_disabled';
  if (state.selected) return 'container/beacon/button_selected';
  if (state.highlighted) return 'container/beacon/button_highlighted';
  return 'container/beacon/button';
}

export interface BeaconButtonSlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  readonly icon?: SlotProps<'span'>;
}

export interface BeaconButtonOwnProps {
  /** The effect's icon, drawn in an 18×18 area. Only used by `effect` buttons. */
  readonly children?: ReactNode;
  readonly kind?: BeaconButtonKind;
  /** The effect currently chosen. */
  readonly selected?: boolean;
  readonly disabled?: boolean;
  /** Accessible name: the effect's name, `Confirm` or `Cancel`. */
  readonly label: string;
  /** Sound played on click, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: BeaconButtonSlotProps;
}

export type BeaconButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  BeaconButtonOwnProps
>;

/**
 * A button of the beacon screen: the 22×22 `container/beacon/button` frame, lit when
 * hovered or focused and dark when selected or disabled, with an 18×18 icon inset by 2.
 */
export function BeaconButton<E extends ElementType = 'button'>(
  props: BeaconButtonProps<E>,
): JSX.Element {
  const {
    as,
    children,
    kind = 'effect',
    selected = false,
    disabled = false,
    label,
    sound = 'ui.button.click',
    slotProps,
    className,
    style,
    ...rest
  } = props as BeaconButtonProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction(disabled);
  const clickSound = useClickSound(sound, disabled);
  const rootStyle: CssVariables = {
    '--cobble-width': BEACON_BUTTON_SIZE,
    '--cobble-height': BEACON_BUTTON_SIZE,
    ...style,
  };
  const highlighted = interaction.hovered || interaction.focused;
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-beacon-button', className),
          style: rootStyle,
          type: 'button',
          disabled,
          'aria-label': label,
          'aria-pressed': kind === 'effect' ? selected : undefined,
          ...handlers,
          onPointerDown: clickSound.onPointerDown,
          onKeyDown: clickSound.onKeyDown,
        },
        rest,
      )}
      data-selected={selected ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite={beaconButtonSprite({ disabled, selected, highlighted })}
        width={BEACON_BUTTON_SIZE}
        height={BEACON_BUTTON_SIZE}
      />
      {kind === 'effect' ? (
        children === undefined ? null : (
          <span
            {...slotProps?.icon}
            className={cx('cobble-beacon-button-icon', slotProps?.icon?.className)}
            style={placeAt(2, 2, slotProps?.icon?.style)}
          >
            {children}
          </span>
        )
      ) : (
        <Sprite
          sprite={kind === 'confirm' ? 'container/beacon/confirm' : 'container/beacon/cancel'}
          width={BEACON_ICON_SIZE}
          height={BEACON_ICON_SIZE}
          style={placeAt(2, 2)}
        />
      )}
    </Component>
  );
}
