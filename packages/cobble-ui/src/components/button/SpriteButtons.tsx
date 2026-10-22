import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';

type SpriteButtonOwnProps = Omit<ButtonOwnProps, 'icon' | 'sprites' | 'children'>;

/** `widget/cross_button`: the 14×14 close button. */
export const CROSS_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'widget/cross_button',
  enabledFocused: 'widget/cross_button_highlighted',
};

export interface CrossButtonOwnProps extends SpriteButtonOwnProps {
  /** Accessible name. Defaults to `Close`. */
  readonly label?: string;
}

export type CrossButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  CrossButtonOwnProps
>;

/** The small red cross that dismisses a panel (`widget/cross_button`), 14×14. */
export function CrossButton<E extends ElementType = 'button'>(
  props: CrossButtonProps<E>,
): JSX.Element {
  const { label = 'Close', width = 14, height = 14, ...rest } = props as CrossButtonProps<'button'>;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={CROSS_BUTTON_SPRITES}
    />
  );
}

/** Which way a {@link PageButton} turns. */
export type PageDirection = 'forward' | 'backward';

/** Sprites of a page turner (`widget/page_forward`, `widget/page_backward`). */
export function pageButtonSprites(direction: PageDirection): WidgetSprites {
  return {
    enabled: `widget/page_${direction}`,
    enabledFocused: `widget/page_${direction}_highlighted`,
  };
}

export interface PageButtonOwnProps extends SpriteButtonOwnProps {
  readonly direction: PageDirection;
  /** Accessible name. Defaults to `Next Page` / `Previous Page`. */
  readonly label?: string;
}

export type PageButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  PageButtonOwnProps
>;

/** The green arrow that turns book pages (`widget/page_*`), 23×13. */
export function PageButton<E extends ElementType = 'button'>(
  props: PageButtonProps<E>,
): JSX.Element {
  const {
    direction,
    label = direction === 'forward' ? 'Next Page' : 'Previous Page',
    width = 23,
    height = 13,
    ...rest
  } = props as PageButtonProps<'button'>;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={pageButtonSprites(direction)}
    />
  );
}
