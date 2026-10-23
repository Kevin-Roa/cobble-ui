import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';

/** `widget/realms_button` sprites: the Realms-styled variant of the standard button. */
export const REALMS_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'widget/realms_button',
  disabled: 'widget/realms_button_disabled',
  enabledFocused: 'widget/realms_button_highlighted',
};

export type RealmsButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Omit<ButtonOwnProps, 'sprites'>
>;

/** A {@link Button} drawn with the Realms screens' button sprites. */
export function RealmsButton<E extends ElementType = 'button'>(
  props: RealmsButtonProps<E>,
): JSX.Element {
  return <Button {...(props as RealmsButtonProps<'button'>)} sprites={REALMS_BUTTON_SPRITES} />;
}
