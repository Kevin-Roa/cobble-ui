import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** `AdvancementType`: the frame shape. */
export type AdvancementFrameType = 'task' | 'goal' | 'challenge';

/** Size of an advancement frame sprite. */
export const ADVANCEMENT_FRAME_SIZE = 26;
/** Size of the icon area inside the frame. */
export const ADVANCEMENT_ICON_SIZE = 16;

/** Sprite of a frame (`AdvancementType#frameSprite`), e.g. `advancements/task_frame_obtained`. */
export function advancementFrameSprite(type: AdvancementFrameType, obtained: boolean): string {
  return `advancements/${type}_frame_${obtained ? 'obtained' : 'unobtained'}`;
}

export interface AdvancementFrameSlotProps {
  readonly sprite?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  /** The 16×16 area holding the icon. */
  readonly icon?: SlotProps<'span'>;
}

export interface AdvancementFrameOwnProps {
  /** The icon, drawn in the 16×16 area centred in the frame. Supply your own item image. */
  readonly children?: ReactNode;
  readonly type?: AdvancementFrameType;
  /** Whether the advancement is completed (the frame is lit). */
  readonly obtained?: boolean;
  readonly slotProps?: AdvancementFrameSlotProps;
}

export type AdvancementFrameProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  AdvancementFrameOwnProps
>;

/**
 * The frame around an advancement icon (`AdvancementWidget`): 26×26, square for
 * tasks, rounded for goals and spiked for challenges, dark until obtained.
 */
export function AdvancementFrame<E extends ElementType = 'div'>(
  props: AdvancementFrameProps<E>,
): JSX.Element {
  const {
    as,
    children,
    type = 'task',
    obtained = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as AdvancementFrameProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': ADVANCEMENT_FRAME_SIZE,
    '--cobble-height': ADVANCEMENT_FRAME_SIZE,
    ...style,
  };
  const inset = (ADVANCEMENT_FRAME_SIZE - ADVANCEMENT_ICON_SIZE) / 2;
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-advancement-frame', className), style: rootStyle },
        rest,
      )}
      data-type={type}
      data-obtained={obtained ? '' : undefined}
    >
      <Sprite
        {...slotProps?.sprite}
        sprite={advancementFrameSprite(type, obtained)}
        width={ADVANCEMENT_FRAME_SIZE}
        height={ADVANCEMENT_FRAME_SIZE}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.icon}
          className={cx('cobble-advancement-icon', slotProps?.icon?.className)}
          style={placeAt(inset, inset, slotProps?.icon?.style)}
        >
          {children}
        </span>
      )}
    </Component>
  );
}
