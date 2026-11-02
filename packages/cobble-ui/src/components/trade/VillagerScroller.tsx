import type { ElementType, JSX } from 'react';
import { CreativeScroller, type CreativeScrollerOwnProps } from '../creative/CreativeScroller.tsx';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Size of the villager trade list scroller thumb. */
export const VILLAGER_SCROLLER_WIDTH = 6;
export const VILLAGER_SCROLLER_HEIGHT = 27;

export type VillagerScrollerOwnProps = Omit<
  CreativeScrollerOwnProps,
  'sprite' | 'disabledSprite' | 'thumbWidth' | 'thumbHeight'
>;

export type VillagerScrollerProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  VillagerScrollerOwnProps
>;

/**
 * The thumb beside the villager trade list (`container/villager/scroller`, 6×27), a
 * {@link CreativeScroller} with the trading screen's sprites. The default track height
 * of 139 is an approximation of the game's.
 */
export function VillagerScroller<E extends ElementType = 'div'>(
  props: VillagerScrollerProps<E>,
): JSX.Element {
  const { height = 139, ...rest } = props as VillagerScrollerProps<'div'>;
  const { tOr } = useTranslation();
  return (
    <CreativeScroller
      aria-label={tOr('cobble.trade.trades', 'Trades')}
      {...rest}
      height={height}
      sprite="container/villager/scroller"
      disabledSprite="container/villager/scroller_disabled"
      thumbWidth={VILLAGER_SCROLLER_WIDTH}
      thumbHeight={VILLAGER_SCROLLER_HEIGHT}
    />
  );
}
