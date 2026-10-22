import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';

export interface IconButtonOwnProps extends Omit<ButtonOwnProps, 'icon' | 'children'> {
  /** Icon sprite id (e.g. `icon/language`), or per-state sprites. */
  readonly icon: string | WidgetSprites;
  /** Accessible name of the button (the game narrates it). */
  readonly label: string;
  /** Icon size in GUI units. Defaults to the sprite's own size. */
  readonly iconWidth?: number;
  readonly iconHeight?: number;
  readonly iconOffsetX?: number;
  readonly iconOffsetY?: number;
}

export type IconButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  IconButtonOwnProps
>;

/**
 * A square button with a centred icon (`SpriteIconButton.CenteredIcon`), like
 * the language and accessibility buttons on the title screen. 20×20 by default.
 */
export function IconButton<E extends ElementType = 'button'>(
  props: IconButtonProps<E>,
): JSX.Element {
  const {
    icon,
    label,
    iconWidth,
    iconHeight,
    iconOffsetX,
    iconOffsetY,
    width = 20,
    height = 20,
    ...rest
  } = props as IconButtonProps<'button'>;
  const iconProps: Record<string, unknown> = { sprite: icon };
  if (iconWidth !== undefined) iconProps['width'] = iconWidth;
  if (iconHeight !== undefined) iconProps['height'] = iconHeight;
  if (iconOffsetX !== undefined) iconProps['offsetX'] = iconOffsetX;
  if (iconOffsetY !== undefined) iconProps['offsetY'] = iconOffsetY;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      icon={iconProps as unknown as NonNullable<ButtonOwnProps['icon']>}
    />
  );
}
