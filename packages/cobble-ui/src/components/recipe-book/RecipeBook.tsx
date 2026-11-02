import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ElementType, type JSX, type ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { useTranslation } from '../../i18n/Translation.tsx';
import { useTextureUrl } from '../../provider/hooks.ts';
import { Text } from '../../text/Text.tsx';
import {
  RECIPE_BOOK_SLOT_SIZE,
  RECIPE_BOOK_TAB_HEIGHT,
  RecipeBookFilterButton,
  RecipeBookPageButton,
  RecipeBookSlot,
  RecipeBookTab,
} from '../button/ContainerButtons.tsx';
import { cx, placeAt } from '../shared.ts';
import { TextField } from '../text-field/TextField.tsx';

/** `RecipeBookComponent.IMAGE_WIDTH` / `IMAGE_HEIGHT`: the book's background. */
export const RECIPE_BOOK_WIDTH = 147;
export const RECIPE_BOOK_HEIGHT = 166;
/** With the book open the host screen moves right by 77 units (`RecipeBookComponent#updateScreenPosition`). */
export const RECIPE_BOOK_SCREEN_SHIFT = 77;
/**
 * Distance from the book's left edge to the left edge of a 176-wide host screen while the book is
 * open (`leftPos - bookX`).
 */
export const RECIPE_BOOK_SCREEN_GAP = 149;
/** Recipe buttons per page (`RecipeBookPage.MAX_RECIPE_BUTTONS`, 5 columns by 4 rows). */
export const RECIPE_BOOK_PAGE_SIZE = 20;
const COLUMNS = 5;
const TAB_X = -30;

/** One entry in the book: a recipe or a group of recipes with the same result. */
export interface RecipeBookRecipe {
  readonly id: string;
  /** Accessible name, also what the search box matches (the result's name). */
  readonly label: string;
  /** The result item, drawn in the button. Item textures are not GUI assets, so supply your own. */
  readonly content: ReactNode;
  /** Id of the {@link RecipeBookCategory} it is listed under. */
  readonly category?: string;
  /** Can be crafted with what the player holds (`RecipeCollection#hasCraftable`). Defaults to true. */
  readonly craftable?: boolean;
  /** The entry stands for several recipes (`RecipeCollection#hasMultiple`). */
  readonly many?: boolean;
}

/** A tab on the book's side (`RecipeBookTabButton`). */
export interface RecipeBookCategory {
  readonly id: string;
  readonly label: string;
  /** The icon in the tab. */
  readonly icon: ReactNode;
  /** The tab lists every recipe, like the search/all tab. */
  readonly all?: boolean;
}

export interface RecipeBookOwnProps {
  readonly recipes?: readonly RecipeBookRecipe[];
  readonly categories?: readonly RecipeBookCategory[];
  /** Whether the book is shown (`RecipeBookComponent#isVisible`). Controlled when given. */
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Id of the selected category. Controlled when given; defaults to the first one. */
  readonly category?: string;
  readonly onCategoryChange?: (category: string) => void;
  /** The search box's text. Controlled when given. */
  readonly search?: string;
  readonly onSearchChange?: (search: string) => void;
  /** Only craftable recipes are listed (`RecipeBook#isFiltering`). Controlled when given. */
  readonly craftableOnly?: boolean;
  readonly defaultCraftableOnly?: boolean;
  readonly onCraftableOnlyChange?: (craftableOnly: boolean) => void;
  /** Zero-based page. Controlled when given. */
  readonly page?: number;
  readonly onPageChange?: (page: number) => void;
  /** Use the furnace, smoker and blast furnace filter artwork. */
  readonly furnace?: boolean;
  /** Called when a recipe button is activated. */
  readonly onRecipeClick?: (recipe: RecipeBookRecipe) => void;
  /** Accessible name of the "show craftable" toggle. */
  readonly filterLabel?: string;
  /**
   * Content drawn over the book without taking pointer events, in the book's coordinates (origin
   * at its top left): a place for ghost recipes and overlays.
   */
  readonly overlay?: ReactNode;
  /** Draw the book's own artwork behind the controls. Defaults to true. */
  readonly background?: boolean;
}

export type RecipeBookProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  RecipeBookOwnProps
>;

/** The state of a value that may be controlled by a prop. */
export function useControllable<T>(
  controlled: T | undefined,
  initial: T,
  onChange: ((value: T) => void) | undefined,
): readonly [T, (value: T) => void] {
  const [inner, setInner] = useState(initial);
  const value = controlled ?? inner;
  return [
    value,
    (next) => {
      if (controlled === undefined) setInner(next);
      onChange?.(next);
    },
  ];
}

/**
 * Which recipes the book lists: the selected category's, matching the search text, and only the
 * craftable ones when filtering, craftable first (`RecipeBookComponent#updateCollections`).
 */
export function filterRecipeBook(
  recipes: readonly RecipeBookRecipe[],
  categories: readonly RecipeBookCategory[],
  category: string | undefined,
  search: string,
  craftableOnly: boolean,
): readonly RecipeBookRecipe[] {
  const selected = categories.find((entry) => entry.id === category);
  const needle = search.trim().toLowerCase();
  const listed = recipes.filter((recipe) => {
    if (selected !== undefined && selected.all !== true && recipe.category !== selected.id) {
      return false;
    }
    if (craftableOnly && recipe.craftable === false) return false;
    return needle === '' || recipe.label.toLowerCase().includes(needle);
  });
  return [
    ...listed.filter((recipe) => recipe.craftable !== false),
    ...listed.filter((recipe) => recipe.craftable === false),
  ];
}

/** Pages needed for `count` recipes (`RecipeBookPage#totalPages`). */
export function recipeBookPageCount(count: number): number {
  return Math.ceil(count / RECIPE_BOOK_PAGE_SIZE);
}

