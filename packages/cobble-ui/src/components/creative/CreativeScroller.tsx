import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ElementType, type JSX, type KeyboardEvent, type PointerEvent } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { capturePointer, cx, hasPointer, placeAt, releasePointer } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Width of the creative scroller thumb. */
export const CREATIVE_SCROLLER_WIDTH = 12;
/** Height of the creative scroller thumb. */
export const CREATIVE_SCROLLER_THUMB_HEIGHT = 15;

function onPointerUp(event: PointerEvent<HTMLElement>): void {
  releasePointer(event.currentTarget, event.pointerId);
}

/** Thumb top for a `value` in `[0, 1]`: `(int)((trackHeight - 15) * value)`. */
export function creativeScrollerOffset(
  value: number,
  trackHeight: number,
  thumbHeight: number = CREATIVE_SCROLLER_THUMB_HEIGHT,
): number {
  const clamped = Math.min(Math.max(value, 0), 1);
  return Math.trunc((trackHeight - thumbHeight) * clamped);
}

/** Value for a pointer `offset` units down the track, centring the thumb on it. */
export function creativeScrollerValue(
  offset: number,
  trackHeight: number,
  thumbHeight: number = CREATIVE_SCROLLER_THUMB_HEIGHT,
): number {
  const range = trackHeight - thumbHeight;
  if (range <= 0) return 0;
  return Math.min(Math.max((offset - thumbHeight / 2) / range, 0), 1);
}

export interface CreativeScrollerSlotProps {
  readonly thumb?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
}

export interface CreativeScrollerOwnProps {
  readonly value?: number;
  readonly defaultValue?: number;
  readonly onValueChange?: (value: number) => void;
  /** Track height in GUI units. Defaults to 112. */
  readonly height?: number;
  /** Shows the greyed thumb and ignores input, like when everything fits. */
  readonly disabled?: boolean;
  /** Sprite of the thumb. Defaults to the creative inventory's. */
  readonly sprite?: string;
  /** Sprite of the greyed thumb. */
  readonly disabledSprite?: string;
  /** Thumb size in GUI units. Defaults to 12×15. */
  readonly thumbWidth?: number;
  readonly thumbHeight?: number;
  /** Step of the arrow keys, as a fraction of the track. Defaults to 0.1. */
  readonly step?: number;
  readonly slotProps?: CreativeScrollerSlotProps;
}

export type CreativeScrollerProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  CreativeScrollerOwnProps
>;

/**
 * The creative inventory scroll thumb (`container/creative_inventory/scroller`, 12×15)
 * on an invisible track, dragged with the pointer or moved with the arrow keys.
 */
export function CreativeScroller<E extends ElementType = 'div'>(
  props: CreativeScrollerProps<E>,
): JSX.Element {
  const {
    as,
    value,
    defaultValue = 0,
    onValueChange,
    height = 112,
    disabled = false,
    step = 0.1,
    sprite = 'container/creative_inventory/scroller',
    disabledSprite = 'container/creative_inventory/scroller_disabled',
    thumbWidth = CREATIVE_SCROLLER_WIDTH,
    thumbHeight = CREATIVE_SCROLLER_THUMB_HEIGHT,
    slotProps,
    className,
    style,
    ...rest
  } = props as CreativeScrollerProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = Math.min(Math.max(value ?? uncontrolled, 0), 1);

  const change = (next: number): void => {
    const clamped = Math.min(Math.max(next, 0), 1);
    if (value === undefined) setUncontrolled(clamped);
    if (clamped !== current) onValueChange?.(clamped);
  };
  const fromPointer = (event: PointerEvent<HTMLElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    change(creativeScrollerValue((event.clientY - rect.top) / unit, height, thumbHeight));
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    if (disabled || event.button !== 0) return;
    capturePointer(event.currentTarget, event.pointerId);
    fromPointer(event);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    if (hasPointer(event.currentTarget, event.pointerId)) fromPointer(event);
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') change(current + step);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') change(current - step);
    else if (event.key === 'Home') change(0);
    else if (event.key === 'End') change(1);
    else return;
    event.preventDefault();
  };

  const rootStyle: CssVariables = {
    '--cobble-width': thumbWidth,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-creative-scroller', className),
          style: rootStyle,
          role: 'scrollbar',
          'aria-orientation': 'vertical',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(current * 100),
          'aria-disabled': disabled || undefined,
          tabIndex: disabled ? -1 : 0,
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp,
          onKeyDown,
        },
        rest,
      )}
      data-disabled={disabled ? '' : undefined}
    >
      <Sprite
        {...slotProps?.thumb}
        sprite={disabled ? disabledSprite : sprite}
        width={thumbWidth}
        height={thumbHeight}
        style={placeAt(
          0,
          creativeScrollerOffset(current, height, thumbHeight),
          slotProps?.thumb?.style,
        )}
      />
    </Component>
  );
}
