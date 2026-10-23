import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `SystemToast`'s default width. */
export const TOAST_WIDTH = 160;

/** `SystemToast#height`: `20 + max(lines, 1) * 12`. */
export function toastHeight(messageLines: number): number {
  return 20 + Math.max(messageLines, 1) * 12;
}

/** Which toast background to draw. */
export type ToastVariant =
  | 'system'
  | 'tutorial'
  | 'now_playing'
  | 'advancement'
  | 'recipe'
  | 'friends';

const TOAST_SPRITES: Record<ToastVariant, SpriteId> = {
  system: 'toast/system',
  tutorial: 'toast/tutorial',
  now_playing: 'toast/now_playing',
  advancement: 'toast/advancement',
  recipe: 'toast/recipe',
  friends: 'friends/toast_background',
};

export interface ToastSlotProps {
  readonly sprite?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  readonly title?: SlotProps<'span'>;
  readonly message?: SlotProps<'span'>;
}

export interface ToastOwnProps {
  readonly title: ReactNode;
  /**
   * The background. Only the background changes: the text keeps the system toast's layout, so
   * the advancement and recipe toasts do not get their icon or the game's text placement.
   */
  readonly variant?: ToastVariant;
  /** Message lines under the title, one per line. */
  readonly messages?: readonly ReactNode[];
  /** Width in GUI units. Defaults to 160. */
  readonly width?: number;
  /** Whether the toast is slid in. Slides in and out over 600 ms (`Toast.SLIDE_ANIMATION_DURATION_MS`). */
  readonly open?: boolean;
  readonly slotProps?: ToastSlotProps;
}

export type ToastProps<E extends ElementType = 'div'> = PolymorphicProps<E, ToastOwnProps>;

/**
 * A system toast (`SystemToast`): the `toast/system` background with a yellow
 * title and white message lines, none of them shadowed. Position it yourself;
 * in the game toasts stack down the right edge of the screen.
 */
export function Toast<E extends ElementType = 'div'>(props: ToastProps<E>): JSX.Element {
  const {
    as,
    title,
    variant = 'system',
    messages = [],
    width = TOAST_WIDTH,
    open = true,
    slotProps,
    className,
    style,
    ...rest
  } = props as ToastProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const height = toastHeight(messages.length);
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-toast', className),
          style: rootStyle,
          role: 'status',
        },
        rest,
      )}
      data-open={open ? '' : undefined}
    >
      <Sprite
        {...slotProps?.sprite}
        sprite={TOAST_SPRITES[variant]}
        width={width}
        height={height}
      />
      <span
        {...slotProps?.title}
        className={cx('cobble-toast-title', 'cobble-text', slotProps?.title?.className)}
        style={placeAt(18, messages.length === 0 ? 12 : 7, slotProps?.title?.style)}
      >
        {title}
      </span>
      {messages.map((message, index) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- message lines have no identity
          key={index}
          {...slotProps?.message}
          className={cx('cobble-toast-message', 'cobble-text', slotProps?.message?.className)}
          style={placeAt(18, 18 + index * 12, slotProps?.message?.style)}
        >
          {message}
        </span>
      ))}
    </Component>
  );
}
