import type { SpriteId } from '../../assets/sprite-id.ts';
import type { JSX } from 'react';
import { Sprite, type SpriteProps } from './Sprite.tsx';

/** Size of the notification badge sprites. */
export const NOTIFICATION_BADGE_SIZE = 8;

/** Sprite for a count: `notification/1`–`5`, `notification/more` above 5, none for 0 or less. */
const COUNT_SPRITES = [
  'notification/1',
  'notification/2',
  'notification/3',
  'notification/4',
  'notification/5',
] as const satisfies readonly SpriteId[];

export function notificationSprite(count: number): SpriteId | undefined {
  const whole = Math.floor(count);
  if (!(whole >= 1)) return undefined;
  return COUNT_SPRITES[whole - 1] ?? 'notification/more';
}

export interface NotificationBadgeProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  /** Number of notifications. Renders nothing when 0. */
  readonly count: number;
}

/** The small red count badge shown on menu buttons (`notification/*`), 8×8. */
export function NotificationBadge(props: NotificationBadgeProps): JSX.Element | null {
  const { count, ...rest } = props;
  const sprite = notificationSprite(count);
  if (sprite === undefined) return null;
  return (
    <Sprite
      role="img"
      aria-hidden={undefined}
      aria-label={`${String(count)} notifications`}
      {...rest}
      sprite={sprite}
      width={NOTIFICATION_BADGE_SIZE}
      height={NOTIFICATION_BADGE_SIZE}
    />
  );
}
