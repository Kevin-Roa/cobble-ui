import { mergeProps } from '@base-ui/react/merge-props';
import type { ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';

/** Height of an effect entry (`container/inventory/effect_background` is 32×32). */
export const EFFECT_ENTRY_HEIGHT = 32;
/** Width of a full effect entry, with its name and duration. */
export const EFFECT_ENTRY_WIDTH = 120;
/** Width of a compact entry, which shows only the icon. */
export const EFFECT_ENTRY_COMPACT_WIDTH = 32;

export interface StatusEffectEntrySlotProps {
  readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'>;
  readonly icon?: SlotProps<'span'>;
  readonly name?: SlotProps<'span'>;
  readonly duration?: SlotProps<'span'>;
}

export interface StatusEffectEntryOwnProps {
  /** The effect's icon, drawn in an 18×18 area. Supply your own mob effect image. */
  readonly children?: ReactNode;
  /** The effect's name, e.g. `Speed II`. Hidden when `compact`. */
  readonly name?: ReactNode;
  /** The remaining time, e.g. `0:42`. Hidden when `compact`. */
  readonly duration?: ReactNode;
  /** The effect comes from a beacon or conduit: uses the ambient background. */
  readonly ambient?: boolean;
  /** Show only the icon in a 32×32 box, as when the inventory is narrow. */
  readonly compact?: boolean;
  readonly slotProps?: StatusEffectEntrySlotProps;
}

export type StatusEffectEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  StatusEffectEntryOwnProps
>;

/**
 * An active effect in the inventory's side panel: the `effect_background` nine-slice (a
 * different one for ambient effects), the icon, and the name and remaining time. The text
 * and icon offsets are approximations of the game's.
 */
export function StatusEffectEntry<E extends ElementType = 'div'>(
  props: StatusEffectEntryProps<E>,
): JSX.Element {
  const {
    as,
    children,
    name,
    duration,
    ambient = false,
    compact = false,
    slotProps,
    className,
    style,
    ...rest
  } = props as StatusEffectEntryProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const width = compact ? EFFECT_ENTRY_COMPACT_WIDTH : EFFECT_ENTRY_WIDTH;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': EFFECT_ENTRY_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-effect-entry', className), style: rootStyle },
        rest,
      )}
      data-ambient={ambient ? '' : undefined}
      data-compact={compact ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite={
          ambient
            ? 'container/inventory/effect_background_ambient'
            : 'container/inventory/effect_background'
        }
        width={width}
        height={EFFECT_ENTRY_HEIGHT}
      />
      {children === undefined ? null : (
        <span
          {...slotProps?.icon}
          className={cx('cobble-effect-entry-icon', slotProps?.icon?.className)}
          style={placeAt(compact ? 7 : 6, 7, slotProps?.icon?.style)}
        >
          {children}
        </span>
      )}
      {compact || name === undefined ? null : (
        <span
          {...slotProps?.name}
          className={cx('cobble-effect-entry-name', 'cobble-text', slotProps?.name?.className)}
          style={placeAt(28, 6, slotProps?.name?.style)}
          data-shadow=""
        >
          {name}
        </span>
      )}
      {compact || duration === undefined ? null : (
        <span
          {...slotProps?.duration}
          className={cx(
            'cobble-effect-entry-duration',
            'cobble-text',
            slotProps?.duration?.className,
          )}
          style={placeAt(28, 16, slotProps?.duration?.style)}
          data-shadow=""
        >
          {duration}
        </span>
      )}
    </Component>
  );
}
