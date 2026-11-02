import type { ElementType, JSX } from 'react';
import { Sprite } from '../sprite/Sprite.tsx';
import { HOTBAR_ITEM_SIZE, HOTBAR_SLOTS, Hotbar, type HotbarOwnProps } from './Hotbar.tsx';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { useTranslation } from '../../i18n/Translation.tsx';

/** The icons of the spectator menu (`spectator/*`), all 16×16. */
export type SpectatorIcon =
  | 'close'
  | 'scroll_left'
  | 'scroll_right'
  | 'teleport_to_player'
  | 'teleport_to_team';

export interface SpectatorMenuOwnProps extends Omit<HotbarOwnProps, 'slots'> {
  /** The icon in each of the 9 slots; leave an entry out (or `undefined`) for an empty slot. */
  readonly icons?: readonly (SpectatorIcon | undefined)[];
}

export type SpectatorMenuProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SpectatorMenuOwnProps
>;

/**
 * The spectator menu: the hotbar frame with a 16×16 `spectator/*` icon in each slot you
 * fill. Which icon goes in which slot is up to you; the game's own slot assignment is not
 * reproduced.
 */
export function SpectatorMenu<E extends ElementType = 'div'>(
  props: SpectatorMenuProps<E>,
): JSX.Element {
  const { icons = [], ...rest } = props as SpectatorMenuProps<'div'>;
  const { tOr } = useTranslation();
  const slots = Array.from({ length: HOTBAR_SLOTS }, (_, index) => {
    const icon = icons[index];
    return icon === undefined ? null : (
      <Sprite
        key={icon}
        sprite={`spectator/${icon}`}
        width={HOTBAR_ITEM_SIZE}
        height={HOTBAR_ITEM_SIZE}
      />
    );
  });
  return (
    <Hotbar
      aria-label={tOr('cobble.hotbar.spectator_menu', 'Spectator menu')}
      {...rest}
      slots={slots}
    />
  );
}
