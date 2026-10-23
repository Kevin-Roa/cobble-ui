import type { SpriteId } from '../../assets/sprite-id.ts';
import { useEffect, useState, type JSX } from 'react';
import type { SpriteProps } from '../sprite/Sprite.tsx';
import { Sprite } from '../sprite/Sprite.tsx';

/** Size of the server list ping sprites. */
export const PING_ICON_WIDTH = 10;
export const PING_ICON_HEIGHT = 8;

/** Sprite for a measured latency in ms (`ServerSelectionList.OnlineServerEntry`); negative means unreachable. */
export function pingSprite(latency: number): SpriteId {
  if (latency < 0) return 'server_list/unreachable';
  if (latency < 150) return 'server_list/ping_5';
  if (latency < 300) return 'server_list/ping_4';
  if (latency < 600) return 'server_list/ping_3';
  if (latency < 1000) return 'server_list/ping_2';
  return 'server_list/ping_1';
}

/** Sprite of the "pinging" animation: frames advance every 100 ms, offset by `index * 2`. */
const PINGING_FRAMES = [
  'server_list/pinging_1',
  'server_list/pinging_2',
  'server_list/pinging_3',
  'server_list/pinging_4',
  'server_list/pinging_5',
] as const satisfies readonly SpriteId[];

export function pingingSprite(millis: number, index = 0): SpriteId {
  let frame = (Math.floor(millis / 100) + index * 2) & 7;
  if (frame > 4) frame = 8 - frame;
  return PINGING_FRAMES[frame] ?? 'server_list/pinging_1';
}

export interface PingIconProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  /** Latency in ms, `'pinging'` for the animation, or `'incompatible'`. Negative latency is unreachable. */
  readonly latency: number | 'pinging' | 'incompatible';
  /** Offsets the pinging animation, like the entry's index in the list. */
  readonly index?: number;
}

/** The connection-strength icon of a server list entry (10×8). */
export function PingIcon(props: PingIconProps): JSX.Element {
  const { latency, index = 0, ...rest } = props;
  const [tick, setTick] = useState(0);
  const pinging = latency === 'pinging';
  useEffect(() => {
    if (!pinging) return undefined;
    const interval = setInterval(() => setTick((value) => value + 1), 100);
    return () => clearInterval(interval);
  }, [pinging]);
  const sprite =
    latency === 'incompatible'
      ? 'server_list/incompatible'
      : latency === 'pinging'
        ? pingingSprite(tick * 100, index)
        : pingSprite(latency);
  return <Sprite {...rest} sprite={sprite} width={PING_ICON_WIDTH} height={PING_ICON_HEIGHT} />;
}
