import type { ElementType, JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';

type SpriteButtonOwnProps = Omit<ButtonOwnProps, 'icon' | 'sprites' | 'children'>;

/** An action in the player list's context buttons (`player_list/*`). */
export type PlayerAction = 'make_operator' | 'remove_operator' | 'remove_player';

const PLAYER_ACTION_LABELS: Record<PlayerAction, string> = {
  make_operator: 'Make operator',
  remove_operator: 'Remove operator',
  remove_player: 'Remove player',
};

const PLAYER_ACTION_SPRITES: Record<PlayerAction, SpriteId> = {
  make_operator: 'player_list/make_operator',
  remove_operator: 'player_list/remove_operator',
  remove_player: 'player_list/remove_player',
};

export interface PlayerActionButtonOwnProps extends SpriteButtonOwnProps {
  readonly action: PlayerAction;
  /** Accessible name. Defaults to the action's name. */
  readonly label?: string;
}

export type PlayerActionButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  PlayerActionButtonOwnProps
>;

/**
 * The tiny 8×7 icon buttons beside a player in the player list: make or remove an operator,
 * or remove the player. They have a single sprite each, so there is no highlighted variant.
 */
export function PlayerActionButton<E extends ElementType = 'button'>(
  props: PlayerActionButtonProps<E>,
): JSX.Element {
  const {
    action,
    label = PLAYER_ACTION_LABELS[action],
    width = 8,
    height = 7,
    ...rest
  } = props as PlayerActionButtonProps<'button'>;
  const sprites: WidgetSprites = { enabled: PLAYER_ACTION_SPRITES[action] };
  return <Button aria-label={label} {...rest} width={width} height={height} sprites={sprites} />;
}

/** `dialog/warning_button` sprites. */
export const WARNING_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'dialog/warning_button',
  disabled: 'dialog/warning_button_disabled',
  enabledFocused: 'dialog/warning_button_highlighted',
};

export interface WarningButtonOwnProps extends SpriteButtonOwnProps {
  /** Accessible name. Defaults to `Warning`. */
  readonly label?: string;
}

export type WarningButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  WarningButtonOwnProps
>;

/** The 20×20 warning triangle button shown on dialogs (`dialog/warning_button`). */
export function WarningButton<E extends ElementType = 'button'>(
  props: WarningButtonProps<E>,
): JSX.Element {
  const {
    label = 'Warning',
    width = 20,
    height = 20,
    ...rest
  } = props as WarningButtonProps<'button'>;
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={WARNING_BUTTON_SPRITES}
    />
  );
}
