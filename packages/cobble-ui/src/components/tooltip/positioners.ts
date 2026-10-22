/** A rectangle in GUI units (`ScreenRectangle`). */
export interface GuiRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface TooltipPlacement {
  /** Position of the tooltip's text area (the box is drawn 12 units around it). */
  readonly x: number;
  readonly y: number;
}

function lerp(delta: number, start: number, end: number): number {
  return start + delta * (end - start);
}

/** Java's `Math.round(float)`. */
function javaRound(value: number): number {
  return Math.floor(value + 0.5);
}

function offset(mouseY: number, widgetY: number, widgetHeight: number): number {
  const distance = Math.min(Math.abs(mouseY - widgetY), widgetHeight);
  return javaRound(lerp(distance / widgetHeight, widgetHeight - 3, 5));
}

/** `MenuTooltipPositioner`: follows the mouse while hovering a widget. */
export function menuTooltipPosition(
  screenWidth: number,
  screenHeight: number,
  mouseX: number,
  mouseY: number,
  tooltipWidth: number,
  tooltipHeight: number,
  widget: GuiRect,
): TooltipPlacement {
  let x = mouseX + 12;
  if (x + tooltipWidth > screenWidth - 5) x = Math.max(mouseX - 12 - tooltipWidth, 9);
  let y = mouseY + 3;
  const paddedHeight = tooltipHeight + 3 + 3;
  const bottom = widget.top + widget.height;
  const lowestPossibleY = bottom + 3 + offset(0, 0, widget.height);
  const maxY = screenHeight - 5;
  if (lowestPossibleY + paddedHeight <= maxY) {
    y += offset(y, widget.top, widget.height);
  } else {
    y -= paddedHeight + offset(y, bottom, widget.height);
  }
  return { x, y };
}

/** `BelowOrAboveWidgetTooltipPositioner`: used when a widget is focused with the keyboard. */
export function belowOrAboveTooltipPosition(
  screenWidth: number,
  screenHeight: number,
  tooltipWidth: number,
  tooltipHeight: number,
  widget: GuiRect,
): TooltipPlacement {
  let x = widget.left + 3;
  let y = widget.top + widget.height + 3 + 1;
  if (y + tooltipHeight + 3 > screenHeight) y = widget.top - tooltipHeight - 3 - 1;
  if (x + tooltipWidth > screenWidth)
    x = Math.max(widget.left + widget.width - tooltipWidth - 3, 4);
  return { x, y };
}

/** `DefaultTooltipPositioner`: used for item tooltips. */
export function defaultTooltipPosition(
  screenWidth: number,
  screenHeight: number,
  mouseX: number,
  mouseY: number,
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPlacement {
  let x = mouseX + 12;
  let y = mouseY - 12;
  if (x + tooltipWidth > screenWidth) x = Math.max(x - 24 - tooltipWidth, 4);
  const paddedHeight = tooltipHeight + 3;
  if (y + paddedHeight > screenHeight) y = screenHeight - paddedHeight;
  return { x, y };
}
