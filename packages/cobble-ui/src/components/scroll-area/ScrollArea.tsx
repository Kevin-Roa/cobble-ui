import { mergeProps } from '@base-ui/react/merge-props';
import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type JSX,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useElementState, useGuiSize, useLatest, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { capturePointer, cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import {
  SCROLLBAR_WIDTH,
  scrollerDragScale,
  scrollerHeight,
  scrollerY,
  wheelNotches,
} from './scrolling.ts';

export interface ScrollAreaSlotProps {
  /** The scrolling element. */
  readonly viewport?: SlotProps<'div'>;
  /** The element wrapping the children. */
  readonly content?: SlotProps<'div'>;
  /** The scrollbar track. */
  readonly track?: SpriteSlotProps;
  /** The draggable scroller. */
  readonly thumb?: SpriteSlotProps;
}

export interface ScrollAreaOwnProps {
  readonly children?: ReactNode;
  /** GUI units scrolled per mouse-wheel notch. Defaults to 10. */
  readonly scrollRate?: number;
  /**
   * Horizontal position of the scrollbar in GUI units from the left edge.
   * Defaults to the right edge (`AbstractScrollArea#scrollBarX`).
   */
  readonly scrollbarX?: number;
  /** Extra elements rendered inside the root but outside the scrolling viewport. */
  readonly decorations?: ReactNode;
  readonly slotProps?: ScrollAreaSlotProps;
}

export type ScrollAreaProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ScrollAreaOwnProps
>;

/**
 * A vertically scrolling area with the game's scrollbar (`AbstractScrollArea`):
 * a 6-unit track, a scroller at least 32 units tall and mouse-wheel steps of
 * `scrollRate` units. Native scrolling (touch, keyboard, focus) keeps working.
 */
export function ScrollArea<E extends ElementType = 'div'>(props: ScrollAreaProps<E>): JSX.Element {
  const {
    as,
    children,
    scrollRate = 10,
    scrollbarX,
    decorations,
    slotProps,
    className,
    style,
    ...rest
  } = props as ScrollAreaProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [viewport, setViewport] = useElementState<HTMLDivElement>();
  const [content, setContent] = useElementState<HTMLDivElement>();
  const viewportElement = useRef<HTMLDivElement | null>(null);
  const viewportRef = useMergedRefs<HTMLDivElement>(
    setViewport,
    viewportElement,
    slotProps?.viewport?.ref as Ref<HTMLDivElement> | undefined,
  );
  const contentRef = useMergedRefs<HTMLDivElement>(
    setContent,
    slotProps?.content?.ref as Ref<HTMLDivElement> | undefined,
  );
  const viewportSize = useGuiSize(viewport, unit);
  const contentSize = useGuiSize(content, unit);
  const [scroll, setScroll] = useState(0);
  const [dragging, setDragging] = useState(false);

  const width = viewportSize?.width ?? 0;
  const height = viewportSize?.height ?? 0;
  const contentHeight = contentSize?.height ?? 0;
  const maxScroll = Math.max(0, contentHeight - height);
  const scrollable = maxScroll > 0;
  const thumbHeight = scrollable ? scrollerHeight(height, contentHeight) : 0;
  const thumbY = scrollerY(scroll, height, contentHeight);
  // Never let the bar hang outside the list, where a neighbouring element would cover (and steal pointer events from) it.
  const barX = Math.min(
    scrollbarX ?? width - SCROLLBAR_WIDTH,
    Math.max(width - SCROLLBAR_WIDTH, 0),
  );

  const latest = useLatest({ maxScroll, scrollRate, unit });

  useEffect(() => {
    if (!viewport) return undefined;
    const onWheel = (event: WheelEvent): void => {
      const state = latest.current;
      const notches = wheelNotches(event);
      if (notches === 0 || state.maxScroll === 0) return;
      const current = viewport.scrollTop / state.unit;
      const next = Math.min(state.maxScroll, Math.max(0, current + notches * state.scrollRate));
      if (next === current) return;
      event.preventDefault();
      viewport.scrollTop = next * state.unit;
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [viewport, latest]);

  const lastPointerY = useRef(0);
  const scrollTo = (value: number): void => {
    const element = viewportElement.current;
    if (element) element.scrollTop = Math.min(maxScroll, Math.max(0, value)) * unit;
  };
  const trackHandlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!scrollable || event.button !== 0) return;
      event.preventDefault();
      capturePointer(event.currentTarget, event.pointerId);
      lastPointerY.current = event.clientY;
      setDragging(true);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const element = viewportElement.current;
      if (!dragging || !element) return;
      const rect = element.getBoundingClientRect();
      if (event.clientY < rect.top) scrollTo(0);
      else if (event.clientY > rect.bottom) scrollTo(maxScroll);
      else {
        const dy = (event.clientY - lastPointerY.current) / unit;
        scrollTo(element.scrollTop / unit + dy * scrollerDragScale(height, contentHeight));
      }
      lastPointerY.current = event.clientY;
    },
    onPointerUp: () => setDragging(false),
    onLostPointerCapture: () => setDragging(false),
  };

  return (
    <Component
      {...mergeProps<'div'>({ className: cx('cobble-scroll-area', className), style }, rest)}
      data-scrollable={scrollable ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
    >
      <div
        {...mergeProps<'div'>(
          {
            className: 'cobble-scroll-area-viewport',
            onScroll: (event) => setScroll(event.currentTarget.scrollTop / unit),
          },
          slotProps?.viewport,
        )}
        ref={viewportRef}
      >
        <div
          {...mergeProps<'div'>({ className: 'cobble-scroll-area-content' }, slotProps?.content)}
          ref={contentRef}
        >
          {children}
        </div>
      </div>
      {decorations}
      {scrollable ? (
        <div
          className="cobble-scroll-area-scrollbar"
          style={{ '--cobble-x': barX, '--cobble-h': height } as CssVariables}
          {...trackHandlers}
        >
          <Sprite
            {...slotProps?.track}
            className={cx('cobble-scroll-area-track', slotProps?.track?.className)}
            sprite="widget/scroller_background"
            width={SCROLLBAR_WIDTH}
            height={height}
          />
          <Sprite
            {...slotProps?.thumb}
            className={cx('cobble-scroll-area-thumb', slotProps?.thumb?.className)}
            sprite="widget/scroller"
            width={SCROLLBAR_WIDTH}
            height={thumbHeight}
            style={{ '--cobble-y': thumbY, ...slotProps?.thumb?.style } as CssVariables}
          />
        </div>
      ) : null}
    </Component>
  );
}
