import type { JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { Sprite, type SpriteProps } from '../sprite/Sprite.tsx';

/** Sprite for a latency in ms in the player list; negative or `'unknown'` is the grey one. */
export function playerPingSprite(latency: number | 'unknown'): SpriteId {
  if (latency === 'unknown' || latency < 0) return 'icon/ping_unknown';
  if (latency < 150) return 'icon/ping_5';
  if (latency < 300) return 'icon/ping_4';
  if (latency < 600) return 'icon/ping_3';
  if (latency < 1000) return 'icon/ping_2';
  return 'icon/ping_1';
}

export interface PlayerPingIconProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  /** Latency in ms, or `'unknown'`. */
  readonly latency: number | 'unknown';
}

/**
 * The connection bars beside a player in the player list (`icon/ping_1`-`5`, 10×8). The thresholds
 * (150, 300, 600 and 1000 ms) match the server list's {@link PingIcon}, which uses different art.
 */
export function PlayerPingIcon(props: PlayerPingIconProps): JSX.Element {
  const { latency, ...rest } = props;
  return <Sprite {...rest} sprite={playerPingSprite(latency)} width={10} height={8} data-flow="" />;
}
