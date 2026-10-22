import { useCallback, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { CssVariables } from '../internal/polymorphic.ts';
import { useSound } from '../provider/hooks.ts';
import type { UiSoundEvent } from '../sound/sounds.ts';

/**
 * Sprites for each widget state, like `net.minecraft.client.gui.components.WidgetSprites`.
 * Missing states fall back to `enabled`.
 */
export interface WidgetSprites {
  readonly enabled: string;
  readonly disabled?: string;
  readonly enabledFocused?: string;
  readonly disabledFocused?: string;
}

/** `WidgetSprites#get(enabled, focused)`. */
export function pickSprite(sprites: WidgetSprites, enabled: boolean, focused: boolean): string {
  if (enabled) return focused ? (sprites.enabledFocused ?? sprites.enabled) : sprites.enabled;
  return focused
    ? (sprites.disabledFocused ?? sprites.disabled ?? sprites.enabled)
    : (sprites.disabled ?? sprites.enabled);
}

export const BUTTON_SPRITES: WidgetSprites = {
  enabled: 'widget/button',
  disabled: 'widget/button_disabled',
  enabledFocused: 'widget/button_highlighted',
};

/** Text color of inactive widgets (`AbstractWidget.WithInactiveMessage`). */
export const INACTIVE_TEXT_COLOR = '#a0a0a0';

/** Whether a key "selects" a widget (`KeyEvent#isSelection`: Enter, Space, keypad Enter). */
export function isSelectionKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Plays the widget click sound the way the game does: when the primary
 * mouse button goes *down* on the widget, or when it is activated with a key.
 */
export function useClickSound(
  sound: UiSoundEvent | false,
  disabled: boolean,
): {
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
} {
  const play = useSound();
  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!disabled && sound !== false && event.button === 0) play(sound);
    },
    [disabled, play, sound],
  );
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!disabled && sound !== false && !event.repeat && isSelectionKey(event)) play(sound);
    },
    [disabled, play, sound],
  );
  return { onPointerDown, onKeyDown };
}

/** `setPointerCapture`, tolerating environments that do not implement it. */
export function capturePointer(element: Element, pointerId: number): void {
  if (typeof element.setPointerCapture === 'function') element.setPointerCapture(pointerId);
}

/** `releasePointerCapture`, tolerating environments that do not implement it. */
export function releasePointer(element: Element, pointerId: number): void {
  if (typeof element.releasePointerCapture === 'function' && element.hasPointerCapture(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

/** `hasPointerCapture`, tolerating environments that do not implement it. */
export function hasPointer(element: Element, pointerId: number): boolean {
  return typeof element.hasPointerCapture === 'function' && element.hasPointerCapture(pointerId);
}

/** Joins class names, skipping empty ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

/** `calc(n * unit)` in CSS pixels. */
export function px(units: number, unit: number): string {
  return `${String(units * unit)}px`;
}

/** Inline style that places an absolutely positioned element at GUI-unit `(x, y)`. */
export function placeAt(x: number, y: number, extra?: CSSProperties): CssVariables {
  return { '--cobble-x': x, '--cobble-y': y, ...extra };
}
