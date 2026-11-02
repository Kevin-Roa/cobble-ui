import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Border thickness plus the gap inside it, before the fill starts (`LoadingOverlay#drawProgressBar`). */
export const PROGRESS_BAR_INSET = 2;

/** Filled width inside the border for `progress` in `[0, 1]`: `ceil((width - 2 * inset) * progress)`. */
export function progressBarFill(progress: number, width: number): number {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  return Math.ceil(Math.max(width - 2 * PROGRESS_BAR_INSET, 0) * clamped);
}

export interface ProgressBarOwnProps {
  /** Progress from 0 to 1. Leave out for an indeterminate bar that sweeps back and forth. */
  readonly progress?: number;
  /** Width in GUI units. Defaults to 200. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 10. */
  readonly height?: number;
  /** Accessible name. Defaults to `Progress`. */
  readonly label?: string;
}

export type ProgressBarProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ProgressBarOwnProps
>;

/**
 * The white outlined progress bar of the game's loading screens: a 1-unit border, a 1-unit
 * gap, then a fill. The fill rule and the 10-unit default height are approximations of the
 * game's; the Mojang logo and red background of its loading overlay are deliberately absent.
 */
export function ProgressBar<E extends ElementType = 'div'>(
  props: ProgressBarProps<E>,
): JSX.Element {
  const {
    as,
    progress,
    width = 200,
    height = 10,
    label,
    className,
    style,
    ...rest
  } = props as ProgressBarProps<'div'>;
  const { tOr } = useTranslation();
  const Component: ElementType = as ?? 'div';
  const determinate = progress !== undefined;
  const fill = determinate ? progressBarFill(progress, width) : 0;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    '--cobble-fill': fill,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-progress-bar', className),
          style: rootStyle,
          role: 'progressbar',
          'aria-label': label ?? tOr('cobble.progress.label', 'Progress'),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': determinate
            ? Math.round(Math.min(Math.max(progress, 0), 1) * 100)
            : undefined,
        },
        rest,
      )}
      data-indeterminate={determinate ? undefined : ''}
    >
      <span className="cobble-progress-bar-fill" />
    </Component>
  );
}
