import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Which edge of the advancement window the tab sits on (`AdvancementTabType`). */
export type AdvancementTabSide = 'above' | 'below' | 'left' | 'right';
/** Position among the tabs on that edge: `first` is the left/top one, `last` the right/bottom one. */
export type AdvancementTabPosition = 'first' | 'middle' | 'last';

const ACROSS = { first: 'left', middle: 'middle', last: 'right' } as const;
const DOWN = { first: 'top', middle: 'middle', last: 'bottom' } as const;

/** Sprite id, e.g. `advancements/tab_above_left_selected`. The files are named left/middle/right or top/middle/bottom. */
export function advancementTabSprite(
  side: AdvancementTabSide,
  position: AdvancementTabPosition,
  selected: boolean,
): string {
  const place = side === 'above' || side === 'below' ? ACROSS[position] : DOWN[position];
  return `advancements/tab_${side}_${place}${selected ? '_selected' : ''}`;
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
          role: 'tab',
          'aria-selected': selected,
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
