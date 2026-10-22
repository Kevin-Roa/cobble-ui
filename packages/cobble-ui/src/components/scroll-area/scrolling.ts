/** `AbstractScrollArea.SCROLLBAR_WIDTH`. */
export const SCROLLBAR_WIDTH = 6;
const SCROLLBAR_MIN_HEIGHT = 32;

/** `AbstractScrollArea#scrollerHeight`. */
export function scrollerHeight(height: number, contentHeight: number): number {
  const size = Math.trunc((height * height) / contentHeight);
  return Math.min(Math.max(size, SCROLLBAR_MIN_HEIGHT), height - 8);
}

/** `AbstractScrollArea#scrollBarY`, relative to the top of the area. */
export function scrollerY(scroll: number, height: number, contentHeight: number): number {
  const max = Math.max(0, contentHeight - height);
  if (max === 0) return 0;
  return Math.max(
    0,
    Math.trunc((Math.trunc(scroll) * (height - scrollerHeight(height, contentHeight))) / max),
  );
}

/** Scroll distance per unit of mouse-drag on the scroller (`mouseDragged`). */
export function scrollerDragScale(height: number, contentHeight: number): number {
  const max = Math.max(1, contentHeight - height);
  return Math.max(1, max / (height - scrollerHeight(height, contentHeight)));
}

/**
 * Converts a wheel event into "notches" (`scrollY` in `mouseScrolled`). Most
 * mice report 100 pixels or 3 lines per notch.
 */
export function wheelNotches(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY / 3;
  if (event.deltaMode === 2) return event.deltaY;
  return event.deltaY / 100;
}
