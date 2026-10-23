import { mergeProps } from '@base-ui/react/merge-props';
import {
  useId,
  useState,
  type ElementType,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useElementState, useGuiSize, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { useSound } from '../../provider/hooks.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { ScrollingText } from '../../text/ScrollingText.tsx';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { capturePointer, cx, isSelectionKey, releasePointer } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `AbstractSliderButton.HANDLE_WIDTH`. */
export const SLIDER_HANDLE_WIDTH = 8;

export interface SliderSlotProps {
  readonly track?: SpriteSlotProps;
  readonly handle?: SpriteSlotProps;
  readonly label?: SlotProps<'span'>;
  /** Hidden input used for form submission (rendered when `name` is set). */
  readonly input?: SlotProps<'input'>;
}

export interface SliderOwnProps {
  readonly value?: number;
  readonly defaultValue?: number;
  /** Called continuously while the value changes. */
  readonly onValueChange?: (value: number) => void;
  /** Called when the user releases the slider or changes it with the keyboard. */
  readonly onValueCommitted?: (value: number) => void;
  /** Defaults to `0`. */
  readonly min?: number;
  /** Defaults to `100`. */
  readonly max?: number;
  /**
   * Distance between selectable values. Defaults to `1`, giving integer
   * values like `OptionInstance.IntRange`. Use `0` for a continuous slider.
   */
  readonly step?: number;
  /** Option name, shown as `"<label>: <value>"`. */
  readonly label?: ReactNode;
  /** Renders the whole label for a value. Overrides `label`. */
  readonly formatLabel?: (value: number) => ReactNode;
  /** Text for assistive technologies. Defaults to the value. */
  readonly getValueText?: (value: number) => string;
  readonly disabled?: boolean;
  /** Width in GUI units. Defaults to 150. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 20. */
  readonly height?: number;
  /** Name for form submission. */
  readonly name?: string;
  /** Sound played when the handle is released. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: SliderSlotProps;
}

export type SliderProps<E extends ElementType = 'div'> = PolymorphicProps<E, SliderOwnProps>;

interface Scale {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Number of selectable values when discrete. */
  readonly count: number;
}

function makeScale(min: number, max: number, step: number): Scale {
  const count = step > 0 ? Math.max(1, Math.floor((max - min) / step + 1e-9) + 1) : 0;
  return { min, max, step, count };
}

/** `SliderableValueSet.fromSliderValue`. */
export function sliderToValue(position: number, scale: Scale): number {
  if (scale.count === 0) return scale.min + position * (scale.max - scale.min);
  const clamped = position >= 1 ? 0.99999 : Math.max(0, position);
  const index = Math.min(scale.count - 1, Math.floor(clamped * scale.count));
  return roundToStep(scale.min + index * scale.step, scale.step);
}

/** `SliderableValueSet.toSliderValue`. */
export function valueToSlider(value: number, scale: Scale): number {
  if (scale.count === 0) {
    return scale.max === scale.min ? 0 : clamp01((value - scale.min) / (scale.max - scale.min));
  }
  const index = Math.round((value - scale.min) / scale.step);
  if (index <= 0) return 0;
  if (index >= scale.count - 1) return 1;
  return (index + 0.5) / scale.count;
}

function roundToStep(value: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number(value.toFixed(decimals));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** A vanilla slider (`AbstractSliderButton` / `OptionInstance.OptionInstanceSliderButton`). */
export function Slider<E extends ElementType = 'div'>(props: SliderProps<E>): JSX.Element {
  const {
    as,
    value: controlled,
    defaultValue,
    onValueChange,
    onValueCommitted,
    min = 0,
    max = 100,
    step = 1,
    label,
    formatLabel,
    getValueText,
    disabled = false,
    width = 150,
    height = 20,
    name,
    sound = 'ui.button.click',
    slotProps,
    ref,
    className,
    style,
    ...rest
  } = props as SliderProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const play = useSound();
  const scale = makeScale(min, max, step);

  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? min);
  const value = controlled ?? uncontrolled;
  const [position, setPosition] = useState(() => valueToSlider(value, scale));
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [canChangeValue, setCanChangeValue] = useState(false);

  const [element, setElement] = useElementState<HTMLElement>();
  const mergedRef = useMergedRefs<HTMLElement>(setElement, ref as Ref<HTMLElement>);
  const measured = useGuiSize(element, unit);
  const w = measured?.width ?? width;
  const h = measured?.height ?? height;

  // Follow external value changes when not dragging (`resetValue`), adjusting state during render.
  const [syncedValue, setSyncedValue] = useState(value);
  if (!dragging && value !== syncedValue) {
    setSyncedValue(value);
    if (sliderToValue(position, scale) !== value) setPosition(valueToSlider(value, scale));
  }

  const update = (nextPosition: number): number => {
    const clamped = clamp01(nextPosition);
    setPosition(clamped);
    const next = sliderToValue(clamped, scale);
    setSyncedValue(next);
    if (next !== value) {
      if (controlled === undefined) setUncontrolled(next);
      onValueChange?.(next);
    }
    return next;
  };

  const positionFromPointer = (event: PointerEvent<HTMLElement>): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / unit;
    return (mouseX - SLIDER_HANDLE_WIDTH / 2) / (w - SLIDER_HANDLE_WIDTH);
  };

  const handlers = {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch') setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;
      capturePointer(event.currentTarget, event.pointerId);
      event.currentTarget.focus();
      setDragging(true);
      update(positionFromPointer(event));
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (dragging) update(positionFromPointer(event));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!dragging) return;
      releasePointer(event.currentTarget, event.pointerId);
      setDragging(false);
      if (sound !== false) play(sound);
      const committed = sliderToValue(position, scale);
      setPosition(valueToSlider(committed, scale));
      onValueCommitted?.(committed);
    },
    onLostPointerCapture: () => setDragging(false),
    onFocus: () => {
      setFocused(true);
      setCanChangeValue(true);
    },
    onBlur: () => {
      setFocused(false);
      setCanChangeValue(false);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (isSelectionKey(event)) {
        event.preventDefault();
        setCanChangeValue((can) => !can);
        return;
      }
      if (!canChangeValue) return;
      let direction = 0;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') direction = -1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') direction = 1;
      let next: number | undefined;
      if (direction !== 0) {
        if (scale.count === 0) {
          next = update(position + direction / (w - SLIDER_HANDLE_WIDTH));
        } else {
          const target = Math.min(max, Math.max(min, value + direction * step));
          next = update(valueToSlider(target, scale));
        }
      } else if (event.key === 'Home') {
        next = update(0);
      } else if (event.key === 'End') {
        next = update(1);
      }
      if (next !== undefined) {
        event.preventDefault();
        onValueCommitted?.(next);
      }
    },
  };

  const trackHighlighted = !disabled && focused && !canChangeValue;
  const handleHighlighted = !disabled && (hovered || canChangeValue);
  const handleLeft = Math.trunc(position * (w - SLIDER_HANDLE_WIDTH));
  const labelId = useId();
  const labelContent = formatLabel ? (
    formatLabel(value)
  ) : label === undefined ? (
    value
  ) : (
    <>
      {label}: {value}
    </>
  );

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };

  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-slider', className),
          style: rootStyle,
          // A plain-text label names the slider; anything fancier is referenced by id. Callers can override.
          'aria-label': typeof label === 'string' ? label : undefined,
          'aria-labelledby': typeof label === 'string' ? undefined : labelId,
          ...handlers,
        },
        rest,
      )}
      ref={mergedRef}
      role="slider"
      tabIndex={disabled ? -1 : (rest.tabIndex ?? 0)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={getValueText ? getValueText(value) : undefined}
      aria-disabled={disabled || undefined}
      aria-orientation="horizontal"
      data-disabled={disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      data-hovered={hovered ? '' : undefined}
      data-focused={focused ? '' : undefined}
      data-editing={canChangeValue ? '' : undefined}
    >
      <Sprite
        {...slotProps?.track}
        className={cx('cobble-slider-track', slotProps?.track?.className)}
        sprite={trackHighlighted ? 'widget/slider_highlighted' : 'widget/slider'}
        width={w}
        height={h}
      />
      <Sprite
        {...slotProps?.handle}
        className={cx('cobble-slider-handle', slotProps?.handle?.className)}
        sprite={handleHighlighted ? 'widget/slider_handle_highlighted' : 'widget/slider_handle'}
        width={SLIDER_HANDLE_WIDTH}
        height={h}
        style={{ '--cobble-x': handleLeft, ...slotProps?.handle?.style } as CssVariables}
      />
      <ScrollingText
        {...slotProps?.label}
        id={labelId}
        className={cx('cobble-slider-label', 'cobble-text', slotProps?.label?.className)}
        data-shadow=""
        left={2}
        right={w - 2}
        top={0}
        bottom={h}
      >
        {labelContent}
      </ScrollingText>
      {name === undefined ? null : (
        <input {...slotProps?.input} type="hidden" name={name} value={String(value)} />
      )}
    </Component>
  );
}
