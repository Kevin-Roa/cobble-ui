import type { JSX } from 'react';
import { AnimatedSprite, type AnimatedSpriteProps } from '../sprite/AnimatedSprite.tsx';

/** Size of a realm status icon frame. */
export const REALM_STATUS_WIDTH = 10;
export const REALM_STATUS_HEIGHT = 28;

/** The state shown by a {@link RealmStatusIcon}. */
export type RealmStatus = 'open' | 'closed' | 'expired' | 'expires_soon';

export interface RealmStatusIconProps extends Omit<
  AnimatedSpriteProps,
  'sprite' | 'frameWidth' | 'frameHeight' | 'frametime' | 'frames'
> {
  readonly status: RealmStatus;
}

/**
 * The 10×28 status light on a Realm entry: green for open, red for closed, grey for
 * expired, and a blinking light (two frames, 10 ticks each) when it expires soon.
 */
export function RealmStatusIcon(props: RealmStatusIconProps): JSX.Element {
  const { status, ...rest } = props;
  return (
    <AnimatedSprite
      {...rest}
      sprite={`realm_status/${status}`}
      frameWidth={REALM_STATUS_WIDTH}
      frameHeight={REALM_STATUS_HEIGHT}
      frametime={10}
    />
  );
}
