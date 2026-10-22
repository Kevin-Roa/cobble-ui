import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Default width of the bundle fill bar. */
export const BUNDLE_BAR_WIDTH = 94;
/** Default height of the bundle fill bar. */
export const BUNDLE_BAR_HEIGHT = 13;
/** Border thickness the fill is inset by. */
export const BUNDLE_BAR_BORDER = 1;

/** Filled width inside the border for `progress` in `[0, 1]`: `floor(progress * (width - 2))`. */
export function bundleBarFill(progress: number, width: number = BUNDLE_BAR_WIDTH): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.floor(clamped * (width - 2 * BUNDLE_BAR_BORDER));
}

export interface BundleProgressBarOwnProps {
  /** How full the bundle is, 0 to 1. At 1 the `full` fill sprite is used. */
  readonly progress: number;
  /** Width in GUI units. Defaults to 94. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 13. */
  readonly height?: number;
}

export type BundleProgressBarProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  BundleProgressBarOwnProps
>;

/**
 * The fill bar in a bundle tooltip: the `bundle_progressbar_border` nine-slice with a
 * `bundle_progressbar_fill` (or `_full`) nine-slice inside it. The 94×13 default size and
 * 1-unit inset are approximations of the game's.
 */
export function BundleProgressBar<E extends ElementType = 'div'>(
  props: BundleProgressBarProps<E>,
): JSX.Element {
  const {
    as,
    progress,
    width = BUNDLE_BAR_WIDTH,
    height = BUNDLE_BAR_HEIGHT,
    className,
    style,
    ...rest
  } = props as BundleProgressBarProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fill = bundleBarFill(progress, width);
  const full = progress >= 1;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-stat-bar', 'cobble-bundle-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': 'Bundle fullness',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(Math.min(Math.max(progress, 0), 1) * 100),
        },
        rest,
      )}
      data-full={full ? '' : undefined}
    >
      <Sprite sprite="container/bundle/bundle_progressbar_border" width={width} height={height} />
      {fill > 0 ? (
        <Sprite
          sprite={
            full
              ? 'container/bundle/bundle_progressbar_full'
              : 'container/bundle/bundle_progressbar_fill'
          }
          width={fill}
          height={height - 2 * BUNDLE_BAR_BORDER}
          style={placeAt(BUNDLE_BAR_BORDER, BUNDLE_BAR_BORDER)}
        />
      ) : null}
    </Component>
  );
}
