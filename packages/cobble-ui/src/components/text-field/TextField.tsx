import { mergeProps } from '@base-ui/react/merge-props';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ElementType,
  type JSX,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useElementState, useGuiSize, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { shadowColorFor } from '../../text/formatting.ts';
import {
  headByWidth,
  tailByWidth,
  textWidth,
  useCharWidth,
  type CharWidth,
} from '../../text/metrics.ts';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { capturePointer, cx, hasPointer } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `EditBox.DEFAULT_TEXT_COLOR`. */
export const TEXT_FIELD_COLOR = '#e0e0e0';
/** `EditBox.textColorUneditable`. */
export const TEXT_FIELD_UNEDITABLE_COLOR = '#707070';
/** `EditBox.DEFAULT_HINT_STYLE` (dark gray). */
export const TEXT_FIELD_HINT_COLOR = '#555555';
/** Color of command-style suggestions. */
export const TEXT_FIELD_SUGGESTION_COLOR = '#808080';
const CURSOR_BLINK_MS = 300;
const LINE_HEIGHT = 9;

export interface TextFieldSlotProps {
  readonly background?: SpriteSlotProps;
  /** The (visually hidden) native input that receives keyboard input. */
  readonly input?: SlotProps<'input'>;
  /** The element the visible text is drawn in. */
  readonly display?: SlotProps<'span'>;
}

export interface TextFieldOwnProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** Hint shown while empty and unfocused (`EditBox#setHint`). */
  readonly placeholder?: ReactNode;
  /** Grey completion shown after the cursor (`EditBox#setSuggestion`). */
  readonly suggestion?: string;
  /** Maximum length. Defaults to 32, like the game. */
  readonly maxLength?: number;
  readonly disabled?: boolean;
  /** Not editable: the text is drawn darker (`EditBox#setEditable(false)`). */
  readonly readOnly?: boolean;
  /** Draw the box. Defaults to `true`. */
  readonly bordered?: boolean;
  /** Centre the text horizontally. */
  readonly centered?: boolean;
  /** Text color. Defaults to `#e0e0e0`. */
  readonly textColor?: string;
  /** Draw the text shadow. Defaults to `true`. */
  readonly textShadow?: boolean;
  /** Width in GUI units. Defaults to 200. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 20. */
  readonly height?: number;
  readonly name?: string;
  readonly id?: string;
  readonly required?: boolean;
  readonly autoFocus?: boolean;
  readonly autoComplete?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly inputRef?: Ref<HTMLInputElement>;
  readonly slotProps?: TextFieldSlotProps;
}

export type TextFieldProps<E extends ElementType = 'div'> = PolymorphicProps<E, TextFieldOwnProps>;

interface EditState {
  readonly value: string;
  readonly cursor: number;
  readonly highlight: number;
  readonly displayPos: number;
}

/** `EditBox#scrollTo`. */
export function scrollTo(
  value: string,
  displayPos: number,
  pos: number,
  innerWidth: number,
  width: CharWidth,
): number {
  let display = Math.min(displayPos, value.length);
  const displayed = headByWidth(value.slice(display), innerWidth, width);
  const lastPos = displayed.length + display;
  if (pos === display) display -= tailByWidth(value, innerWidth, width).length;
  if (pos > lastPos) display += pos - lastPos;
  else if (pos <= display) display = pos;
  return Math.min(Math.max(display, 0), value.length);
}

function at(x: number, y: number): CssVariables {
  return { '--cobble-x': x, '--cobble-y': y };
}

interface Piece {
  readonly key: string;
  readonly text: string;
  readonly x: number;
  readonly color: string;
  readonly shadow: boolean;
}

