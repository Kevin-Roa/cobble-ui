import type { ElementType, JSX } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import type { WidgetSprites } from '../shared.ts';
import { Button, type ButtonOwnProps } from './Button.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Which screen's artwork a {@link ResponseButton} uses: the friends list or the pending-invite popup. */
export type ResponseContext = 'friends' | 'invite';
export type ResponseKind = 'accept' | 'reject';

/** Sprites of an accept or reject button (`friends/accept`, `pending_invite/reject`, ...). */
export function responseButtonSprites(kind: ResponseKind, context: ResponseContext): WidgetSprites {
  const folder = context === 'friends' ? 'friends' : 'pending_invite';
  return {
    enabled: `${folder}/${kind}`,
    enabledFocused: `${folder}/${kind}_highlighted`,
  };
}

export interface ResponseButtonOwnProps extends Omit<
  ButtonOwnProps,
  'icon' | 'sprites' | 'children'
> {
  readonly kind: ResponseKind;
  /** Which screen's artwork to use. Defaults to `friends`. */
  readonly context?: ResponseContext;
  /** Accessible name. Defaults to `Accept` / `Reject`. */
  readonly label?: string;
}

export type ResponseButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  ResponseButtonOwnProps
>;

/** The 18×18 check or cross that accepts or rejects a friend request or realm invite. */
export function ResponseButton<E extends ElementType = 'button'>(
  props: ResponseButtonProps<E>,
): JSX.Element {
  const {
    kind,
    context = 'friends',
    label: labelProp,
    width = 18,
    height = 18,
    ...rest
  } = props as ResponseButtonProps<'button'>;
  const { tOr } = useTranslation();
  const label =
    labelProp ??
    (kind === 'accept'
      ? tOr('cobble.friends.accept', 'Accept')
      : tOr('cobble.friends.reject', 'Reject'));
  return (
    <Button
      aria-label={label}
      {...rest}
      width={width}
      height={height}
      sprites={responseButtonSprites(kind, context)}
    />
  );
}

/** `friends/button` sprites: the friends screen's flatter wide button. */
export const FRIENDS_BUTTON_SPRITES: WidgetSprites = {
  enabled: 'friends/button',
  disabled: 'friends/button_disabled',
  enabledFocused: 'friends/button_highlighted',
};

export type FriendsButtonOwnProps = Omit<ButtonOwnProps, 'sprites'>;
export type FriendsButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  FriendsButtonOwnProps
>;

/** A {@link Button} drawn with the friends screen's own button sprites. */
export function FriendsButton<E extends ElementType = 'button'>(
  props: FriendsButtonProps<E>,
): JSX.Element {
  return <Button {...(props as FriendsButtonProps<'button'>)} sprites={FRIENDS_BUTTON_SPRITES} />;
}
