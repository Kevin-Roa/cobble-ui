import { useState, type ElementType, type JSX, type KeyboardEvent } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import {
  TextField,
  type TextFieldOwnProps,
  type TextFieldProps,
} from '../text-field/TextField.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** `ChatScreen`'s limit on a message (`SharedConstants.MAX_CHAT_LENGTH`). */
export const CHAT_MAX_LENGTH = 256;
/** `ChatComponent`'s history limit. */
export const CHAT_HISTORY_LIMIT = 100;

export interface ChatInputOwnProps extends Omit<
  TextFieldOwnProps,
  'value' | 'defaultValue' | 'onValueChange' | 'bordered' | 'height' | 'centered'
> {
  /** Called with the message when Enter is pressed on a non-empty line. */
  readonly onSubmit: (message: string) => void;
  /** Messages previously sent, oldest first, that Up and Down recall. Kept internally when omitted. */
  readonly history?: readonly string[];
}

export type ChatInputProps<E extends ElementType = 'div'> = PolymorphicProps<E, ChatInputOwnProps>;

/**
 * The chat line (`ChatScreen`): a borderless 12-unit text field on a half-transparent black bar. Enter sends,
 * and Up and Down walk through what was sent before (`ChatScreen#moveInHistory`). Messages are limited to 256
 * characters.
 */
export function ChatInput<E extends ElementType = 'div'>(props: ChatInputProps<E>): JSX.Element {
  const {
    onSubmit,
    history: externalHistory,
    maxLength = CHAT_MAX_LENGTH,
    width = 320 + 8,
    className,
    onKeyDown,
    ...rest
  } = props as ChatInputProps<'div'> & { readonly onKeyDown?: (event: KeyboardEvent) => void };
  const { tOr } = useTranslation();
  const [text, setText] = useState('');
  const [ownHistory, setOwnHistory] = useState<readonly string[]>([]);
  // Position in the history; one past the end means the line being typed.
  const [position, setPosition] = useState<number | null>(null);
  const history = externalHistory ?? ownHistory;
  const current = position ?? history.length;

  const move = (delta: number): void => {
    const next = Math.min(Math.max(current + delta, 0), history.length);
    if (next === current) return;
    setPosition(next);
    setText(history[next] ?? '');
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      const message = text.trim() === '' ? '' : text;
      if (message === '') return;
      onSubmit(message);
      if (externalHistory === undefined) {
        setOwnHistory((previous) =>
          previous.at(-1) === message
            ? previous
            : [...previous, message].slice(-CHAT_HISTORY_LIMIT),
        );
      }
      setText('');
      setPosition(null);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    }
  };

  return (
    <TextField
      {...(rest as Omit<TextFieldProps<'div'>, 'onKeyDown'>)}
      aria-label={tOr('cobble.chat.message', 'Chat message')}
      className={cx('cobble-chat-input', className)}
      bordered={false}
      height={12}
      width={width}
      maxLength={maxLength}
      value={text}
      onValueChange={(value) => {
        setText(value);
        setPosition(null);
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
