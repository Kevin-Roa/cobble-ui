import { useState, type ElementType, type JSX, type MouseEvent } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** `LockIconButton.Icon#LOCKED` sprites. */
export const LOCKED_SPRITES: WidgetSprites = {
  enabled: 'widget/locked_button',
  disabled: 'widget/locked_button_disabled',
  enabledFocused: 'widget/locked_button_highlighted',
};

/** `LockIconButton.Icon#UNLOCKED` sprites. */
export const UNLOCKED_SPRITES: WidgetSprites = {
  enabled: 'widget/unlocked_button',
  disabled: 'widget/unlocked_button_disabled',
  enabledFocused: 'widget/unlocked_button_highlighted',
};

export interface LockButtonOwnProps extends Omit<ButtonOwnProps, 'icon' | 'sprites' | 'children'> {
  readonly locked?: boolean;
  readonly defaultLocked?: boolean;
  readonly onLockedChange?: (locked: boolean) => void;
  /** Accessible name (the game narrates "Lock"). Defaults to `Lock`. */
  readonly label?: string;
}

export type LockButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  LockButtonOwnProps
>;

/**
 * The padlock toggle next to the difficulty button (`LockIconButton`): a 20×20
 * button whose sprite switches between locked and unlocked.
 */
export function LockButton<E extends ElementType = 'button'>(
  props: LockButtonProps<E>,
): JSX.Element {
  const {
    locked,
    defaultLocked = false,
    onLockedChange,
    label: labelProp,
    width = 20,
    height = 20,
    onClick,
    ...rest
  } = props as LockButtonProps<'button'>;
  const { tOr } = useTranslation();
  const label = labelProp ?? tOr('cobble.button.lock', 'Lock');
  const [uncontrolled, setUncontrolled] = useState(defaultLocked);
  const isLocked = locked ?? uncontrolled;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={isLocked ? LOCKED_SPRITES : UNLOCKED_SPRITES}
      aria-pressed={isLocked}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (locked === undefined) setUncontrolled(!isLocked);
        onLockedChange?.(!isLocked);
      }}
    />
  );
}
