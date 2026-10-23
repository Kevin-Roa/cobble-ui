import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** The block the progress belongs to: each has its own sprites. */
export type CookingStation = 'furnace' | 'smoker' | 'blast_furnace';

export const COOKING_ARROW_WIDTH = 24;
export const COOKING_ARROW_HEIGHT = 16;
export const FUEL_FLAME_SIZE = 14;

const ARROW_SPRITES: Record<CookingStation, SpriteId> = {
  furnace: 'container/furnace/burn_progress',
  smoker: 'container/smoker/burn_progress',
  blast_furnace: 'container/blast_furnace/burn_progress',
};

const FLAME_SPRITES: Record<CookingStation, SpriteId> = {
  furnace: 'container/furnace/lit_progress',
  smoker: 'container/smoker/lit_progress',
  blast_furnace: 'container/blast_furnace/lit_progress',
};

/** Width of the filled arrow: `Mth.ceil(progress * 24)` (`AbstractFurnaceScreen`). */
export function cookingArrowFill(progress: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.min(COOKING_ARROW_WIDTH, Math.ceil(clamped * COOKING_ARROW_WIDTH));
}

/** Height of the visible flame: `Mth.ceil(lit * 13) + 1` once there is any fuel, else 0. */
export function fuelFlameFill(lit: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(lit) ? lit : 0, 0), 1);
  if (clamped <= 0) return 0;
  return Math.min(FUEL_FLAME_SIZE, Math.ceil(clamped * 13) + 1);
}

export interface CookingArrowOwnProps {
  /** Progress through the current item, 0 to 1. Draws nothing when 0. */
  readonly progress: number;
  readonly station?: CookingStation;
}

export type CookingArrowProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  CookingArrowOwnProps
>;

/**
 * The arrow of a furnace, smoker or blast furnace that fills left to right as the item cooks
 * (24×16). Draw it over the arrow printed on the screen's background texture, as the game does.
 */
export function CookingArrow<E extends ElementType = 'div'>(
  props: CookingArrowProps<E>,
): JSX.Element {
  const {
    as,
    progress,
    station = 'furnace',
    className,
    style,
    ...rest
  } = props as CookingArrowProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = cookingArrowFill(progress);
  const rootStyle: CssVariables = {
    '--cobble-width': COOKING_ARROW_WIDTH,
    '--cobble-height': COOKING_ARROW_HEIGHT,
    '--cobble-clip-width': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-cooking-arrow', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': 'Cooking progress',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
      data-station={station}
    >
      {fill > 0 ? (
        <span className="cobble-stat-bar-clip">
          <Sprite
            sprite={ARROW_SPRITES[station]}
            width={COOKING_ARROW_WIDTH}
            height={COOKING_ARROW_HEIGHT}
          />
        </span>
      ) : null}
    </Component>
  );
}

export interface FuelFlameOwnProps {
  /** How much of the current fuel is left, 0 to 1. Draws nothing when 0. */
  readonly lit: number;
  readonly station?: CookingStation;
}

export type FuelFlameProps<E extends ElementType = 'div'> = PolymorphicProps<E, FuelFlameOwnProps>;

/**
 * The flame of a furnace, smoker or blast furnace that burns down from the top as the fuel
 * runs out (14×14). Draw it over the flame printed on the screen's background texture.
 */
export function FuelFlame<E extends ElementType = 'div'>(props: FuelFlameProps<E>): JSX.Element {
  const {
    as,
    lit,
    station = 'furnace',
    className,
    style,
    ...rest
  } = props as FuelFlameProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = fuelFlameFill(lit);
  const rootStyle: CssVariables = {
    '--cobble-width': FUEL_FLAME_SIZE,
    '--cobble-height': FUEL_FLAME_SIZE,
    '--cobble-clip-height': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-fuel-flame', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': 'Fuel remaining',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(lit, 0), 1) * 100),
        },
        rest,
      )}
      data-station={station}
    >
      {fill > 0 ? (
        <span className="cobble-bottom-clip">
          <Sprite
            sprite={FLAME_SPRITES[station]}
            width={FUEL_FLAME_SIZE}
            height={FUEL_FLAME_SIZE}
            style={placeAt(0, fill - FUEL_FLAME_SIZE)}
          />
        </span>
      ) : null}
    </Component>
  );
}
