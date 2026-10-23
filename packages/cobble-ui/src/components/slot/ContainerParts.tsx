import { mergeProps } from '@base-ui/react/merge-props';
import { useInteraction } from '../../internal/hooks.ts';
import type { ElementType, JSX, ReactNode } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import type { UiSoundEvent } from '../../sound/sounds.ts';
import { cx, placeAt, useClickSound } from '../shared.ts';
import { Sprite, type SpriteProps } from '../sprite/Sprite.tsx';

// ------------------------------------------------------------------------- recipe book overlay

export const RECIPE_OVERLAY_SIZE = 25;

/** Which station's recipe overlay artwork to use. */
export type RecipeOverlayStation = 'crafting' | 'furnace';

/** Sprite of a recipe overlay button: `<station>_overlay[_disabled][_highlighted]`. */
export function recipeOverlaySprite(
  station: RecipeOverlayStation,
  craftable: boolean,
  highlighted: boolean,
): SpriteId {
  if (station === 'crafting') {
    if (craftable)
      return highlighted
        ? 'recipe_book/crafting_overlay_highlighted'
        : 'recipe_book/crafting_overlay';
    return highlighted
      ? 'recipe_book/crafting_overlay_disabled_highlighted'
      : 'recipe_book/crafting_overlay_disabled';
  }
  if (craftable)
    return highlighted ? 'recipe_book/furnace_overlay_highlighted' : 'recipe_book/furnace_overlay';
  return highlighted
    ? 'recipe_book/furnace_overlay_disabled_highlighted'
    : 'recipe_book/furnace_overlay_disabled';
}

export interface RecipeOverlayButtonOwnProps {
  /** The item shown in the cell. Supply your own. */
  readonly children?: ReactNode;
  readonly station?: RecipeOverlayStation;
  /** The recipe can be crafted from what the player holds. A grey cell is still clickable. */
  readonly craftable?: boolean;
  /** Accessible name. */
  readonly label: string;
  /** Sound played on click, or `false`. Defaults to `"ui.button.click"`. */
  readonly sound?: UiSoundEvent | false;
  readonly slotProps?: { readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'> };
}

export type RecipeOverlayButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  RecipeOverlayButtonOwnProps
>;

/**
 * A cell of the recipe book's alternative-recipes popup (`recipe_book/crafting_overlay`, 25×25), in
 * four looks: craftable or not, hovered or not. The item is inset by 4; that offset is an
 * approximation of the game's.
 */
export function RecipeOverlayButton<E extends ElementType = 'button'>(
  props: RecipeOverlayButtonProps<E>,
): JSX.Element {
  const {
    as,
    children,
    station = 'crafting',
    craftable = true,
    label,
    sound = 'ui.button.click',
    slotProps,
    className,
    style,
    ...rest
  } = props as RecipeOverlayButtonProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const [interaction, handlers] = useInteraction();
  const clickSound = useClickSound(sound, false);
  const rootStyle: CssVariables = {
    '--cobble-width': RECIPE_OVERLAY_SIZE,
    '--cobble-height': RECIPE_OVERLAY_SIZE,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-recipe-overlay', className),
          style: rootStyle,
          type: 'button',
          'aria-label': label,
          ...handlers,
          onPointerDown: clickSound.onPointerDown,
          onKeyDown: clickSound.onKeyDown,
        },
        rest,
      )}
      data-craftable={craftable ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite={recipeOverlaySprite(station, craftable, interaction.hovered || interaction.focused)}
        width={RECIPE_OVERLAY_SIZE}
        height={RECIPE_OVERLAY_SIZE}
      />
      {children === undefined ? null : (
        <span className="cobble-inventory-slot-item" style={placeAt(4, 4)}>
          {children}
        </span>
      )}
    </Component>
  );
}

// ------------------------------------------------------------------------------------- crafter

/** The background of a crafter slot: the plain slot, or the barred one when the slot is disabled. */
export function crafterSlotSprite(slotDisabled: boolean): SpriteId {
  return slotDisabled ? 'container/crafter/disabled_slot' : 'container/slot';
}

export interface CrafterSlotOwnProps {
  /** The item in the slot. */
  readonly children?: ReactNode;
  /** The slot has been switched off (it will not receive items). */
  readonly slotDisabled?: boolean;
  /** Accessible name. */
  readonly label: string;
  readonly slotProps?: { readonly background?: Omit<SlotProps<'canvas'>, 'width' | 'height'> };
}

export type CrafterSlotProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  CrafterSlotOwnProps
>;

/**
 * A slot of the crafter's 3×3 grid (18×18). A disabled slot is drawn with the barred
 * `container/crafter/disabled_slot` and toggles when clicked, like the game's.
 */
