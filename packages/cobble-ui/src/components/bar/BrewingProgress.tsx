import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

export const BREW_ARROW_WIDTH = 9;
export const BREW_ARROW_HEIGHT = 28;
export const FUEL_BAR_WIDTH = 18;
export const FUEL_BAR_HEIGHT = 4;

/** Height of the brewing arrow: `(int)(28 * (1 - brewTime / 400))` (`BrewingStandScreen`). */
export function brewArrowFill(progress: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.min(BREW_ARROW_HEIGHT, Math.floor(BREW_ARROW_HEIGHT * clamped));
}

/** Width of the fuel bar for `fuel` blaze powder charges out of 20: `(18 * fuel + 19) / 20`. */
export function fuelBarFill(fuel: number): number {
  const charges = Math.min(Math.max(Math.trunc(Number.isFinite(fuel) ? fuel : 0), 0), 20);
  return Math.min(FUEL_BAR_WIDTH, Math.trunc((FUEL_BAR_WIDTH * charges + 19) / 20));
}

export interface BrewArrowOwnProps {
  /** Progress through the brew, 0 to 1. Draws nothing when 0. */
  readonly progress: number;
}

export type BrewArrowProps<E extends ElementType = 'div'> = PolymorphicProps<E, BrewArrowOwnProps>;

/**
 * The down arrow of the brewing stand that fills from the top as potions brew (9×28). Draw
 * it over the arrow printed on the screen's background texture.
 */
export function BrewArrow<E extends ElementType = 'div'>(props: BrewArrowProps<E>): JSX.Element {
  const { as, progress, className, style, ...rest } = props as BrewArrowProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = brewArrowFill(progress);
  const { tOr } = useTranslation();
  const rootStyle: CssVariables = {
    '--cobble-width': BREW_ARROW_WIDTH,
    '--cobble-height': BREW_ARROW_HEIGHT,
    '--cobble-clip-height': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-brew-arrow', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': tOr('cobble.bar.brewing_progress', 'Brewing progress'),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
    >
      {fill > 0 ? (
        <span className="cobble-brew-arrow-fill">
          <Sprite
            sprite="container/brewing_stand/brew_progress"
            width={BREW_ARROW_WIDTH}
            height={BREW_ARROW_HEIGHT}
          />
        </span>
      ) : null}
    </Component>
  );
}

export interface FuelBarOwnProps {
  /** Blaze powder charges left, 0 to 20. */
  readonly fuel: number;
}

export type FuelBarProps<E extends ElementType = 'div'> = PolymorphicProps<E, FuelBarOwnProps>;

/** The blaze powder fuel bar of the brewing stand (`container/brewing_stand/fuel_length`, 18×4). */
export function FuelBar<E extends ElementType = 'div'>(props: FuelBarProps<E>): JSX.Element {
  const { as, fuel, className, style, ...rest } = props as FuelBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = fuelBarFill(fuel);
  const { tOr } = useTranslation();
  const rootStyle: CssVariables = {
    '--cobble-width': FUEL_BAR_WIDTH,
    '--cobble-height': FUEL_BAR_HEIGHT,
    '--cobble-clip-width': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-fuel-bar', className),
          style: rootStyle,
          role: 'meter',
          'aria-label': tOr('cobble.bar.blaze_powder', 'Blaze powder'),
          'aria-valuemin': 0,
          'aria-valuemax': 20,
          'aria-valuenow': Math.min(Math.max(Math.trunc(fuel), 0), 20),
        },
        rest,
      )}
    >
      {fill > 0 ? (
        <span className="cobble-stat-bar-clip">
          <Sprite
            sprite="container/brewing_stand/fuel_length"
            width={FUEL_BAR_WIDTH}
            height={FUEL_BAR_HEIGHT}
          />
        </span>
      ) : null}
    </Component>
  );
}
