import { Button as BaseButton } from '@base-ui/react/button';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, MouseEvent, ReactNode, Ref } from 'react';
import {
  useElementState,
  useGuiSize,
  useInteraction,
  useMergedRefs,
} from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useSpriteSize } from '../../provider/hooks.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { ScrollingText } from '../../text/ScrollingText.tsx';
import { Sprite, type SpriteProps } from '../sprite/Sprite.tsx';
import {
  BUTTON_SPRITES,
  cx,
  pickSprite,
  px,
  useClickSound,
  type WidgetSprites,
} from '../shared.ts';

/** `Button.DEFAULT_WIDTH`. */
export const BUTTON_DEFAULT_WIDTH = 150;
/** `Button.DEFAULT_HEIGHT`. */
export const BUTTON_DEFAULT_HEIGHT = 20;

export interface ButtonIcon {
  /** Sprite id, or per-state sprites. */
  readonly sprite: string | WidgetSprites;
  /** Icon width in GUI units. Defaults to the sprite's own width. */
  readonly width?: number;
  /** Icon height in GUI units. Defaults to the sprite's own height. */
  readonly height?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export type SpriteSlotProps = Partial<Omit<SpriteProps, 'sprite' | 'width' | 'height'>>;

export interface ButtonSlotProps {
  /** The canvas the button sprite is drawn on. */
  readonly background?: SpriteSlotProps;
  /** The box the label scrolls in. */
  readonly label?: SlotProps<'span'>;
  /** The canvas the icon is drawn on. */
  readonly icon?: SpriteSlotProps;
}

export interface ButtonOwnProps {
  readonly children?: ReactNode;
  /** Makes the button inactive: grey label, no interaction. */
  readonly disabled?: boolean;
  /** Width in GUI units. Defaults to 150. CSS `width` also works. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 20. */
  readonly height?: number;
  /**
   * Draws an icon after the label (`SpriteIconButton.TextAndIcon`), or
   * centred when the button has no children (`SpriteIconButton.CenteredIcon`).
   */
  readonly icon?: ButtonIcon;
  /** Replaces the button sprites (e.g. `widget/realms_button`). */
  readonly sprites?: WidgetSprites;
  /** Sound played when pressed, or `false` for none. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  /** Highlight the button as if hovered/focused, regardless of interaction. */
  readonly highlighted?: boolean;
  readonly slotProps?: ButtonSlotProps;
}

export type ButtonProps<E extends ElementType = 'button'> = PolymorphicProps<E, ButtonOwnProps>;

/** A vanilla button (`net.minecraft.client.gui.components.Button`). */
export function Button<E extends ElementType = 'button'>(props: ButtonProps<E>): JSX.Element {
  const {
    as,
    children,
    disabled = false,
    width = BUTTON_DEFAULT_WIDTH,
    height = BUTTON_DEFAULT_HEIGHT,
    icon,
    sprites = BUTTON_SPRITES,
    sound = 'ui.button.click',
    highlighted: forceHighlighted,
    slotProps,
    ref,
    className,
    style,
    onClick,
    ...rest
  } = props as ButtonProps<'button'>;
  const { unit } = useCobble();
  const [element, setElement] = useElementState<HTMLElement>();
  const measured = useGuiSize(element, unit);
  const w = measured?.width ?? width;
  const h = measured?.height ?? height;
  const [interaction, interactionHandlers] = useInteraction(disabled);
  const clickSound = useClickSound(sound, disabled);
  const highlighted = forceHighlighted ?? (interaction.hovered || interaction.focused);
  const mergedRef = useMergedRefs<HTMLElement>(setElement, ref as Ref<HTMLElement>);

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  const iconSprite =
    icon &&
    (typeof icon.sprite === 'string'
      ? icon.sprite
      : pickSprite(icon.sprite, !disabled, highlighted));
  const iconSize = useSpriteSize(iconSprite);
  const iconWidth = icon?.width ?? iconSize?.width ?? 0;
  const iconHeight = icon?.height ?? iconSize?.height ?? 0;
  const hasLabel = children !== undefined && children !== null && children !== false;
  const labelRight = icon ? w - iconWidth - 4 : w - 2;
  const iconLeft = hasLabel ? w - iconWidth - 2 : Math.trunc(w / 2) - Math.trunc(iconWidth / 2);

  const content = (
    <>
      <Sprite
        {...slotProps?.background}
        className={cx('cobble-button-background', slotProps?.background?.className)}
        sprite={pickSprite(sprites, !disabled, highlighted)}
        width={w}
        height={h}
      />
      {hasLabel ? (
        <ScrollingText
          {...slotProps?.label}
          className={cx('cobble-button-label', 'cobble-text', slotProps?.label?.className)}
          data-shadow=""
          left={2}
          right={labelRight}
          top={0}
          bottom={h}
        >
          {children}
        </ScrollingText>
      ) : null}
      {icon ? (
        <Sprite
          {...slotProps?.icon}
          className={cx('cobble-button-icon', slotProps?.icon?.className)}
          sprite={iconSprite}
          width={iconWidth}
          height={iconHeight}
          style={{
            left: px(iconLeft + (icon.offsetX ?? 0), unit),
            top: px(Math.trunc(h / 2) - Math.trunc(iconHeight / 2) + (icon.offsetY ?? 0), unit),
            ...slotProps?.icon?.style,
          }}
        />
      ) : null}
    </>
  );

  const ownProps = {
    className: cx('cobble-button', className),
    style: rootStyle,
    'data-hovered': interaction.hovered ? '' : undefined,
    'data-focused': interaction.focused ? '' : undefined,
    'data-highlighted': highlighted ? '' : undefined,
    ...interactionHandlers,
    ...clickSound,
  };

  if (as === undefined || as === 'button') {
    return (
      <BaseButton
        {...mergeProps<'button'>(ownProps, rest)}
        ref={mergedRef}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </BaseButton>
    );
  }

  const Component = as as ElementType;
  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    (onClick as ((event: MouseEvent<HTMLElement>) => void) | undefined)?.(event);
  };
  return (
    <Component
      {...mergeProps<'button'>(ownProps, rest)}
      ref={mergedRef}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? '' : undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      onClick={handleClick}
    >
      {content}
    </Component>
  );
}
