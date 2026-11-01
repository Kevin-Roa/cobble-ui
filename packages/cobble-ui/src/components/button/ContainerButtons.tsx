import type { ElementType, JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { cx } from '../shared.ts';
import { CreativeScroller, type CreativeScrollerOwnProps } from '../creative/CreativeScroller.tsx';
import {
  StateSpriteButton,
  type StateSpriteButtonOwnProps,
  type StateSprites,
} from './StateSpriteButton.tsx';

type Wrapped = Omit<StateSpriteButtonOwnProps, 'label'> & {
  readonly label?: string;
};

/** Default inset between a cell's edge and the content drawn in it, in GUI units. */
export const CONTAINER_BUTTON_PADDING = 1;

/**
 * Content slot props that make the content fill the button minus `padding` on every side, so an
 * item or icon scales to the cell instead of having a hardcoded size.
 */
function fitContent(
  width: number,
  height: number,
  padding: number,
  slot: StateSpriteButtonOwnProps['slotProps'],
): NonNullable<StateSpriteButtonOwnProps['slotProps']> {
  return {
    ...slot,
    content: {
      ...slot?.content,
      className: cx('cobble-fit-content', slot?.content?.className),
      style: {
        left: `calc(${String(padding)} * var(--cobble-px))`,
        top: `calc(${String(padding)} * var(--cobble-px))`,
        width: `calc(${String(width - padding * 2)} * var(--cobble-px))`,
        height: `calc(${String(height - padding * 2)} * var(--cobble-px))`,
        ...slot?.content?.style,
      },
    },
  };
}

// ---------------------------------------------------------------------------- stonecutter

export const STONECUTTER_BUTTON_WIDTH = 16;
export const STONECUTTER_BUTTON_HEIGHT = 18;

const STONECUTTER_SPRITES: StateSprites = {
  normal: 'container/stonecutter/recipe',
  highlighted: 'container/stonecutter/recipe_highlighted',
  selected: 'container/stonecutter/recipe_selected',
};

export type StonecutterRecipeButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Wrapped
>;

/**
 * A recipe cell of the stonecutter (`container/stonecutter/recipe`, 16×18): lit when hovered or
 * focused and dark when it is the chosen recipe. The result item goes inside and scales to
 * fit the cell with {@link CONTAINER_BUTTON_PADDING} around it.
 */
export function StonecutterRecipeButton<E extends ElementType = 'button'>(
  props: StonecutterRecipeButtonProps<E>,
): JSX.Element {
  const { label = 'Recipe', slotProps, ...rest } = props as StonecutterRecipeButtonProps<'button'>;
  return (
    <StateSpriteButton
      sound="ui.stonecutter.select_recipe"
      {...rest}
      label={label}
      name="stonecutter-button"
      sprites={STONECUTTER_SPRITES}
      buttonWidth={STONECUTTER_BUTTON_WIDTH}
      buttonHeight={STONECUTTER_BUTTON_HEIGHT}
      slotProps={fitContent(
        STONECUTTER_BUTTON_WIDTH,
        STONECUTTER_BUTTON_HEIGHT,
        CONTAINER_BUTTON_PADDING,
        slotProps,
      )}
      toggle
    />
  );
}

// ----------------------------------------------------------------------------------- loom

export const LOOM_BUTTON_SIZE = 14;

const LOOM_SPRITES: StateSprites = {
  normal: 'container/loom/pattern',
  highlighted: 'container/loom/pattern_highlighted',
  selected: 'container/loom/pattern_selected',
};

export type LoomPatternButtonProps<E extends ElementType = 'button'> = PolymorphicProps<E, Wrapped>;

/**
 * A banner pattern cell of the loom (`container/loom/pattern`, 14×14). The pattern preview goes
 * inside and scales to fit the cell with padding around it.
 */
export function LoomPatternButton<E extends ElementType = 'button'>(
  props: LoomPatternButtonProps<E>,
): JSX.Element {
  const { label = 'Pattern', slotProps, ...rest } = props as LoomPatternButtonProps<'button'>;
  return (
    <StateSpriteButton
      sound="ui.loom.select_pattern"
      {...rest}
      label={label}
      name="loom-button"
      sprites={LOOM_SPRITES}
      buttonWidth={LOOM_BUTTON_SIZE}
      buttonHeight={LOOM_BUTTON_SIZE}
      slotProps={fitContent(
        LOOM_BUTTON_SIZE,
        LOOM_BUTTON_SIZE,
        CONTAINER_BUTTON_PADDING,
        slotProps,
      )}
      toggle
    />
  );
}

// --------------------------------------------------------------------------------- scrollers

type ScrollerProps<E extends ElementType> = PolymorphicProps<
  E,
  Omit<CreativeScrollerOwnProps, 'sprite' | 'disabledSprite' | 'thumbWidth' | 'thumbHeight'>
>;

export type StonecutterScrollerProps<E extends ElementType = 'div'> = ScrollerProps<E>;
export type LoomScrollerProps<E extends ElementType = 'div'> = ScrollerProps<E>;

/** The default track of the stonecutter and loom scrollers: a 15-unit thumb travelling 41 units. */
export const CONTAINER_SCROLLER_HEIGHT = 56;

/** The scroll thumb beside the stonecutter's recipes (12×15). Track height is an approximation. */
export function StonecutterScroller<E extends ElementType = 'div'>(
  props: StonecutterScrollerProps<E>,
): JSX.Element {
  const { height = CONTAINER_SCROLLER_HEIGHT, ...rest } = props as StonecutterScrollerProps<'div'>;
  return (
    <CreativeScroller
      aria-label="Recipes"
      {...rest}
      height={height}
      sprite="container/stonecutter/scroller"
      disabledSprite="container/stonecutter/scroller_disabled"
    />
  );
}

/** The scroll thumb beside the loom's patterns (12×15). Track height is an approximation. */
export function LoomScroller<E extends ElementType = 'div'>(
  props: LoomScrollerProps<E>,
): JSX.Element {
  const { height = CONTAINER_SCROLLER_HEIGHT, ...rest } = props as LoomScrollerProps<'div'>;
  return (
    <CreativeScroller
      aria-label="Patterns"
      {...rest}
      height={height}
      sprite="container/loom/scroller"
      disabledSprite="container/loom/scroller_disabled"
    />
  );
}

// ------------------------------------------------------------------------------ recipe book

export const RECIPE_BOOK_TAB_WIDTH = 35;
export const RECIPE_BOOK_TAB_HEIGHT = 27;

export type RecipeBookTabProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Omit<StateSpriteButtonOwnProps, 'label'> & { readonly label: string }
>;

/**
 * A category tab at the side of the recipe book (`recipe_book/tab`, 35×27, with a selected
 * variant). The icon inside is centred horizontally; its offset is an approximation.
 */
export function RecipeBookTab<E extends ElementType = 'button'>(
  props: RecipeBookTabProps<E>,
): JSX.Element {
  const { selected = false, ...rest } = props as RecipeBookTabProps<'button'>;
  return (
    <StateSpriteButton
      {...rest}
      selected={selected}
      toggle
      name="recipe-book-tab"
      sprites={{
        normal: 'recipe_book/tab',
        selected: 'recipe_book/tab_selected',
      }}
      buttonWidth={RECIPE_BOOK_TAB_WIDTH}
      buttonHeight={RECIPE_BOOK_TAB_HEIGHT}
      contentX={9}
      contentY={5}
    />
  );
}

export const RECIPE_BOOK_FILTER_WIDTH = 26;
export const RECIPE_BOOK_FILTER_HEIGHT = 16;

/** Sprites of the "show craftable only" toggle for a state, with the furnace artwork if asked. */
export function recipeBookFilterSprites(enabled: boolean, furnace: boolean): StateSprites {
  if (furnace) {
    return enabled
      ? {
          normal: 'recipe_book/furnace_filter_enabled',
          highlighted: 'recipe_book/furnace_filter_enabled_highlighted',
        }
      : {
          normal: 'recipe_book/furnace_filter_disabled',
          highlighted: 'recipe_book/furnace_filter_disabled_highlighted',
        };
  }
  return enabled
    ? {
        normal: 'recipe_book/filter_enabled',
        highlighted: 'recipe_book/filter_enabled_highlighted',
      }
    : {
        normal: 'recipe_book/filter_disabled',
        highlighted: 'recipe_book/filter_disabled_highlighted',
      };
}

export type RecipeBookFilterButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Omit<StateSpriteButtonOwnProps, 'selected' | 'children' | 'label'> & {
    /** Whether only craftable recipes are shown. */
    readonly enabled?: boolean;
    /** Use the furnace, smoker and blast furnace artwork. */
    readonly furnace?: boolean;
    readonly label?: string;
  }
>;

/** The "show craftable" toggle at the top of the recipe book (26×16). */
export function RecipeBookFilterButton<E extends ElementType = 'button'>(
  props: RecipeBookFilterButtonProps<E>,
): JSX.Element {
  const {
    enabled = false,
    furnace = false,
    label = 'Show craftable recipes only',
    ...rest
  } = props as RecipeBookFilterButtonProps<'button'>;
  return (
    <StateSpriteButton
      {...rest}
      label={label}
      selected={enabled}
      toggle
      name="recipe-book-filter"
      sprites={recipeBookFilterSprites(enabled, furnace)}
      buttonWidth={RECIPE_BOOK_FILTER_WIDTH}
      buttonHeight={RECIPE_BOOK_FILTER_HEIGHT}
    />
  );
}

export const RECIPE_BOOK_PAGE_WIDTH = 12;
export const RECIPE_BOOK_PAGE_HEIGHT = 17;

export type RecipeBookPageButtonProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Omit<StateSpriteButtonOwnProps, 'selected' | 'children' | 'label'> & {
    readonly direction: 'forward' | 'backward';
    readonly label?: string;
  }
>;

/** The arrows that turn the recipe book's pages (`recipe_book/page_*`, 12×17). */
export function RecipeBookPageButton<E extends ElementType = 'button'>(
  props: RecipeBookPageButtonProps<E>,
): JSX.Element {
  const {
    direction,
    label = direction === 'forward' ? 'Next Page' : 'Previous Page',
    ...rest
  } = props as RecipeBookPageButtonProps<'button'>;
  const sprites: StateSprites =
    direction === 'forward'
      ? {
          normal: 'recipe_book/page_forward',
          highlighted: 'recipe_book/page_forward_highlighted',
        }
      : {
          normal: 'recipe_book/page_backward',
          highlighted: 'recipe_book/page_backward_highlighted',
        };
  return (
    <StateSpriteButton
      {...rest}
      label={label}
      name="recipe-book-page"
      sprites={sprites}
      buttonWidth={RECIPE_BOOK_PAGE_WIDTH}
      buttonHeight={RECIPE_BOOK_PAGE_HEIGHT}
    />
  );
}

export const RECIPE_BOOK_SLOT_SIZE = 25;

/** Background of a recipe book slot: whether it can be crafted now, and whether it stands for many recipes. */
export function recipeBookSlotSprite(craftable: boolean, many: boolean): SpriteId {
  if (craftable) return many ? 'recipe_book/slot_many_craftable' : 'recipe_book/slot_craftable';
  return many ? 'recipe_book/slot_many_uncraftable' : 'recipe_book/slot_uncraftable';
}

export type RecipeBookSlotProps<E extends ElementType = 'button'> = PolymorphicProps<
  E,
  Omit<StateSpriteButtonOwnProps, 'selected'> & {
    /** The recipe can be crafted with what the player holds. */
    readonly craftable?: boolean;
    /** The slot stands for several recipes with the same result. */
    readonly many?: boolean;
  }
>;

/** One result slot of the recipe book (25×25), with the item scaled to fit, inset by 4. */
export function RecipeBookSlot<E extends ElementType = 'button'>(
  props: RecipeBookSlotProps<E>,
): JSX.Element {
  const {
    craftable = true,
    many = false,
    slotProps,
    ...rest
  } = props as RecipeBookSlotProps<'button'>;
  return (
    <StateSpriteButton
      {...rest}
      name="recipe-book-slot"
      sprites={{ normal: recipeBookSlotSprite(craftable, many) }}
      buttonWidth={RECIPE_BOOK_SLOT_SIZE}
      buttonHeight={RECIPE_BOOK_SLOT_SIZE}
      slotProps={fitContent(RECIPE_BOOK_SLOT_SIZE, RECIPE_BOOK_SLOT_SIZE, 4, slotProps)}
    />
  );
}
