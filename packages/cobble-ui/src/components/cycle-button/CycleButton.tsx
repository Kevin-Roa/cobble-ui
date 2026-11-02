import { useState, type ElementType, type JSX, type MouseEvent, type ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Button, type ButtonOwnProps } from '../button/Button.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

export interface CycleButtonOwnProps<T> extends Omit<ButtonOwnProps, 'children'> {
  /** The values to cycle through, in order. */
  readonly values: readonly T[];
  readonly value?: T;
  readonly defaultValue?: T;
  readonly onValueChange?: (value: T) => void;
  /** Option name, shown as `"<label>: <value>"`. Omit to show only the value. */
  readonly label?: ReactNode;
  /** Formats a value for display. Defaults to `String(value)`. */
  readonly formatValue?: (value: T) => ReactNode;
}

export type CycleButtonProps<T, E extends ElementType = 'button'> = PolymorphicProps<
  E,
  CycleButtonOwnProps<T>
>;

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * A button that steps through a list of values when pressed, and backwards
 * when shift-clicked (`net.minecraft.client.gui.components.CycleButton`).
 */
export function CycleButton<T, E extends ElementType = 'button'>(
  props: CycleButtonProps<T, E>,
): JSX.Element {
  const {
    values,
    value: controlled,
    defaultValue,
    onValueChange,
    label,
    formatValue = String,
    onClick,
    ...rest
  } = props as CycleButtonProps<T, 'button'>;
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue ?? values[0]);
  const current = controlled ?? uncontrolled;

  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    onClick?.(event);
    if (event.defaultPrevented || values.length === 0) return;
    const index = current === undefined ? -1 : values.indexOf(current);
    const next = values[positiveModulo(index + (event.shiftKey ? -1 : 1), values.length)];
    if (next === undefined) return;
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const formatted = current === undefined ? null : formatValue(current);
  return (
    <Button {...rest} onClick={handleClick}>
      {label === undefined ? (
        formatted
      ) : (
        <>
          {label}: {formatted}
        </>
      )}
    </Button>
  );
}

export interface ToggleButtonOwnProps extends Omit<ButtonOwnProps, 'children'> {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  /** Option name, shown as `"<label>: ON"`. */
  readonly label?: ReactNode;
  /** Text for `true`. Defaults to `"ON"`. */
  readonly onText?: ReactNode;
  /** Text for `false`. Defaults to `"OFF"`. */
  readonly offText?: ReactNode;
}

export type ToggleButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  ToggleButtonOwnProps
>;

const BOOLEAN_VALUES: readonly boolean[] = [true, false];

/** An ON/OFF option button (`CycleButton.onOffBuilder`). */
export function ToggleButton<E extends ElementType = 'button'>(
  props: ToggleButtonProps<E>,
): JSX.Element {
  const {
    checked,
    defaultChecked = false,
    onCheckedChange,
    onText: onTextProp,
    offText: offTextProp,
    // The native `value`/`defaultValue` attributes make no sense on a toggle.
    value: _value,
    defaultValue: _defaultValue,
    ...rest
  } = props as ToggleButtonProps<'button'>;
  const { tOr } = useTranslation();
  const onText = onTextProp ?? tOr('options.on', 'ON');
  const offText = offTextProp ?? tOr('options.off', 'OFF');
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const value = checked ?? uncontrolled;
  return (
    <CycleButton<boolean>
      {...rest}
      aria-pressed={value}
      values={BOOLEAN_VALUES}
      value={value}
      onValueChange={(next) => {
        if (checked === undefined) setUncontrolled(next);
        onCheckedChange?.(next);
      }}
      formatValue={(v) => (v ? onText : offText)}
    />
  );
}
