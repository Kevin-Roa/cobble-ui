import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ChangeEvent, type ElementType, type JSX, type Ref } from 'react';
import { useElementState, useGuiSize, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { TEXT_FIELD_COLOR, TEXT_FIELD_HINT_COLOR } from './TextField.tsx';

/** Padding between the box edge and the text (`AbstractTextAreaWidget#innerPadding`). */
export const TEXT_AREA_PADDING = 4;

export interface TextAreaSlotProps {
  readonly background?: SpriteSlotProps;
  /** The native `<textarea>`. */
  readonly input?: SlotProps<'textarea'>;
  /** The "length/limit" counter shown under the box when `maxLength` is set. */
  readonly counter?: SlotProps<'span'>;
}

export interface TextAreaOwnProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** Hint shown while empty (`MultiLineEditBox` placeholder). */
  readonly placeholder?: string;
  /** Maximum length. A `length/limit` counter is shown under the box. Unlimited by default. */
  readonly maxLength?: number;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  /** Width in GUI units. Defaults to 200. */
  readonly width?: number;
  /** Height in GUI units. Defaults to 60. */
  readonly height?: number;
  readonly name?: string;
  readonly id?: string;
  readonly required?: boolean;
  readonly autoFocus?: boolean;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly inputRef?: Ref<HTMLTextAreaElement>;
  readonly slotProps?: TextAreaSlotProps;
}

export type TextAreaProps<E extends ElementType = 'div'> = PolymorphicProps<E, TextAreaOwnProps>;

/**
 * A multi-line text box styled like `MultiLineEditBox`: the text field
 * background, 4 units of padding, 9-unit lines in `#e0e0e0` wrapped to the box,
 * and vertical scrolling.
 *
 * Unlike {@link TextField}, the text is the browser's own `<textarea>` content
 * rather than hand-drawn, so the caret and selection use native rendering
 * (recolored to match) instead of the game's blinking underscore.
 */
export function TextArea<E extends ElementType = 'div'>(props: TextAreaProps<E>): JSX.Element {
  const {
    as,
    value,
    defaultValue = '',
    onValueChange,
    placeholder,
    maxLength,
    disabled = false,
    readOnly = false,
    width = 200,
    height = 60,
    name,
    id,
    required,
    autoFocus,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    inputRef,
    slotProps,
    ref,
    className,
    style,
    ...rest
  } = props as TextAreaProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [element, setElement] = useElementState<HTMLElement>();
  const mergedRef = useMergedRefs<HTMLElement>(setElement, ref as Ref<HTMLElement>);
  const measured = useGuiSize(element, unit);
  const w = measured?.width ?? width;
  const h = measured?.height ?? height;
  const mergedInputRef = useMergedRefs(inputRef, slotProps?.input?.ref);
  const [focused, setFocused] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const text = value ?? uncontrolled;

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    '--cobble-text-color': TEXT_FIELD_COLOR,
    '--cobble-hint-color': TEXT_FIELD_HINT_COLOR,
    ...style,
  };

  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-text-area', className), style: rootStyle },
        rest,
      )}
      ref={mergedRef}
      data-focused={focused ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        className={cx('cobble-text-field-background', slotProps?.background?.className)}
        sprite={focused ? 'widget/text_field_highlighted' : 'widget/text_field'}
        width={w}
        height={h}
      />
      <textarea
        {...slotProps?.input}
        ref={mergedInputRef}
        className={cx('cobble-text-area-input', 'cobble-text', slotProps?.input?.className)}
        data-shadow=""
        value={text}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        name={name}
        id={id}
        required={required}
        // Only set when the consumer explicitly asks for it.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        placeholder={placeholder}
        spellCheck={false}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          const next = event.currentTarget.value;
          if (value === undefined) setUncontrolled(next);
          onValueChange?.(next);
          slotProps?.input?.onChange?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          slotProps?.input?.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          slotProps?.input?.onBlur?.(event);
        }}
      />
      {maxLength === undefined ? null : (
        <span
          {...slotProps?.counter}
          className={cx('cobble-text-area-counter', 'cobble-text', slotProps?.counter?.className)}
          data-shadow=""
        >
          {`${String(text.length)}/${String(maxLength)}`}
        </span>
      )}
    </Component>
  );
}
