import {
  useId,
  type ComponentPropsWithoutRef,
  type ElementType,
  type JSX,
  type ReactNode,
} from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Text } from '../../text/Text.tsx';
import { Button } from '../button/Button.tsx';
import { cx } from '../shared.ts';
import { useTranslation } from '../../i18n/Translation.tsx';

/** `KeyBindsList.KeyEntry`: the change button is 75 wide. */
export const KEYBIND_BUTTON_WIDTH = 75;
/** `KeyBindsList.KeyEntry`: the reset button is 50 wide. */
export const KEYBIND_RESET_WIDTH = 50;

export interface KeybindButtonOwnProps {
  /** Name of the bound key, e.g. "W" or "Left Shift". Pass "None" when unbound. */
  readonly keyLabel: ReactNode;
  /** Waiting for a key press: shows `> key <` in yellow (`KeyEntry#refreshEntry`). */
  readonly listening?: boolean;
  /** Another action uses the same key: shows `[ key ]` in red. */
  readonly conflict?: boolean;
  readonly disabled?: boolean;
  /** Width in GUI units. Defaults to 75. */
  readonly width?: number;
}

export type KeybindButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  KeybindButtonOwnProps
>;

/**
 * The key-change button of the controls screen (`KeyBindsList.KeyEntry#changeButton`). Controlled:
 * set `listening` while capturing a key and `conflict` when another action shares the key.
 */
export function KeybindButton<E extends ElementType = 'button'>(
  props: KeybindButtonProps<E>,
): JSX.Element {
  const {
    keyLabel,
    listening = false,
    conflict = false,
    width = KEYBIND_BUTTON_WIDTH,
    className,
    ...rest
  } = props as KeybindButtonOwnProps & Omit<ComponentPropsWithoutRef<'button'>, 'color'>;
  const label = listening ? (
    <Text color="yellow">
      {'> '}
      {keyLabel}
      {' <'}
    </Text>
  ) : conflict ? (
    <Text color="red">
      {'[ '}
      {keyLabel}
      {' ]'}
    </Text>
  ) : (
    keyLabel
  );
  return (
    <Button
      {...rest}
      width={width}
      className={cx('cobble-keybind-button', className)}
      aria-pressed={listening}
      data-listening={listening ? '' : undefined}
      data-conflict={conflict ? '' : undefined}
    >
      {label}
    </Button>
  );
}

export interface KeybindRowOwnProps {
  /** Action name (`KeyMapping#getName`), drawn left of the buttons. */
  readonly name: ReactNode;
  readonly keyLabel: ReactNode;
  readonly listening?: boolean;
  readonly conflict?: boolean;
  /** The binding equals its default; disables Reset (`KeyEntry#resetButton`). */
  readonly isDefault?: boolean;
  readonly onChange?: () => void;
  readonly onReset?: () => void;
  /** Label of the reset button. Defaults to "Reset". */
  readonly resetLabel?: string;
}

export type KeybindRowProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  KeybindRowOwnProps
>;

/** One controls-screen row (`KeyBindsList.KeyEntry`): name, key button and Reset. */
export function KeybindRow<E extends ElementType = 'div'>(props: KeybindRowProps<E>): JSX.Element {
  const {
    as,
    name,
    keyLabel,
    listening = false,
    conflict = false,
    isDefault = false,
    onChange,
    onReset,
    resetLabel: resetLabelProp,
    className,
    ...rest
  } = props as KeybindRowProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const id = useId();
  const { tOr } = useTranslation();
  const resetLabel = resetLabelProp ?? tOr('controls.reset', 'Reset');
  return (
    <Component {...rest} className={cx('cobble-keybind-row', className)}>
      <Text className="cobble-keybind-name" id={id}>
        {name}
      </Text>
      <KeybindButton
        keyLabel={keyLabel}
        listening={listening}
        conflict={conflict}
        aria-labelledby={id}
        {...(onChange === undefined ? {} : { onClick: onChange })}
      />
      <Button
        width={KEYBIND_RESET_WIDTH}
        disabled={isDefault}
        {...(onReset === undefined ? {} : { onClick: onReset })}
      >
        {resetLabel}
      </Button>
    </Component>
  );
}
