import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Which edge of the advancement window the tab sits on (`AdvancementTabType`). */
export type AdvancementTabSide = 'above' | 'below' | 'left' | 'right';
/** Position among the tabs on that edge: `first` is the left/top one, `last` the right/bottom one. */
export type AdvancementTabPosition = 'first' | 'middle' | 'last';

/** Sprites by edge and position: `[normal, selected]`. Above and below use left/middle/right, left and right use top/middle/bottom. */
const TAB_SPRITES: Record<
  AdvancementTabSide,
  Record<AdvancementTabPosition, readonly [normal: SpriteId, selected: SpriteId]>
> = {
  above: {
    first: ['advancements/tab_above_left', 'advancements/tab_above_left_selected'],
    middle: ['advancements/tab_above_middle', 'advancements/tab_above_middle_selected'],
    last: ['advancements/tab_above_right', 'advancements/tab_above_right_selected'],
  },
  below: {
    first: ['advancements/tab_below_left', 'advancements/tab_below_left_selected'],
    middle: ['advancements/tab_below_middle', 'advancements/tab_below_middle_selected'],
    last: ['advancements/tab_below_right', 'advancements/tab_below_right_selected'],
  },
  left: {
    first: ['advancements/tab_left_top', 'advancements/tab_left_top_selected'],
    middle: ['advancements/tab_left_middle', 'advancements/tab_left_middle_selected'],
    last: ['advancements/tab_left_bottom', 'advancements/tab_left_bottom_selected'],
  },
  right: {
    first: ['advancements/tab_right_top', 'advancements/tab_right_top_selected'],
    middle: ['advancements/tab_right_middle', 'advancements/tab_right_middle_selected'],
    last: ['advancements/tab_right_bottom', 'advancements/tab_right_bottom_selected'],
  },
};

/** Sprite id, e.g. `advancements/tab_above_left_selected`. The files are named left/middle/right or top/middle/bottom. */
export function advancementTabSprite(
  side: AdvancementTabSide,
  position: AdvancementTabPosition,
  selected: boolean,
): SpriteId {
  return TAB_SPRITES[side][position][selected ? 1 : 0];
}

/** Tabs above and below are 28×32; tabs on the left and right are 32×28. */
export function advancementTabSize(side: AdvancementTabSide): {
  readonly width: number;
  readonly height: number;
} {
  return side === 'above' || side === 'below'
    ? { width: 28, height: 32 }
    : { width: 32, height: 28 };
}

export interface AdvancementTabSlotProps {
  readonly sprite?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  /** The 16×16 icon area, centred in the sprite. */
  readonly icon?: SlotProps<'span'>;
}

export interface AdvancementTabOwnProps {
  /** The tab icon. Supply your own item image. */
  readonly children?: ReactNode;
  readonly side?: AdvancementTabSide;
  readonly position?: AdvancementTabPosition;
  readonly selected?: boolean;
  /** Accessible name of the tab (the advancement tab's title). */
  readonly label: string;
  readonly slotProps?: AdvancementTabSlotProps;
}

export type AdvancementTabProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  AdvancementTabOwnProps
>;

/**
 * A tab of the advancements screen (`AdvancementTab` with `AdvancementTabType`):
 * the sprite for its edge, position and selection, with the icon centred in it.
 * The icon's exact offset is an approximation of the game's.
 */
export function AdvancementTab<E extends ElementType = 'button'>(
  props: AdvancementTabProps<E>,
): JSX.Element {
  const {
    as,
    children,
    side = 'above',
    position = 'first',
    selected = false,
    label,
    slotProps,
    className,
    style,
    ...rest
  } = props as AdvancementTabProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const { width, height } = advancementTabSize(side);
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-advancement-tab', className),
          style: rootStyle,
          type: 'button',
          'aria-pressed': selected,
          'aria-label': label,
        },
        rest,
      )}
      data-side={side}
      data-selected={selected ? '' : undefined}
    >
      <Sprite
        {...slotProps?.sprite}
        sprite={advancementTabSprite(side, position, selected)}
        width={width}
        height={height}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.icon}
          className={cx('cobble-advancement-icon', slotProps?.icon?.className)}
          style={placeAt((width - 16) / 2, (height - 16) / 2, slotProps?.icon?.style)}
        >
          {children}
        </span>
      )}
    </Component>
  );
}
