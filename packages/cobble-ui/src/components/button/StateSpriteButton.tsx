import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { useInteraction } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { cx, placeAt, useClickSound } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** The background sprite of each state of a {@link StateSpriteButton}. */
export interface StateSprites {
  readonly normal: SpriteId;
  readonly highlighted?: SpriteId;
  readonly selected?: SpriteId;
  readonly disabled?: SpriteId;
}

/** Picks the sprite for a state: disabled, then selected, then highlighted, then normal. */
export function pickStateSprite(
  sprites: StateSprites,
  state: { readonly disabled: boolean; readonly selected: boolean; readonly highlighted: boolean },
): SpriteId {
  if (state.disabled && sprites.disabled !== undefined) return sprites.disabled;
  if (state.selected && sprites.selected !== undefined) return sprites.selected;
  if (state.highlighted && sprites.highlighted !== undefined) return sprites.highlighted;
  return sprites.normal;
}

export interface StateSpriteButtonOwnProps {
  /** Content drawn over the sprite (an item, an icon). */
  readonly children?: ReactNode;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  /** Accessible name. */
  readonly label: string;
  /** Sound played on click, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: {
    readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
    readonly content?: SlotProps<'span'>;
  };
}

export type StateSpriteButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  StateSpriteButtonOwnProps
>;

/**
 * Internal: a fixed-size button drawn entirely by one sprite per state, with optional content
 * placed at `contentX`/`contentY`. The public sprite buttons are thin wrappers around it.
 */
export function StateSpriteButton<E extends ElementType = 'button'>(
  props: StateSpriteButtonProps<E> & {
    readonly sprites: StateSprites;
    readonly buttonWidth: number;
    readonly buttonHeight: number;
    readonly contentX?: number;
    readonly contentY?: number;
    readonly toggle?: boolean;
    readonly name: string;
  },
): JSX.Element {
  const {
    as,
    children,
    selected = false,
    disabled = false,
    label,
    sound = 'ui.button.click',
    slotProps,
    sprites,
    buttonWidth,
    buttonHeight,
    contentX = 0,
    contentY = 0,
    toggle = false,
    name,
    className,
    style,
    ...rest
  } = props as StateSpriteButtonProps<'button'> & {
    readonly sprites: StateSprites;
    readonly buttonWidth: number;
    readonly buttonHeight: number;
    readonly contentX?: number;
    readonly contentY?: number;
    readonly toggle?: boolean;
    readonly name: string;
  };
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction(disabled);
  const clickSound = useClickSound(sound, disabled);
  const rootStyle: CssVariables = {
    '--cobble-width': buttonWidth,
    '--cobble-height': buttonHeight,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', `cobble-${name}`, className),
          style: rootStyle,
          type: 'button',
          disabled,
          'aria-label': label,
          'aria-pressed': toggle ? selected : undefined,
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
        sprite={pickStateSprite(sprites, {
          disabled,
          selected,
          highlighted: interaction.hovered || interaction.focused,
        })}
        width={buttonWidth}
        height={buttonHeight}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.content}
          className={cx('cobble-inventory-slot-item', slotProps?.content?.className)}
          style={placeAt(contentX, contentY, slotProps?.content?.style)}
        >
          {children}
        </span>
      )}
    </Component>
  );
}