/** A single-line text input that looks and scrolls exactly like `EditBox`. */
export function TextField<E extends ElementType = 'div'>(props: TextFieldProps<E>): JSX.Element {
  const {
    as,
    value: controlled,
    defaultValue = '',
    onValueChange,
    placeholder,
    suggestion,
    maxLength = 32,
    disabled = false,
    readOnly = false,
    bordered = true,
    centered = false,
    textColor = TEXT_FIELD_COLOR,
    textShadow = true,
    width = 200,
    height = 20,
    name,
    id,
    required,
    autoFocus,
    autoComplete,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    inputRef,
    slotProps,
    ref,
    className,
    style,
    ...rest
  } = props as TextFieldProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const charWidth = useCharWidth();
  const [element, setElement] = useElementState<HTMLElement>();
  const mergedRef = useMergedRefs<HTMLElement>(setElement, ref as Ref<HTMLElement>);
  const measured = useGuiSize(element, unit);
  const w = measured?.width ?? width;
  const h = measured?.height ?? height;
  const innerWidth = bordered ? w - 8 : w;

  const input = useRef<HTMLInputElement>(null);
  const mergedInputRef = useMergedRefs(input, inputRef, slotProps?.input?.ref);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const text = controlled ?? uncontrolled;
  const [edit, setEdit] = useState<EditState>({
    value: text,
    cursor: text.length,
    highlight: text.length,
    displayPos: 0,
  });
  // Mirrors `edit` synchronously so consecutive events see the latest state.
  const editRef = useRef(edit);
  const [focused, setFocused] = useState(false);
  const [blinkOn, setBlinkOn] = useState(true);
  const editable = !readOnly && !disabled;

  /** Reads the native input's selection and applies `EditBox` scrolling. */
  const sync = useCallback(() => {
    const el = input.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const backward = el.selectionDirection === 'backward';
    const cursor = backward ? start : end;
    const highlight = backward ? end : start;
    const previous = editRef.current;
    let displayPos = scrollTo(value, previous.displayPos, cursor, innerWidth, charWidth);
    if (highlight === cursor)
      displayPos = scrollTo(value, displayPos, cursor, innerWidth, charWidth);
    const next = { value, cursor, highlight, displayPos };
    if (
      next.value !== previous.value ||
      next.cursor !== previous.cursor ||
      next.highlight !== previous.highlight ||
      next.displayPos !== previous.displayPos
    ) {
      editRef.current = next;
      setEdit(next);
    }
  }, [charWidth, innerWidth]);

  // External value changes (and the initial value) behave like `setValue`: the cursor moves to the end.
  useEffect(() => {
    const el = input.current;
    if (!el || el.value === text) return;
    el.value = text;
    el.setSelectionRange(text.length, text.length);
    sync();
  }, [text, sync]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!focused) return undefined;
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      const elapsed = performance.now() - started;
      setBlinkOn(Math.floor(elapsed / CURSOR_BLINK_MS) % 2 === 0);
      timer = setTimeout(schedule, CURSOR_BLINK_MS - (elapsed % CURSOR_BLINK_MS));
    };
    timer = setTimeout(schedule, CURSOR_BLINK_MS);
    return () => clearTimeout(timer);
  }, [focused]);

  useEffect(() => {
    const onSelectionChange = (): void => {
      if (document.activeElement === input.current) sync();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [sync]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.currentTarget.value;
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
    sync();
  };

  // Mouse handling mirrors `EditBox#onClick` / `onDrag` instead of the native input's.
  const anchor = useRef<number | undefined>(undefined);
  const textX = (displayed: string): number =>
    centered ? Math.trunc((w - textWidth(displayed, charWidth)) / 2) : bordered ? 4 : 0;
  const positionAt = (event: PointerEvent<HTMLElement>): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    const state = editRef.current;
    const displayed = headByWidth(state.value.slice(state.displayPos), innerWidth, charWidth);
    const offset = Math.min(
      Math.floor((event.clientX - rect.left) / unit) - textX(displayed),
      innerWidth,
    );
    return (
      state.displayPos + headByWidth(state.value.slice(state.displayPos), offset, charWidth).length
    );
  };
  const select = (from: number, to: number): void => {
    const el = input.current;
    if (!el) return;
    if (to < from) el.setSelectionRange(to, from, 'backward');
    else el.setSelectionRange(from, to, 'forward');
    sync();
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const el = input.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const pos = positionAt(event);
    if (event.detail === 2) {
      const value = editRef.current.value;
      const before = value.lastIndexOf(' ', pos - 1) + 1;
      const afterSpace = value.indexOf(' ', pos);
      select(before, afterSpace === -1 ? value.length : afterSpace);
      anchor.current = undefined;
      return;
    }
    const start = event.shiftKey ? editRef.current.highlight : pos;
    anchor.current = start;
    select(start, pos);
    capturePointer(event.currentTarget, event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    if (anchor.current !== undefined && hasPointer(event.currentTarget, event.pointerId)) {
      select(anchor.current, positionAt(event));
    }
  };
  const onPointerUp = (): void => {
    anchor.current = undefined;
  };

  // Layout, following `EditBox#extractWidgetRenderState`.
  const { value, cursor, highlight, displayPos } = edit;
  const color = editable ? textColor : TEXT_FIELD_UNEDITABLE_COLOR;
  const displayed = headByWidth(value.slice(displayPos), innerWidth, charWidth);
  const x0 = textX(displayed);
  const y0 = bordered ? Math.trunc((h - 8) / 2) : 0;
  const relCursor = cursor - displayPos;
  const cursorOnScreen = relCursor >= 0 && relCursor <= displayed.length;
  const showCursor = focused && blinkOn && cursorOnScreen;
  const relHighlight = Math.min(Math.max(highlight - displayPos, 0), displayed.length);
  const pieces: Piece[] = [];
  let drawX = x0;
  if (displayed !== '') {
    const half = cursorOnScreen ? displayed.slice(0, relCursor) : displayed;
    pieces.push({ key: 'before', text: half, x: drawX, color, shadow: textShadow });
    drawX += textWidth(half, charWidth) + 1;
  }
  const insert = cursor < value.length || value.length >= maxLength;
  let cursorX = drawX;
  if (!cursorOnScreen) {
    cursorX = relCursor > 0 ? x0 + w : x0;
  } else if (insert) {
    cursorX = drawX - 1;
    drawX--;
  }
  if (displayed !== '' && cursorOnScreen && relCursor < displayed.length) {
    pieces.push({
      key: 'after',
      text: displayed.slice(relCursor),
      x: drawX,
      color,
      shadow: textShadow,
    });
  }
  const showHint = placeholder !== undefined && displayed === '' && !focused;
  if (!insert && suggestion !== undefined && suggestion !== '') {
    pieces.push({
      key: 'suggestion',
      text: suggestion,
      x: cursorX - 1,
      color: TEXT_FIELD_SUGGESTION_COLOR,
      shadow: textShadow,
    });
  }
  let selection: { readonly left: number; readonly right: number } | undefined;
  if (relHighlight !== relCursor) {
    const highlightX = x0 + textWidth(displayed.slice(0, relHighlight), charWidth);
    const a = Math.min(cursorX, w);
    const b = Math.min(highlightX - 1, w);
    selection = { left: Math.min(a, b), right: Math.max(a, b) };
  }
  if (showCursor && !insert) {
    pieces.push({ key: 'cursor', text: '_', x: cursorX, color, shadow: textShadow });
  }

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };

  // The pointer handlers only read `editRef` when they are called, never during render.
  /* oxlint-disable react/refs */
  const rootProps = mergeProps<'div'>(
    {
      className: cx('cobble-text-field', className),
      style: rootStyle,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    rest,
  );
  /* oxlint-enable react/refs */

  return (
    <Component
      {...rootProps}
      ref={mergedRef}
      data-focused={focused ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      data-bordered={bordered ? '' : undefined}
    >
      {bordered ? (
        <Sprite
          {...slotProps?.background}
          className={cx('cobble-text-field-background', slotProps?.background?.className)}
          sprite={focused ? 'widget/text_field_highlighted' : 'widget/text_field'}
          width={w}
          height={h}
        />
      ) : null}
      <input
        {...slotProps?.input}
        ref={mergedInputRef}
        className={cx('cobble-text-field-input', slotProps?.input?.className)}
        type="text"
        defaultValue={text}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        name={name}
        id={id}
        required={required}
        // Only set when the consumer explicitly asks for it.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        autoComplete={autoComplete ?? 'off'}
        spellCheck={false}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-placeholder={typeof placeholder === 'string' ? placeholder : undefined}
        onChange={(event) => {
          handleChange(event);
          slotProps?.input?.onChange?.(event);
        }}
        onSelect={(event) => {
          sync();
          slotProps?.input?.onSelect?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          setBlinkOn(true);
          sync();
          slotProps?.input?.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          slotProps?.input?.onBlur?.(event);
        }}
      />
      <span
        aria-hidden
        {...slotProps?.display}
        className={cx('cobble-text-field-display', slotProps?.display?.className)}
      >
        {selection ? (
          <span
            className="cobble-text-field-selection"
            style={
              {
                ...at(selection.left, y0 - 1),
                '--cobble-w': selection.right - selection.left,
                '--cobble-h': LINE_HEIGHT + 2,
              } as CssVariables
            }
          />
        ) : null}
        {showCursor && insert ? (
          <span
            className="cobble-text-field-cursor"
            style={{ ...at(cursorX, y0 - 1), '--cobble-cursor-color': color } as CssVariables}
          />
        ) : null}
        {showHint ? (
          <span
            className="cobble-text cobble-text-field-hint"
            data-shadow=""
            style={
              {
                ...at(drawX, y0),
                '--cobble-text-color': TEXT_FIELD_HINT_COLOR,
                '--cobble-text-shadow-color': shadowColorFor(TEXT_FIELD_HINT_COLOR),
              } as CssVariables
            }
          >
            {placeholder}
          </span>
        ) : null}
        {pieces.map((piece) => (
          <span
            key={piece.key}
            className="cobble-text cobble-text-field-text"
            data-shadow={piece.shadow ? '' : undefined}
            data-part={piece.key}
            style={
              {
                ...at(piece.x, y0),
                '--cobble-text-color': piece.color,
                '--cobble-text-shadow-color': shadowColorFor(piece.color),
              } as CssVariables
            }
          >
            {piece.text}
          </span>
        ))}
      </span>
    </Component>
  );
}
