import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';

/** Where a child sits inside the space it is given (`LayoutSettings#alignHorizontally` and `alignVertically`). */
export type LayoutAlign = 'start' | 'center' | 'end';

const ALIGN: Record<LayoutAlign, 'flex-start' | 'center' | 'flex-end'> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

// ----------------------------------------------------------------------------- LinearLayout

export interface LinearLayoutOwnProps {
  readonly children?: ReactNode;
  /** `vertical` stacks children top to bottom, `horizontal` left to right. Defaults to `vertical`. */
  readonly orientation?: 'vertical' | 'horizontal';
  /** Gap between children in GUI units (`LinearLayout#spacing`). Defaults to 0. */
  readonly spacing?: number;
  /** Where children sit across the layout's axis. Defaults to `start`. */
  readonly align?: LayoutAlign;
}

export type LinearLayoutProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  LinearLayoutOwnProps
>;

/**
 * Stacks children in a column or row with a fixed gap, like `LinearLayout`. Every menu in the game
 * is built from these, so it is the quickest way to lay out a screen.
 */
export function LinearLayout<E extends ElementType = 'div'>(
  props: LinearLayoutProps<E>,
): JSX.Element {
  const {
    as,
    children,
    orientation = 'vertical',
    spacing = 0,
    align = 'start',
    className,
    style,
    ...rest
  } = props as LinearLayoutProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-spacing': spacing,
    '--cobble-align': ALIGN[align],
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-linear-layout', className), style: rootStyle },
        rest,
      )}
      data-orientation={orientation}
    >
      {children}
    </Component>
  );
}

// ------------------------------------------------------------------------------- GridLayout

export interface GridLayoutOwnProps {
  readonly children?: ReactNode;
  /** Number of columns. Each is as wide as its widest cell, like `GridLayout`. */
  readonly columns: number;
  /** Gap between columns in GUI units. Defaults to `spacing`. */
  readonly columnSpacing?: number;
  /** Gap between rows in GUI units. Defaults to `spacing`. */
  readonly rowSpacing?: number;
  /** Gap in both directions (`GridLayout#spacing`). Defaults to 0. */
  readonly spacing?: number;
  /** How a cell's content sits in its cell, horizontally. Defaults to `start`. */
  readonly alignX?: LayoutAlign;
  /** How a cell's content sits in its cell, vertically. Defaults to `start`. */
  readonly alignY?: LayoutAlign;
}

export type GridLayoutProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  GridLayoutOwnProps
>;

/**
 * Lays children out in a grid whose columns are as wide as their widest cell and whose rows are as
 * tall as their tallest, like `GridLayout`. Wrap a child in {@link GridLayoutCell} to span columns
 * or rows or to align it differently.
 */
export function GridLayout<E extends ElementType = 'div'>(props: GridLayoutProps<E>): JSX.Element {
  const {
    as,
    children,
    columns,
    columnSpacing,
    rowSpacing,
    spacing = 0,
    alignX = 'start',
    alignY = 'start',
    className,
    style,
    ...rest
  } = props as GridLayoutProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-columns': Math.max(Math.trunc(columns), 1),
    '--cobble-column-spacing': columnSpacing ?? spacing,
    '--cobble-row-spacing': rowSpacing ?? spacing,
    '--cobble-align-x': ALIGN[alignX],
    '--cobble-align-y': ALIGN[alignY],
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-grid-layout', className), style: rootStyle },
        rest,
      )}
    >
      {children}
    </Component>
  );
}

export interface GridLayoutCellOwnProps {
  readonly children?: ReactNode;
  /** Columns the cell covers (`GridLayout#addChild` `occupiedColumns`). Defaults to 1. */
  readonly colSpan?: number;
  /** Rows the cell covers. Defaults to 1. */
  readonly rowSpan?: number;
  readonly alignX?: LayoutAlign;
  readonly alignY?: LayoutAlign;
}

export type GridLayoutCellProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  GridLayoutCellOwnProps
>;

/** One cell of a {@link GridLayout}, for spanning and per-cell alignment. */
export function GridLayoutCell<E extends ElementType = 'div'>(
  props: GridLayoutCellProps<E>,
): JSX.Element {
  const {
    as,
    children,
    colSpan = 1,
    rowSpan = 1,
    alignX,
    alignY,
    className,
    style,
    ...rest
  } = props as GridLayoutCellProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    gridColumn: `span ${String(Math.max(Math.trunc(colSpan), 1))}`,
    gridRow: `span ${String(Math.max(Math.trunc(rowSpan), 1))}`,
    ...style,
  };
  if (alignX !== undefined) rootStyle['--cobble-align-x'] = ALIGN[alignX];
  if (alignY !== undefined) rootStyle['--cobble-align-y'] = ALIGN[alignY];
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-grid-layout-cell', className), style: rootStyle },
        rest,
      )}
    >
      {children}
    </Component>
  );
}

// ------------------------------------------------------------------------------ FrameLayout

export interface FrameLayoutOwnProps {
  readonly children?: ReactNode;
  /** Minimum width in GUI units (`FrameLayout#setMinWidth`). */
  readonly minWidth?: number;
  /** Minimum height in GUI units. */
  readonly minHeight?: number;
  /** Horizontal placement of the children in the frame. Defaults to `center`. */
  readonly alignX?: LayoutAlign;
  /** Vertical placement of the children in the frame. Defaults to `center`. */
  readonly alignY?: LayoutAlign;
}

export type FrameLayoutProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  FrameLayoutOwnProps
>;

/**
 * A frame that places each child, on top of one another, at the start, centre or end of the frame,
 * like `FrameLayout`. Handy for centring a column of buttons in the space a screen leaves.
 */
export function FrameLayout<E extends ElementType = 'div'>(
  props: FrameLayoutProps<E>,
): JSX.Element {
  const {
    as,
    children,
    minWidth,
    minHeight,
    alignX = 'center',
    alignY = 'center',
    className,
    style,
    ...rest
  } = props as FrameLayoutProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-align-x': ALIGN[alignX],
    '--cobble-align-y': ALIGN[alignY],
    ...style,
  };
  if (minWidth !== undefined) rootStyle['--cobble-min-width'] = minWidth;
  if (minHeight !== undefined) rootStyle['--cobble-min-height'] = minHeight;
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-frame-layout', className), style: rootStyle },
        rest,
      )}
    >
      {children}
    </Component>
  );
}
