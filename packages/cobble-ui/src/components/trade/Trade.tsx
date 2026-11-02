import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { Sprite, type SpriteProps } from '../sprite/Sprite.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Width of the villager experience bar sprites. */
export const VILLAGER_XP_BAR_WIDTH = 102;
/** Height of the villager experience bar sprites. */
export const VILLAGER_XP_BAR_HEIGHT = 5;

/** Filled width of a villager bar for `progress` in `[0, 1]`: `floor(progress * 102)`. */
export function villagerXpFill(progress: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.floor(clamped * VILLAGER_XP_BAR_WIDTH);
}

export interface TradeArrowProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  /** Draws the red, crossed-out variant. */
  readonly outOfStock?: boolean;
}

/** The 10×9 arrow between a trade's inputs and its result (`container/villager/trade_arrow`). */
export function TradeArrow(props: TradeArrowProps): JSX.Element {
  const { outOfStock = false, ...rest } = props;
  return (
    <Sprite
      {...rest}
      sprite={
        outOfStock
          ? 'container/villager/trade_arrow_out_of_stock'
          : 'container/villager/trade_arrow'
      }
      width={10}
      height={9}
    />
  );
}

function XpClip(props: { readonly width: number; readonly sprite: SpriteId }): JSX.Element | null {
  if (props.width <= 0) return null;
  const style: CssVariables = { '--cobble-clip-width': props.width };
  return (
    <span className="cobble-stat-bar-clip" style={style}>
      <Sprite sprite={props.sprite} width={VILLAGER_XP_BAR_WIDTH} height={VILLAGER_XP_BAR_HEIGHT} />
    </span>
  );
}

export interface VillagerXpBarOwnProps {
  /** Progress through the current level, 0 to 1. */
  readonly progress: number;
  /** Progress the highlighted trade would add, 0 to 1. Drawn in the lighter "result" color. */
  readonly gain?: number;
}

export type VillagerXpBarProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  VillagerXpBarOwnProps
>;

/**
 * The villager level bar in the trading screen: 102×5, with the current progress and,
 * past it, the experience the selected trade would grant.
 */
export function VillagerXpBar<E extends ElementType = 'div'>(
  props: VillagerXpBarProps<E>,
): JSX.Element {
  const { as, progress, gain = 0, className, style, ...rest } = props as VillagerXpBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const current = villagerXpFill(progress);
  const result = villagerXpFill(progress + gain);
  const { tOr } = useTranslation();
  const rootStyle: CssVariables = {
    '--cobble-width': VILLAGER_XP_BAR_WIDTH,
    '--cobble-height': VILLAGER_XP_BAR_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-villager-xp-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': tOr('cobble.trade.villager_experience', 'Villager experience'),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
    >
      <Sprite
        sprite="container/villager/experience_bar_background"
        width={VILLAGER_XP_BAR_WIDTH}
        height={VILLAGER_XP_BAR_HEIGHT}
      />
      {gain > 0 ? (
        <XpClip width={result} sprite="container/villager/experience_bar_result" />
      ) : null}
      <XpClip width={current} sprite="container/villager/experience_bar_current" />
    </Component>
  );
}
