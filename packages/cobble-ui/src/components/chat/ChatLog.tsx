import { mergeProps } from '@base-ui/react/merge-props';
import {
  useEffect,
  useState,
  type ElementType,
  type JSX,
  type ReactNode,
  type WheelEvent,
} from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { useTranslation } from '../../i18n/Translation.tsx';

/** `ChatComponent.getWidth(1.0)`: the default chat width in GUI units. */
export const CHAT_WIDTH = 320;
/** `ChatComponent#getLineHeight` at the default line spacing. */
export const CHAT_LINE_HEIGHT = 9;
/** Lines shown while chat is closed (`chat_height_unfocused` 0.4375) and while it is open (`chat_height_focused` 1.0). */
export const CHAT_LINES_CLOSED = 10;
export const CHAT_LINES_OPEN = 20;
/** Ticks a message stays on screen while chat is closed (`ChatComponent`: 200 ticks, 10 seconds). */
export const CHAT_FADE_TICKS = 200;
/** Milliseconds per game tick. */
const TICK_MS = 50;

/**
 * How visible a message is `ageMs` after it arrived while chat is closed: it stays fully visible, then fades
 * over its last tenth: `clamp((1 - age / 200) * 10, 0, 1)²` with the age in ticks (`ChatComponent#getTimeFactor`).
 */
export function chatMessageOpacity(ageMs: number): number {
  const ticks = Math.max(ageMs, 0) / TICK_MS;
  const factor = Math.min(Math.max((1 - ticks / CHAT_FADE_TICKS) * 10, 0), 1);
  return factor * factor;
}

export interface ChatMessage {
  readonly id: string | number;
  /** The message, plain or formatted (a `FormattedText`, for instance). */
  readonly content: ReactNode;
  /** When it arrived, in milliseconds since the epoch (`Date.now()`). */
  readonly timestamp: number;
}

export interface ChatLogOwnProps {
  readonly messages: readonly ChatMessage[];
  /** Chat is open: every message is fully visible and more lines fit. */
  readonly open?: boolean;
  /** Width of the log in GUI units. Defaults to 320. */
  readonly width?: number;
  /** The current time in milliseconds. Defaults to a clock that ticks while messages are fading. */
  readonly now?: number;
}

export type ChatLogProps<E extends ElementType = 'div'> = PolymorphicProps<E, ChatLogOwnProps>;

/** A clock that ticks every game tick while `active`, and reads `undefined` until its first tick. */
function useClock(active: boolean): number | undefined {
  const [now, setNow] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!active) return undefined;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [active]);
  return now;
}

/**
 * The chat window (`ChatComponent`): up to 10 lines while closed, each message fading out after about 10 seconds,
 * or 20 lines all fully visible while open (scroll with the mouse wheel; Shift scrolls seven lines at a time).
 * Each line sits on a half-transparent black row that reaches 4 units past the text on both sides. Newest at the
 * bottom. The wheel step is an approximation of the game's.
 */
export function ChatLog<E extends ElementType = 'div'>(props: ChatLogProps<E>): JSX.Element {
  const {
    as,
    messages,
    open = false,
    width = CHAT_WIDTH,
    now: nowProp,
    className,
    style,
    ...rest
  } = props as ChatLogProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { tOr } = useTranslation();
  const [scroll, setScroll] = useState(0);
  const lines = open ? CHAT_LINES_OPEN : CHAT_LINES_CLOSED;

  // Only keep a clock running while something is still fading.
  const clock = useClock(nowProp === undefined && !open && messages.length > 0);
  const now = nowProp ?? clock;
  const visible = open
    ? messages
    : messages.filter(
        (message) => now === undefined || chatMessageOpacity(now - message.timestamp) > 0,
      );

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': lines * CHAT_LINE_HEIGHT,
    '--cobble-scroll': open ? scroll : 0,
    ...style,
  };
  const onWheel = (event: WheelEvent): void => {
    if (!open) return;
    const step = event.shiftKey ? 7 : 1;
    const direction = event.deltaY < 0 ? 1 : event.deltaY > 0 ? -1 : 0;
    setScroll((current) =>
      Math.min(Math.max(current + direction * step, 0), Math.max(messages.length - 1, 0)),
    );
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-chat-log', className),
          style: rootStyle,
          role: 'log',
          'aria-label': tOr('cobble.chat.log', 'Chat'),
          'aria-live': 'polite',
          onWheel,
        },
        rest,
      )}
      data-open={open ? '' : undefined}
      data-captures-wheel={open ? '' : undefined}
    >
      <div className="cobble-chat-log-lines">
        {visible.map((message) => (
          <div
            key={message.id}
            className="cobble-chat-line cobble-text"
            data-shadow=""
            style={
              {
                '--cobble-chat-opacity':
                  open || now === undefined ? 1 : chatMessageOpacity(now - message.timestamp),
              } as CssVariables
            }
          >
            {message.content}
          </div>
        ))}
      </div>
    </Component>
  );
}
