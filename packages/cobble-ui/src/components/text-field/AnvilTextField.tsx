import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { TextField, type TextFieldOwnProps, type TextFieldSprites } from './TextField.tsx';

/** `container/anvil/text_field` sprites (110×16, with a dimmer one while disabled). */
export const ANVIL_TEXT_FIELD_SPRITES: TextFieldSprites = {
  normal: 'container/anvil/text_field',
  disabled: 'container/anvil/text_field_disabled',
};

export type AnvilTextFieldProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  Omit<TextFieldOwnProps, 'backgroundSprites'>
>;

/**
 * The item name field of the anvil: a {@link TextField} drawn with the anvil's own 110×16 box.
 * Its sprite does not change while focused, and it dims when disabled (no item in the slot).
 * The maximum length defaults to 50 characters.
 */
export function AnvilTextField<E extends ElementType = 'div'>(
  props: AnvilTextFieldProps<E>,
): JSX.Element {
  const { width = 110, height = 16, maxLength = 50, ...rest } = props as AnvilTextFieldProps<'div'>;
  return (
    <TextField
      {...rest}
      width={width}
      height={height}
      maxLength={maxLength}
      backgroundSprites={ANVIL_TEXT_FIELD_SPRITES}
    />
  );
}
