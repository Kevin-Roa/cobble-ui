import {
  useCallback,
  useLayoutEffect as useReactLayoutEffect,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
  type Ref,
  type RefCallback,
} from 'react';

/** `useLayoutEffect` that does not warn during server rendering. */
export const useIsomorphicLayoutEffect: typeof useReactLayoutEffect =
  typeof window === 'undefined' ? useEffect : useReactLayoutEffect;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : undefined;
  }
  if (ref) ref.current = value;
  return undefined;
}

/** Keeps a ref pointing at the latest value, updated after every render. */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Combines several refs into one callback ref whose identity only changes with the refs. */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  // oxlint-disable-next-line react/exhaustive-deps -- the refs themselves are the dependencies
  return useCallback((value: T | null) => {
    const cleanups = refs.map((ref) => assignRef(ref, value));
    return () => {
      refs.forEach((ref, i) => {
        const cleanup = cleanups[i];
        if (cleanup) cleanup();
        else assignRef(ref, null);
      });
    };
    // oxlint-disable-next-line react/exhaustive-deps
  }, refs);
}

export interface GuiSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Measures an element's border box in GUI units (rounded to whole units).
 * Returns `undefined` until measured, or while the element has no size.
 */
export function useGuiSize(element: Element | null, unit: number): GuiSize | undefined {
  const [size, setSize] = useState<GuiSize | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    if (!element) return undefined;
    const update = (cssWidth: number, cssHeight: number): void => {
      // A zero-sized box (hidden, or not laid out) is treated as "not measured".
      if (cssWidth === 0 && cssHeight === 0) {
        setSize(undefined);
        return;
      }
      const width = Math.max(0, Math.round(cssWidth / unit));
      const height = Math.max(0, Math.round(cssHeight / unit));
      setSize((previous) =>
        previous?.width === width && previous.height === height ? previous : { width, height },
      );
    };
    if (element instanceof HTMLElement) {
      update(element.offsetWidth, element.offsetHeight);
    } else {
      const rect = element.getBoundingClientRect();
      update(rect.width, rect.height);
    }
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0];
      if (box) update(box.inlineSize, box.blockSize);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, unit]);

  return size;
}

export interface InteractionState {
  readonly hovered: boolean;
  readonly focused: boolean;
}

export interface InteractionHandlers {
  readonly onPointerEnter: (event: PointerEvent) => void;
  readonly onPointerLeave: (event: PointerEvent) => void;
  readonly onFocus: (event: FocusEvent) => void;
  readonly onBlur: (event: FocusEvent) => void;
}

/**
 * Tracks the game's notion of "hovered" (a mouse is over the widget) and
 * "focused" (the widget has focus, including after being clicked).
 */
export function useInteraction(disabled = false): [InteractionState, InteractionHandlers] {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const handlers = useMemo<InteractionHandlers>(
    () => ({
      onPointerEnter: (event) => {
        if (event.pointerType !== 'touch') setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    }),
    [],
  );
  return [{ hovered: hovered && !disabled, focused: focused && !disabled }, handlers];
}

/** Calls `callback` on every animation frame while `active`. */
export function useAnimationFrame(active: boolean, callback: (time: number) => void): void {
  const latest = useLatest(callback);
  useEffect(() => {
    if (!active || typeof requestAnimationFrame === 'undefined') return undefined;
    let frame = requestAnimationFrame(function tick(time) {
      latest.current(time);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, latest]);
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return () => undefined;
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/** Whether the user asked their system to reduce motion (`prefers-reduced-motion: reduce`). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

/** Returns a value and a callback ref that stores the element in state. */
export function useElementState<T extends Element>(): [T | null, RefCallback<T>] {
  const [element, setElement] = useState<T | null>(null);
  return [element, setElement];
}
