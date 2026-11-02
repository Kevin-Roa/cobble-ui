import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { useTranslation } from '../../i18n/Translation.tsx';
import { Text } from '../../text/Text.tsx';
import { RecipeBookButton } from '../button/RecipeBookButton.tsx';
import {
  RECIPE_BOOK_SCREEN_GAP,
  RecipeBook,
  useControllable,
  type RecipeBookOwnProps,
} from '../recipe-book/RecipeBook.tsx';
import { placeAt } from '../shared.ts';
import type { EmptySlotIcon } from '../slot/InventorySlot.tsx';
import { INVENTORY_HOTBAR_GAP, SlotGrid, type SlotGridItem } from '../slot/SlotGrid.tsx';
import { StationSlot, usePanelRoot } from '../slot/StationPanels.tsx';
import { PlayerRenderer } from './PlayerRenderer.tsx';

/** The equipment slots, top to bottom (`InventoryMenu`: x 8, y 8 + 18 each). */
export const ARMOR_SLOTS = ['head', 'chest', 'legs', 'feet'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

const ARMOR_ICONS: Readonly<Record<ArmorSlot, EmptySlotIcon>> = {
  head: 'helmet',
  chest: 'chestplate',
  legs: 'leggings',
  feet: 'boots',
};

const ARMOR_LABELS: Readonly<Record<ArmorSlot, readonly [key: string, fallback: string]>> = {
  head: ['cobble.armor.head', 'Helmet'],
  chest: ['cobble.armor.chest', 'Chestplate'],
  legs: ['cobble.armor.legs', 'Leggings'],
  feet: ['cobble.armor.feet', 'Boots'],
};

export type PlayerInventoryArea = 'armor' | 'offhand' | 'crafting' | 'result' | 'main' | 'hotbar';

/** The recipe book of the inventory: the book's own props (recipes, categories, open state, ...). */
export type PlayerInventoryRecipeBook = Omit<RecipeBookOwnProps, 'background'>;

export interface PlayerInventoryOwnProps {
  /**
   * Adds the recipe book: its toggle button beside the crafting grid (`InventoryScreen`, at 104,
   * 61) and, while open, the book to the left with the screen shifted 77 units right, as in the
   * game. Pass `true` for an empty book or the book's props. The open state is controlled with
   * `open`/`onOpenChange` or left to the component (`defaultOpen`).
   */
  readonly recipeBook?: boolean | PlayerInventoryRecipeBook;
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /**
   * The figure on the left: a username/UUID (a 3D `PlayerRenderer` that follows the cursor like
   * the real screen, skin from the Mojang API), or a node of your own.
   */
  readonly player?: string | ReactNode;
  /** Items in the equipment slots. */
  readonly armor?: Readonly<Partial<Record<ArmorSlot, SlotGridItem>>>;
  readonly offhand?: SlotGridItem | undefined;
  /** The four slots of the 2×2 crafting grid, in reading order. */
  readonly crafting?: readonly (SlotGridItem | undefined)[];
  readonly result?: SlotGridItem | undefined;
  /** The 27 main inventory slots, in reading order. */
  readonly items?: readonly (SlotGridItem | undefined)[];
  /** The 9 hotbar slots. */
  readonly hotbar?: readonly (SlotGridItem | undefined)[];
  /** Called with the area and the index within it. */
  readonly onSlotClick?: (area: PlayerInventoryArea, index: number) => void;
}

export type PlayerInventoryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PlayerInventoryOwnProps
>;

/**
 * The survival inventory screen (`InventoryScreen`/`InventoryMenu`): four armor slots, the player
 * figure, the offhand slot, the 2×2 crafting grid with its result, the 27 inventory slots and the
 * hotbar, at the screen's own coordinates.
 */
export function PlayerInventory<E extends ElementType = 'div'>(
  props: PlayerInventoryProps<E>,
): JSX.Element {
  const {
    as,
    player,
    armor = {},
    offhand,
    crafting = [],
    result,
    items,
    hotbar,
    onSlotClick,
    recipeBook,
    className,
    style,
    ...rest
  } = props as PlayerInventoryProps<'div'>;
  const { tOr } = useTranslation();
  const book: PlayerInventoryRecipeBook | undefined =
    recipeBook === true ? {} : recipeBook === false ? undefined : recipeBook;
  const [bookOpen, setBookOpen] = useControllable(
    book?.open,
    book?.defaultOpen ?? false,
    book?.onOpenChange,
  );
  const showBook = book !== undefined && bookOpen;
  const { Component, props: root } = usePanelRoot(
    as,
    'player-inventory-panel',
    176,
    166,
    className,
    style,
    showBook ? { ...rest, 'data-recipe-book-open': '' } : rest,
    'inventory',
  );
  const click = (area: PlayerInventoryArea, index = 0): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(area, index) };
  const figure =
    typeof player === 'string' && player.trim() !== '' ? (
      <PlayerRenderer player={player} width={49} height={70} followMouse />
    ) : typeof player === 'string' ? null : (
      player
    );
  return (
    <Component {...root}>
      {ARMOR_SLOTS.map((slot, index) => (
        <StationSlot
          key={slot}
          x={8}
          y={8 + index * 18}
          label={tOr(...ARMOR_LABELS[slot])}
          item={armor[slot]}
          emptyIcon={ARMOR_ICONS[slot]}
          {...click('armor', index)}
        />
      ))}
      {figure === undefined || figure === null || figure === false ? null : (
        <span className="cobble-placed" style={placeAt(26, 8)}>
          {figure}
        </span>
      )}
      <StationSlot
        x={77}
        y={62}
        label={tOr('cobble.inventory.offhand', 'Offhand')}
        item={offhand}
        emptyIcon="shield"
        {...click('offhand')}
      />
      <Text className="cobble-placed" color="#404040" shadow={false} style={placeAt(97, 8)}>
        {tOr('container.crafting', 'Crafting')}
      </Text>
      {[0, 1, 2, 3].map((index) => (
        <StationSlot
          key={index}
          x={98 + (index % 2) * 18}
          y={18 + Math.floor(index / 2) * 18}
          label={tOr('cobble.inventory.crafting_slot', 'Crafting slot %s', index + 1)}
          item={crafting[index]}
          {...click('crafting', index)}
        />
      ))}
      {book === undefined ? null : (
        <>
          <RecipeBookButton
            className="cobble-placed"
            style={placeAt(104, 61)}
            aria-expanded={bookOpen}
            onClick={() => setBookOpen(!bookOpen)}
          />
          <RecipeBook
            {...book}
            open={bookOpen}
            className="cobble-placed"
            style={placeAt(-RECIPE_BOOK_SCREEN_GAP, 0)}
          />
        </>
      )}
      <StationSlot
        x={154}
        y={28}
        label={tOr('cobble.inventory.crafting_result', 'Crafting result')}
        item={result}
        {...click('result')}
      />
      <SlotGrid
        className="cobble-placed"
        style={placeAt(7, 83)}
        columns={9}
        rows={3}
        label={tOr('container.inventory', 'Inventory')}
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (index: number) => onSlotClick('main', index) })}
      />
      <SlotGrid
        className="cobble-placed"
        style={placeAt(7, 83 + 3 * 18 + INVENTORY_HOTBAR_GAP)}
        columns={9}
        rows={1}
        label={tOr('cobble.inventory.hotbar', 'Hotbar')}
        {...(hotbar === undefined ? {} : { items: hotbar })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (index: number) => onSlotClick('hotbar', index) })}
      />
    </Component>
  );
}