/**
 * The recipe book panel (`RecipeBookComponent` with `RecipeBookPage`): category tabs down the left
 * edge, a search box and the "show craftable" toggle at the top, a 5×4 page of recipe buttons and
 * page arrows with an indicator. The origin is the book's top left (`bookX`, `bookY`); the tabs
 * stick out 30 units to the left. Recipes are data; nothing is crafted here.
 */
export function RecipeBook<E extends ElementType = 'div'>(
  props: RecipeBookProps<E>,
): JSX.Element | null {
  const {
    as,
    recipes = [],
    categories = [],
    open: openProp,
    defaultOpen = true,
    onOpenChange,
    category: categoryProp,
    onCategoryChange,
    search: searchProp,
    onSearchChange,
    craftableOnly: craftableProp,
    defaultCraftableOnly = false,
    onCraftableOnlyChange,
    page: pageProp,
    onPageChange,
    furnace = false,
    onRecipeClick,
    filterLabel,
    overlay,
    background = true,
    className,
    style,
    ...rest
  } = props as RecipeBookProps<'div'>;
  const [open] = useControllable(openProp, defaultOpen, onOpenChange);
  const [category, setCategory] = useControllable(
    categoryProp,
    categories[0]?.id ?? '',
    onCategoryChange,
  );
  const [search, setSearch] = useControllable(searchProp, '', onSearchChange);
  const [craftableOnly, setCraftableOnly] = useControllable(
    craftableProp,
    defaultCraftableOnly,
    onCraftableOnlyChange,
  );
  const [pageValue, setPage] = useControllable(pageProp, 0, onPageChange);
  const imageUrl = useTextureUrl('gui/recipe_book');
  const { tOr } = useTranslation();
  if (!open) return null;

  const listed = filterRecipeBook(recipes, categories, category, search, craftableOnly);
  const pages = recipeBookPageCount(listed.length);
  const page = Math.min(Math.max(pageValue, 0), Math.max(pages - 1, 0));
  const shown = listed.slice(page * RECIPE_BOOK_PAGE_SIZE, (page + 1) * RECIPE_BOOK_PAGE_SIZE);
  const reset = (): void => {
    if (pageValue !== 0) setPage(0);
  };

  const Component: ElementType = as ?? 'div';
  const rootStyle: CssVariables = {
    '--cobble-width': RECIPE_BOOK_WIDTH,
    '--cobble-height': RECIPE_BOOK_HEIGHT,
    ...(background && imageUrl !== undefined
      ? { '--cobble-recipe-book-image': `url("${imageUrl}")` }
      : {}),
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-station-panel', 'cobble-recipe-book', className),
          style: rootStyle,
          role: 'group',
          'aria-label': tOr('cobble.recipe_book.title', 'Recipe Book'),
          ...(background ? { 'data-recipe-book-background': '' } : {}),
        },
        rest,
      )}
    >
      {categories.length === 0
        ? null
        : categories.map((entry, index) => {
            const selected = entry.id === category;
            return (
              <RecipeBookTab
                key={entry.id}
                className="cobble-placed"
                style={placeAt(TAB_X + (selected ? -2 : 0), 3 + index * RECIPE_BOOK_TAB_HEIGHT)}
                label={entry.label}
                selected={selected}
                onClick={() => {
                  setCategory(entry.id);
                  reset();
                }}
              >
                {entry.icon}
              </RecipeBookTab>
            );
          })}
      <TextField
        className="cobble-placed cobble-recipe-book-search"
        style={placeAt(25, 13)}
        aria-label={tOr('cobble.recipe_book.search', 'Search recipes')}
        width={81}
        height={14}
        bordered={false}
        maxLength={50}
        textColor="#ffffff"
        placeholder={
          <Text italic color="#aaaaaa" shadow={false}>
            {tOr('gui.recipebook.search_hint', 'Search...')}
          </Text>
        }
        value={search}
        onValueChange={(value) => {
          setSearch(value);
          reset();
        }}
      />
      <RecipeBookFilterButton
        className="cobble-placed"
        style={placeAt(110, 12)}
        furnace={furnace}
        enabled={craftableOnly}
        {...(filterLabel === undefined ? {} : { label: filterLabel })}
        onClick={() => {
          setCraftableOnly(!craftableOnly);
          reset();
        }}
      />
      {shown.map((recipe, index) => (
        <RecipeBookSlot
          key={recipe.id}
          className="cobble-placed"
          style={placeAt(
            11 + (index % COLUMNS) * RECIPE_BOOK_SLOT_SIZE,
            31 + Math.floor(index / COLUMNS) * RECIPE_BOOK_SLOT_SIZE,
          )}
          label={recipe.label}
          craftable={recipe.craftable !== false}
          many={recipe.many === true}
          onClick={() => onRecipeClick?.(recipe)}
        >
          {recipe.content}
        </RecipeBookSlot>
      ))}
      {pages > 1 && page > 0 ? (
        <RecipeBookPageButton
          direction="backward"
          className="cobble-placed"
          style={placeAt(38, 137)}
          onClick={() => setPage(page - 1)}
        />
      ) : null}
      {pages > 1 && page < pages - 1 ? (
        <RecipeBookPageButton
          direction="forward"
          className="cobble-placed"
          style={placeAt(93, 137)}
          onClick={() => setPage(page + 1)}
        />
      ) : null}
      {pages > 1 ? (
        <Text
          className="cobble-placed cobble-recipe-book-page"
          style={placeAt(0, 141)}
          color="#ffffff"
        >
          {`${String(page + 1)}/${String(pages)}`}
        </Text>
      ) : null}
      {overlay === undefined ? null : <div className="cobble-recipe-book-overlay">{overlay}</div>}
    </Component>
  );
}
