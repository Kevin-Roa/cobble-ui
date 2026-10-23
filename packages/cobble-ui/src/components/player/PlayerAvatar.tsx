import { useState, type JSX } from 'react';
import type { SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';
import { mcHeadsUrl, type McHeadsRender } from './mcheads.ts';

export interface PlayerAvatarProps extends Omit<SlotProps<'img'>, 'src' | 'width' | 'height'> {
  /** Username or UUID. */
  readonly player: string;
  readonly render: McHeadsRender;
  /** Displayed width in GUI units. */
  readonly width: number;
  /** Displayed height in GUI units. */
  readonly height: number;
  /** Called once if the image could not be loaded (offline, unknown player). */
  readonly onFailed?: () => void;
}

/** An `<img>` of a mc-heads.net render, requested at device resolution and drawn pixelated. */
export function PlayerAvatar(props: PlayerAvatarProps): JSX.Element | null {
  const { player, render, width, height, onFailed, className, style, alt = '', ...rest } = props;
  const { deviceScale } = useCobble();
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === player) return null;
  return (
    <img
      {...rest}
      alt={alt}
      src={mcHeadsUrl(render, player, Math.ceil(width * deviceScale))}
      className={cx('cobble-player-avatar', className)}
      data-flow=""
      onError={() => {
        setFailed(player);
        onFailed?.();
      }}
      style={{
        width: `calc(${String(width)} * var(--cobble-px))`,
        height: `calc(${String(height)} * var(--cobble-px))`,
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}
