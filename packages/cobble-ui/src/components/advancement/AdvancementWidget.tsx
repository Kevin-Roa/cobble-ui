import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import { useElementState, useGuiSize } from '../../internal/hooks.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useCobble } from '../../provider/context.ts';
import { cx } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import {
  ADVANCEMENT_FRAME_SIZE,
  AdvancementFrame,
  type AdvancementFrameType,
} from './AdvancementFrame.tsx';
import { ADVANCEMENT_BOX_HEIGHT, advancementBoxSprite } from './AdvancementBox.tsx';

/** Left edge of the text column: just past the 26-unit frame. */
export const ADVANCEMENT_TEXT_LEFT = 29;
/** Space kept to the right of the text inside the box. */
export const ADVANCEMENT_TEXT_RIGHT = 8;

export interface AdvancementWidgetSlotProps {
  readonly frame?: SlotProps<'div'>;
  readonly content?: SlotProps<'div'>;
  readonly title?: SlotProps<'span'>;
  readonly description?: SlotProps<'span'>;
}

export interface AdvancementWidgetOwnProps {
  /** The icon inside the frame. Supply your own item image. */
  readonly children?: ReactNode;
  readonly title: ReactNode;
  /** Description lines under the title. Shown only while `expanded`. */
  readonly description?: readonly ReactNode[];
  readonly type?: AdvancementFrameType;
  /** Whether the advancement is completed: lights the frame and the box. */
  readonly obtained?: boolean;
  /** Show the box with the title and description beside the frame, as when it is hovered. */
  readonly expanded?: boolean;
  readonly slotProps?: AdvancementWidgetSlotProps;
}

export type AdvancementWidgetProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  AdvancementWidgetOwnProps
>;

/**
 * One advancement in the tree (`AdvancementWidget`): the frame, and while `expanded` the
 * `advancements/box_*` box behind the title and description beside it. The box is sized to its
 * text. The text column offset (29 left, 8 right), the vertical placement and the text colors
 * (white title, grey description) are approximations of the game's.
 */
export function AdvancementWidget<E extends ElementType = 'div'>(
  props: AdvancementWidgetProps<E>,
): JSX.Element {
  const {
    as,
    children,
    title,
    description = [],
    type = 'task',
    obtained = false,
    expanded = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as AdvancementWidgetProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const { unit } = useCobble();
  const [content, setContent] = useElementState<HTMLDivElement>();
  const size = useGuiSize(expanded ? content : null, unit);
  const lines = description.length;
  const boxWidth = size?.width ?? ADVANCEMENT_FRAME_SIZE;
  const boxHeight = Math.max(size?.height ?? ADVANCEMENT_BOX_HEIGHT, ADVANCEMENT_BOX_HEIGHT);
  const rootStyle: CssVariables = {
    '--cobble-height': expanded ? boxHeight : ADVANCEMENT_FRAME_SIZE,
    '--cobble-text-left': ADVANCEMENT_TEXT_LEFT,
    '--cobble-text-right': ADVANCEMENT_TEXT_RIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-advancement-widget', className),
          style: rootStyle,
          role: 'group',
          'aria-label': typeof title === 'string' ? title : undefined,
        },
        rest,
      )}
      data-expanded={expanded ? '' : undefined}
      data-obtained={obtained ? '' : undefined}
    >
      {expanded ? (
        <>
          <Sprite
            sprite={advancementBoxSprite(obtained ? 'obtained' : 'unobtained')}
            width={boxWidth}
            height={boxHeight}
          />
          <div
            {...slotProps?.content}
            ref={setContent}
            className={cx('cobble-advancement-widget-content', slotProps?.content?.className)}
            data-lines={lines}
          >
            <span
              {...slotProps?.title}
              className={cx(
                'cobble-advancement-widget-title',
                'cobble-text',
                slotProps?.title?.className,
              )}
              data-shadow=""
            >
              {title}
            </span>
            {description.map((line, index) => (
              <span
                // oxlint-disable-next-line react/no-array-index-key -- description lines have no identity
                key={index}
                {...slotProps?.description}
                className={cx(
                  'cobble-advancement-widget-description',
                  'cobble-text',
                  slotProps?.description?.className,
                )}
              >
                {line}
              </span>
            ))}
          </div>
        </>
      ) : null}
      <AdvancementFrame
        {...slotProps?.frame}
        className={cx('cobble-advancement-widget-frame', slotProps?.frame?.className)}
        type={type}
        obtained={obtained}
      >
        {children}
      </AdvancementFrame>
    </Component>
  );
}
