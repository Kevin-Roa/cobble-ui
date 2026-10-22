import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { useAnimationFrame, useIsomorphicLayoutEffect, useLatest } from '../internal/hooks.ts';
import type { CssVariables, SlotProps } from '../internal/polymorphic.ts';
import { useCobble } from '../provider/context.ts';

export const LINE_HEIGHT = 9;

/** `ActiveTextCollector.defaultScrollingHelper`'s vertical placement. */
export function scrollingTextTop(top: number, bottom: number): number {
  return Math.trunc((top + bottom - LINE_HEIGHT) / 2) + 1;
}

/** Horizontal position of a line that fits, centred on `centerX` but kept inside `[left, right]`. */
export function centeredTextLeft(
  lineWidth: number,
  left: number,
  right: number,
  centerX: number,
): number {
  const half = Math.trunc(lineWidth / 2);
  const textX = Math.min(Math.max(centerX, left + half), right - half);
  return textX - half;
}

/** Scroll offset (in GUI units) of a line that does not fit, at `timeMs`. */
export function scrollingTextOffset(lineWidth: number, available: number, timeMs: number): number {
  const maxPosition = lineWidth - available;
  const time = timeMs / 1000;
  const period = Math.max(maxPosition * 0.5, 3);
  const alpha = Math.sin((Math.PI / 2) * Math.cos((Math.PI * 2 * time) / period)) / 2 + 0.5;
  return Math.trunc(alpha * maxPosition);
}

export interface ScrollingTextProps extends Omit<SlotProps<'span'>, 'children'> {
  readonly children?: ReactNode;
  /** Left edge of the text area, in GUI units relative to the widget. */
  readonly left: number;
  /** Right edge of the text area. */
  readonly right: number;
  /** Top edge of the box the line is vertically centred in. */
  readonly top: number;
  /** Bottom edge of the box the line is vertically centred in. */
  readonly bottom: number;
  /** Horizontal anchor. Defaults to the middle of `[left, right]`. */
  readonly centerX?: number;
  /** Called with the measured width of the line, in GUI units. */
  readonly onLineWidthChange?: (width: number) => void;
}

/**
 * A single line of text centred in a box that scrolls back and forth when it
 * does not fit, exactly like button labels in the game.
 */
export function ScrollingText(props: ScrollingTextProps): JSX.Element {
  const {
    children,
    left,
    right,
    top,
    bottom,
    centerX,
    onLineWidthChange,
    ref,
    className,
    style,
    ...rest
  } = props;
  const { unit } = useCobble();
  const lineRef = useRef<HTMLSpanElement>(null);
  const [lineWidth, setLineWidth] = useState<number | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    const element = lineRef.current;
    if (!element) return undefined;
    const measure = (): void => setLineWidth(Math.round(element.offsetWidth / unit));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [unit]);

  const onWidth = useLatest(onLineWidthChange);
  useEffect(() => {
    if (lineWidth !== undefined) onWidth.current?.(lineWidth);
  }, [lineWidth, onWidth]);

  const available = right - left;
  const overflowing = lineWidth !== undefined && lineWidth > available;
  const anchor = centerX ?? Math.trunc((left + right) / 2);
  const textTop = scrollingTextTop(top, bottom);

  useAnimationFrame(overflowing, () => {
    const element = lineRef.current;
    if (!element || lineWidth === undefined) return;
    const offset = scrollingTextOffset(lineWidth, available, performance.now());
    element.style.left = `${String(-offset * unit)}px`;
  });

  let lineLeft: string | undefined;
  if (lineWidth !== undefined && !overflowing) {
    lineLeft = `${String((centeredTextLeft(lineWidth, left, right, anchor) - left) * unit)}px`;
  }

  const boxStyle: CssVariables = {
    left: `${String(left * unit)}px`,
    width: `${String(available * unit)}px`,
    top: `${String(top * unit)}px`,
    height: `${String((bottom - top) * unit)}px`,
    ...style,
  };
  const lineStyle: CssVariables = {
    top: `${String((textTop - top) * unit)}px`,
  };
  if (lineLeft !== undefined) lineStyle.left = lineLeft;
  else if (!overflowing) {
    lineStyle.left = '50%';
    lineStyle.transform = 'translateX(-50%)';
  }

  return (
    <span
      {...rest}
      ref={ref}
      className={
        className === undefined ? 'cobble-scrolling-text' : `cobble-scrolling-text ${className}`
      }
      data-overflowing={overflowing ? '' : undefined}
      style={boxStyle}
    >
      <span ref={lineRef} className="cobble-scrolling-text-line" style={lineStyle}>
        {children}
      </span>
    </span>
  );
}
