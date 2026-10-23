import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { PlayerAvatar } from './PlayerAvatar.tsx';
import type { McHeadsRender } from './mcheads.ts';

/** Which render of the player to show. */
export type PlayerView = Extract<McHeadsRender, 'body' | 'player' | 'head' | 'skin'>;

export interface PlayerRendererOwnProps {
  /** Username or UUID. The skin is fetched from mc-heads.net by the browser. */
  readonly player: string;
  /**
   * `body` is the full figure, `player` the figure from the front, `head` an isometric head and
   * `skin` the raw texture. Defaults to `body`.
   */
  readonly view?: PlayerView;
  /** Height in GUI units. Defaults to 70, the height of the inventory screen's preview. */
  readonly height?: number;
  /** Width in GUI units. Defaults to half the height for the figures, and the height otherwise. */
  readonly width?: number;
  /** Accessible name. Defaults to the player's name and "skin". */
  readonly label?: string;
}

export type PlayerRendererProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PlayerRendererOwnProps
>;

/**
 * A preview of a player's skin, like the figure in the inventory screen. The image is requested
 * from mc-heads.net by the browser, so it needs a network connection; nothing is bundled.
 */
export function PlayerRenderer<E extends ElementType = 'div'>(
  props: PlayerRendererProps<E>,
): JSX.Element {
  const {
    as,
    player,
    view = 'body',
    height = 70,
    width = view === 'body' || view === 'player' ? Math.round(height / 2) : height,
    label,
    className,
    style,
    ...rest
  } = props as PlayerRendererProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-player-renderer', className),
          style: rootStyle,
          role: 'img',
          'aria-label': label ?? `${player} skin`,
        },
        rest,
      )}
    >
      <PlayerAvatar
        aria-hidden
        player={player}
        render={view}
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
      />
    </Component>
  );
}
