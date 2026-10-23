import { asSpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import { type ElementType, type JSX, type ReactNode } from 'react';
import { useElementState, useGuiSize, useMergedRefs } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import type { SpriteSlotProps } from '../button/Button.tsx';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `Tooltip.MAX_WIDTH`. */
export const TOOLTIP_MAX_WIDTH = 170;
/** `TooltipRenderUtil`: 3 units of padding plus a 9-unit transparent margin in the sprites. */
export const TOOLTIP_INSET = 12;
/** `ClientTextTooltip#getHeight`. */
const TOOLTIP_LINE_HEIGHT = 10;

export interface TooltipPanelSlotProps {
  readonly background?: SpriteSlotProps;
  readonly frame?: SpriteSlotProps;
  /** The element the tooltip lines are rendered in. */
  readonly content?: SlotProps<'div'>;
}

export interface TooltipPanelOwnProps {
  readonly children?: ReactNode;
  /** Wrap width in GUI units. Defaults to 170, like widget tooltips. `0` disables wrapping. */
  readonly maxWidth?: number;
  /**
   * Tooltip style, like the `tooltip_style` item component: uses the sprites
   * `tooltip/<style>_background` and `tooltip/<style>_frame`.
   */
  readonly tooltipStyle?: string;
  /** Add 2 units of space after the first line (item tooltips do this for the name). */
  readonly spaceAfterFirstLine?: boolean;
  readonly slotProps?: TooltipPanelSlotProps;
}

export type TooltipPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  TooltipPanelOwnProps
>;

/**
 * The tooltip box on its own, drawn like `TooltipRenderUtil`: the background
 * and frame sprites around lines of text. The element includes the sprites'
 * transparent 9-unit margin, so text starts 12 units from its corner.
 */
export function TooltipPanel<E extends ElementType = 'div'>(
  props: TooltipPanelProps<E>,
): JSX.Element {
  const {
    as,
    children,
    maxWidth = TOOLTIP_MAX_WIDTH,
    tooltipStyle,
    spaceAfterFirstLine = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as TooltipPanelProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [content, setContent] = useElementState<HTMLDivElement>();
  const size = useGuiSize(content, unit);
  const contentRef = useMergedRefs<HTMLDivElement>(setContent, slotProps?.content?.ref);
  // Every line is 10 units tall, but the last line's spacing is not part of the box.
  const textWidth = size?.width ?? 0;
  const textHeight = (size?.height ?? TOOLTIP_LINE_HEIGHT) - 2;
  const boxWidth = textWidth + 2 * TOOLTIP_INSET;
  const boxHeight = textHeight + 2 * TOOLTIP_INSET;

  const background =
    tooltipStyle === undefined
      ? 'tooltip/background'
      : asSpriteId(`tooltip/${tooltipStyle}_background`);
  const frame =
    tooltipStyle === undefined ? 'tooltip/frame' : asSpriteId(`tooltip/${tooltipStyle}_frame`);

  const rootStyle: CssVariables = {
    '--cobble-width': boxWidth,
    '--cobble-height': boxHeight,
    ...style,
  };
  if (maxWidth > 0) rootStyle['--cobble-max-width'] = maxWidth;

  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-tooltip-panel', className), style: rootStyle },
        rest,
      )}
      data-space-after-first-line={spaceAfterFirstLine ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        className={cx('cobble-tooltip-background', slotProps?.background?.className)}
        sprite={background}
        width={boxWidth}
        height={boxHeight}
      />
      <Sprite
        {...slotProps?.frame}
        className={cx('cobble-tooltip-frame', slotProps?.frame?.className)}
        sprite={frame}
        width={boxWidth}
        height={boxHeight}
      />
      <div
        {...slotProps?.content}
        ref={contentRef}
        className={cx('cobble-tooltip-content', 'cobble-text', slotProps?.content?.className)}
        data-shadow=""
      >
        {children}
      </div>
    </Component>
  );
}
