import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { mergeProps } from '@base-ui/react/merge-props';
import {
  useRef,
  useState,
  type ElementType,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useInteraction, useIsomorphicLayoutEffect } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { cx, useClickSound } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `Checkbox.getBoxSize`: one line of text (9) plus 8 padding. */
export const CHECKBOX_BOX_SIZE = 17;
/** `Checkbox.SPACING`. */
const SPACING = 4;
const LINE_HEIGHT = 9;

export interface CheckboxSlotProps {
  /** The focusable box (Base UI `Checkbox.Root`). */
  readonly box?: Omit<
    BaseCheckbox.Root.Props,
    'checked' | 'defaultChecked' | 'onCheckedChange' | 'disabled'
  >;
  /** The canvas the box sprite is drawn on. */
  readonly sprite?: SpriteSlotProps;
  /** The label text. */
  readonly label?: SlotProps<'span'>;
}

export interface CheckboxOwnProps {
  /** The label. */
  readonly children?: ReactNode;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: BaseCheckbox.Root.Props['onCheckedChange'];
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly name?: string;
  readonly value?: string;
  /** Wrap the label at this width (GUI units). At most two lines are shown, like the game. */
  readonly maxWidth?: number;
  /** Sound played when toggled, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: CheckboxSlotProps;
}

export type CheckboxProps<E extends ElementType = 'label'> = PolymorphicProps<E, CheckboxOwnProps>;

/** A vanilla checkbox (`net.minecraft.client.gui.components.Checkbox`). */
export function Checkbox<E extends ElementType = 'label'>(props: CheckboxProps<E>): JSX.Element {
  const {
    as,
    children,
    checked,
    defaultChecked,
    onCheckedChange,
    disabled = false,
    readOnly,
    required,
    name,
    value,
    maxWidth,
    sound = 'ui.button.click',
    slotProps,
    className,
    style,
    ...rest
  } = props as CheckboxProps<'label'>;
  const Component: ElementType = as ?? 'label';
  const { unit } = useCobble();
  const [interaction, interactionHandlers] = useInteraction(disabled);
  const clickSound = useClickSound(sound, disabled || readOnly === true);
  const [uncontrolled, setUncontrolled] = useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolled;

  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelHeight, setLabelHeight] = useState(LINE_HEIGHT);
  useIsomorphicLayoutEffect(() => {
    const element = labelRef.current;
    if (!element) return undefined;
    const measure = (): void => setLabelHeight(Math.round(element.offsetHeight / unit));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [unit]);

  const focused = interaction.focused;
  const sprite = isChecked
    ? focused
      ? 'widget/checkbox_selected_highlighted'
      : 'widget/checkbox_selected'
    : focused
      ? 'widget/checkbox_highlighted'
      : 'widget/checkbox';

  const rootStyle: CssVariables = {
    '--cobble-checkbox-label-top': Math.trunc(CHECKBOX_BOX_SIZE / 2) - Math.trunc(labelHeight / 2),
    ...style,
  };
  if (maxWidth !== undefined) rootStyle['--cobble-max-width'] = maxWidth;

  const rootProps: Record<string, unknown> = {
    disabled,
    onCheckedChange: (next: boolean, details: BaseCheckbox.Root.ChangeEventDetails) => {
      if (checked === undefined) setUncontrolled(next);
      onCheckedChange?.(next, details);
    },
    checked: isChecked,
  };
  if (readOnly !== undefined) rootProps['readOnly'] = readOnly;
  if (required !== undefined) rootProps['required'] = required;
  if (name !== undefined) rootProps['name'] = name;
  if (value !== undefined) rootProps['value'] = value;

  return (
    <Component
      {...mergeProps<'label'>(
        {
          className: cx('cobble-checkbox', className),
          style: rootStyle,
          onPointerEnter: interactionHandlers.onPointerEnter,
          onPointerLeave: interactionHandlers.onPointerLeave,
          onPointerDown: clickSound.onPointerDown,
        },
        rest,
      )}
      data-checked={isChecked ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-focused={focused ? '' : undefined}
      data-hovered={interaction.hovered ? '' : undefined}
    >
      <BaseCheckbox.Root
        {...mergeProps<'span'>(
          {
            className: 'cobble-checkbox-box',
            onFocus: interactionHandlers.onFocus,
            onBlur: interactionHandlers.onBlur,
            onKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => {
              clickSound.onKeyDown(event);
              // `AbstractButton#keyPressed` selects with Enter as well as Space; Base UI only
              // toggles on Space.
              if (event.key === 'Enter' && !event.defaultPrevented && !disabled && !readOnly) {
                event.preventDefault();
                event.currentTarget.click();
              }
            },
          },
          slotProps?.box as SlotProps<'span'> | undefined,
        )}
        {...(rootProps as BaseCheckbox.Root.Props)}
      >
        <Sprite
          {...slotProps?.sprite}
          className={cx('cobble-checkbox-sprite', slotProps?.sprite?.className)}
          sprite={sprite}
          width={CHECKBOX_BOX_SIZE}
          height={CHECKBOX_BOX_SIZE}
        />
      </BaseCheckbox.Root>
      {children === undefined ? null : (
        <span
          {...slotProps?.label}
          ref={labelRef}
          className={cx('cobble-checkbox-label', 'cobble-text', slotProps?.label?.className)}
          data-shadow=""
        >
          {children}
        </span>
      )}
    </Component>
  );
}

export { SPACING as CHECKBOX_SPACING };