export function CrafterSlot<E extends ElementType = 'button'>(
  props: CrafterSlotProps<E>,
): JSX.Element {
  const {
    as,
    children,
    slotDisabled = false,
    label,
    slotProps,
    className,
    style,
    ...rest
  } = props as CrafterSlotProps<'button'>;
  const Component: ElementType = as ?? 'button';
  const rootStyle: CssVariables = { '--cobble-width': 18, '--cobble-height': 18, ...style };
  return (
    <Component
      {...mergeProps<'button'>(
        {
          className: cx('cobble-inventory-slot', 'cobble-crafter-slot', className),
          style: rootStyle,
          type: 'button',
          role: 'switch',
          'aria-checked': !slotDisabled,
          'aria-label': label,
        },
        rest,
      )}
      data-slot-disabled={slotDisabled ? '' : undefined}
    >
      <Sprite
        {...slotProps?.background}
        sprite={crafterSlotSprite(slotDisabled)}
        width={18}
        height={18}
      />
      {children === undefined || slotDisabled ? null : (
        <span className="cobble-inventory-slot-item" style={placeAt(1, 1)}>
          {children}
        </span>
      )}
    </Component>
  );
}

export interface CrafterRedstoneProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  /** Whether the crafter is receiving a redstone signal. */
  readonly powered: boolean;
}

/** The redstone indicator of the crafter (`container/crafter/powered_redstone`, 16×16). */
export function CrafterRedstone(props: CrafterRedstoneProps): JSX.Element {
  const { powered, ...rest } = props;
  return (
    <Sprite
      role="img"
      aria-hidden={undefined}
      aria-label={powered ? 'Powered' : 'Not powered'}
      {...rest}
      sprite={
        powered ? 'container/crafter/powered_redstone' : 'container/crafter/unpowered_redstone'
      }
      width={16}
      height={16}
    />
  );
}

// ------------------------------------------------------------------------------ cartography

/** What the cartography table shows in a map frame. */
export type CartographyMapKind = 'map' | 'scaled' | 'duplicated' | 'locked';

interface MapSprite {
  readonly sprite: SpriteId;
  readonly width: number;
  readonly height: number;
}

const MAP_SPRITES: Record<CartographyMapKind, MapSprite> = {
  map: { sprite: 'container/cartography_table/map', width: 66, height: 66 },
  scaled: { sprite: 'container/cartography_table/scaled_map', width: 66, height: 66 },
  duplicated: { sprite: 'container/cartography_table/duplicated_map', width: 50, height: 66 },
  locked: { sprite: 'container/cartography_table/locked', width: 10, height: 14 },
};

/** Size of a cartography overlay. */
export function cartographyMapSize(kind: CartographyMapKind): {
  readonly width: number;
  readonly height: number;
} {
  const { width, height } = MAP_SPRITES[kind];
  return { width, height };
}

export interface CartographyMapProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  readonly kind: CartographyMapKind;
}

/**
 * The frames the cartography table draws behind the map preview: a plain map (66×66), a
 * zoomed-out one (66×66), a copy (50×66), and the small padlock for a locked map (10×14).
 */
export function CartographyMap(props: CartographyMapProps): JSX.Element {
  const { kind, ...rest } = props;
  const { sprite, width, height } = MAP_SPRITES[kind];
  return <Sprite {...rest} sprite={sprite} width={width} height={height} />;
}

// ------------------------------------------------------------------------------------- horse

export const HORSE_CHEST_SLOT_SIZE = 18;
export const HORSE_CHEST_ROWS = 3;
export const HORSE_CHEST_MAX_COLUMNS = 5;

/** Width of the chest slot grid for a number of columns (1 to 5): 18 per column. */
export function horseChestWidth(columns: number): number {
  const count = Math.min(Math.max(Math.trunc(columns), 0), HORSE_CHEST_MAX_COLUMNS);
  return count * HORSE_CHEST_SLOT_SIZE;
}

export interface HorseChestSlotsOwnProps {
  /** Number of slot columns the mount's chest has, 1 to 5 (3 rows tall). */
  readonly columns: number;
}

export type HorseChestSlotsProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  HorseChestSlotsOwnProps
>;

/**
 * The slot grid for a pack animal's chest (`container/horse/chest_slots`): the first
 * `columns` columns of the 5×3 sheet, 18 units each. Put your item slots on top of it.
 */
export function HorseChestSlots<E extends ElementType = 'div'>(
  props: HorseChestSlotsProps<E>,
): JSX.Element {
  const { as, columns, className, style, children, ...rest } = props as HorseChestSlotsProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const width = horseChestWidth(columns);
  const height = HORSE_CHEST_ROWS * HORSE_CHEST_SLOT_SIZE;
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': height,
    '--cobble-clip-width': width,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        { className: cx('cobble-stat-bar', 'cobble-horse-chest', className), style: rootStyle },
        rest,
      )}
    >
      {width > 0 ? (
        <span className="cobble-stat-bar-clip">
          <Sprite
            sprite="container/horse/chest_slots"
            width={HORSE_CHEST_MAX_COLUMNS * HORSE_CHEST_SLOT_SIZE}
            height={height}
          />
        </span>
      ) : null}
      {children}
    </Component>
  );
}
