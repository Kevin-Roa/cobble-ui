import { mergeProps } from '@base-ui/react/merge-props';
import { useRef, useState, type ElementType, type JSX, type ReactNode } from 'react';
import { useAnimationFrame, useIsomorphicLayoutEffect } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';

/** `SplashManager.DEFAULT_STYLE` color. */
export const SPLASH_COLOR = '#ffff00';

/** `SplashRenderer`'s pulsing scale for a line `textWidth` units wide at `timeMs`. */
export function splashScale(textWidth: number, timeMs: number): number {
  const phase = 1.8 - Math.abs(Math.sin(((timeMs % 1000) / 1000) * Math.PI * 2) * 0.1);
  return (phase * 100) / (textWidth + 32);
}

export interface SplashTextOwnProps {
  readonly children?: ReactNode;
}

export type SplashTextProps<E extends ElementType = 'span'> = PolymorphicProps<
  E,
  SplashTextOwnProps
>;

/**
 * The yellow, pulsing, tilted splash text of the title screen. Positioned
 * like `SplashRenderer`: 123 units right of the centre and 69 units down,
 * relative to its positioned container (normally a `Screen`).
 */
export function SplashText<E extends ElementType = 'span'>(props: SplashTextProps<E>): JSX.Element {
  const { as, children, className, style, ...rest } = props as SplashTextProps<'span'>;
  const Component: ElementType = as ?? 'span';
  const { unit } = useCobble();
  const line = useRef<HTMLSpanElement>(null);
  const pose = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const element = line.current;
    if (!element) return undefined;
    const measure = (): void => setWidth(Math.round(element.offsetWidth / unit));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [unit]);

  useAnimationFrame(true, (time) => {
    if (pose.current)
      pose.current.style.setProperty('--cobble-splash-scale', String(splashScale(width, time)));
  });

  return (
    <Component {...mergeProps<'span'>({ className: cx('cobble-splash', className), style }, rest)}>
      <span
        ref={pose}
        className="cobble-splash-pose"
        style={{ '--cobble-splash-scale': splashScale(width, 0) } as CssVariables}
      >
        <span
          ref={line}
          className="cobble-text cobble-splash-text"
          data-shadow=""
          style={{ '--cobble-x': -Math.trunc(width / 2) } as CssVariables}
        >
          {children}
        </span>
      </span>
    </Component>
  );
}
