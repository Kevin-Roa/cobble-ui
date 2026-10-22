import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';

/** `RecipeBookComponent.RECIPE_BUTTON_SPRITES`. */
export const RECIPE_BOOK_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'recipe_book/button',
  enabledFocused: 'recipe_book/button_highlighted',
};

export interface RecipeBookButtonOwnProps extends Omit<
  ButtonOwnProps,
  'icon' | 'sprites' | 'children'
> {
  /** Accessible name. Defaults to `Recipe Book`. */
  readonly label?: string;
}

export type RecipeBookButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  RecipeBookButtonOwnProps
>;

/** The book icon button on crafting screens (`ImageButton` with the `recipe_book/button` sprites), 20×18. */
export function RecipeBookButton<E extends ElementType = 'button'>(
  props: RecipeBookButtonProps<E>,
): JSX.Element {
  const {
    label = 'Recipe Book',
    width = 20,
    height = 18,
    ...rest
  } = props as RecipeBookButtonProps<'button'>;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={RECIPE_BOOK_BUTTON_SPRITES}
    />
  );
}
