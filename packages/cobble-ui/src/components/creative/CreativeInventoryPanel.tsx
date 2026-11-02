import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Text } from '../../text/Text.tsx';
import { placeAt } from '../shared.ts';
import { SlotGrid, type SlotGridItem } from '../slot/SlotGrid.tsx';
import { usePanelRoot } from '../slot/StationPanels.tsx';
import { ItemIcon } from '../sprite/TextureIcons.tsx';
import { TextField } from '../text-field/TextField.tsx';
import { Tooltip } from '../tooltip/Tooltip.tsx';
import { CreativeScroller } from './CreativeScroller.tsx';
import { CreativeTab, type CreativeTabColumn } from './CreativeTab.tsx';
import { useTranslation } from '../../i18n/Translation.tsx';

/** Size of the creative inventory window itself, without its tabs. */
export const CREATIVE_WINDOW_WIDTH = 195;
export const CREATIVE_WINDOW_HEIGHT = 136;
/** Room the tabs take above and below the window. */
const TAB_MARGIN = 28;

export interface CreativeInventoryTab {
  /** Accessible name and tooltip, e.g. `Building Blocks`. */
  readonly label: string;
  /** The tab icon. Takes precedence over `item`. */
  readonly icon?: ReactNode;
  /** Item id drawn as the tab icon (`CreativeModeTab#getIconItem`), e.g. `bricks`. */
  readonly item?: string;
  /** The search tab: shows the search box and uses the search artwork. */
  readonly search?: boolean;
}

/**
 * The 14 tabs of 26.3 in `CreativeModeInventoryScreen` order: building, colored, natural,
 * functional, redstone, saved hotbars and search along the top; tools, combat, food, ingredients,
 * spawn eggs, operator utilities and survival inventory along the bottom. The seventh tab of each
 * row is aligned right.
 */
/** Vanilla `itemGroup.*` keys of {@link CREATIVE_INVENTORY_TABS}, in the same order. */
const CREATIVE_TAB_KEYS: readonly string[] = [
  'itemGroup.buildingBlocks',
  'itemGroup.coloredBlocks',
  'itemGroup.natural',
  'itemGroup.functional',
  'itemGroup.redstone',
  'itemGroup.hotbar',
  'itemGroup.search',
  'itemGroup.tools',
  'itemGroup.combat',
  'itemGroup.foodAndDrink',
  'itemGroup.ingredients',
  'itemGroup.spawnEggs',
  'itemGroup.op',
  'itemGroup.inventory',
];

export const CREATIVE_INVENTORY_TABS: readonly CreativeInventoryTab[] = [
  { label: 'Building Blocks', item: 'bricks' },
  { label: 'Colored Blocks', item: 'cyan_wool' },
  { label: 'Natural Blocks', item: 'grass_block' },
  { label: 'Functional Blocks', item: 'oak_sign' },
  { label: 'Redstone Blocks', item: 'redstone' },
  { label: 'Saved Hotbars', item: 'bookshelf' },
  { label: 'Search Items', item: 'compass', search: true },
  { label: 'Tools & Utilities', item: 'diamond_pickaxe' },
  { label: 'Combat', item: 'netherite_sword' },
  { label: 'Food & Drinks', item: 'golden_apple' },
  { label: 'Ingredients', item: 'iron_ingot' },
  { label: 'Spawn Eggs', item: 'creeper_spawn_egg' },
  { label: 'Operator Utilities', item: 'command_block' },
  { label: 'Survival Inventory', item: 'chest' },
];

/**
 * Left edge of a tab in a row, `CreativeModeInventoryScreen#getTabX`: 27 per column, with the
 * last column (6) aligned right: `imageWidth - 27 * (7 - column) + 1`.
 */
export function creativeTabX(column: number): number {
  return column === 6 ? CREATIVE_WINDOW_WIDTH - 27 * (7 - column) + 1 : 27 * column;
}

export interface CreativeInventoryPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /**
   * Up to 14 tabs: the first seven go along the top, the rest along the bottom. Defaults to
   * {@link CREATIVE_INVENTORY_TABS}.
   */
  readonly tabs?: readonly CreativeInventoryTab[];
  readonly selectedTab?: number;
  readonly onTabClick?: (index: number) => void;
  /** The 45 item slots of the grid (9 columns by 5 rows), in reading order. */
  readonly items?: readonly (SlotGridItem | undefined)[];
  /** The 9 hotbar slots. */
  readonly hotbar?: readonly (SlotGridItem | undefined)[];
  /** Scroll position of the item grid, 0 to 1. */
  readonly scroll?: number;
  readonly onScrollChange?: (scroll: number) => void;
  /** The grid scrolls only when there are more items than slots. */
  readonly scrollable?: boolean;
  readonly onSlotClick?: (area: 'items' | 'hotbar', index: number) => void;
  /** Text of the search box shown on the search tab. */
  readonly search?: string;
  readonly onSearchChange?: (search: string) => void;
}

export type CreativeInventoryPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  CreativeInventoryPanelOwnProps
>;

/**
 * The interactive part of the creative inventory screen: the tabs along the top and bottom, the
 * 9×5 item grid with its scroller, and the hotbar row. Positions mirror
 * `CreativeModeInventoryScreen`: slots at (9, 18) and (9, 112), scroller at (175, 18), tabs 27
 * apart with the last of each row offset right, the selected tab's name as the title at (8, 6),
 * and on the search tab the search box at (82, 6). The window's artwork is drawn behind it unless
 * `background` is false.
 */
export function CreativeInventoryPanel<E extends ElementType = 'div'>(
  props: CreativeInventoryPanelProps<E>,
): JSX.Element {
  const {
    as,
    background = true,
    tabs: tabsProp,
    selectedTab = 0,
    onTabClick,
    items,
    hotbar,
    scroll = 0,
    onScrollChange,
    scrollable = true,
    onSlotClick,
    search,
    onSearchChange,
    className,
    style,
    ...rest
  } = props as CreativeInventoryPanelProps<'div'>;
  const { tOr } = useTranslation();
  const tabs =
    tabsProp ??
    CREATIVE_INVENTORY_TABS.map((tab, index) => {
      const key = CREATIVE_TAB_KEYS[index];
      return key === undefined ? tab : { ...tab, label: tOr(key, tab.label) };
    });
  const visibleTabs = tabs.slice(0, 14);
  const current = visibleTabs[selectedTab];
  const searching = current?.search === true;
  const { Component, props: root } = usePanelRoot(
    as,
    'creative-panel',
    CREATIVE_WINDOW_WIDTH,
    CREATIVE_WINDOW_HEIGHT + 2 * TAB_MARGIN,
    className,
    style,
    { ...rest, background },
    searching ? 'creative_search' : 'creative',
  );
  return (
    <Component {...root}>
      {visibleTabs.map((tab, index) => {
        const top = index < 7;
        const column = index % 7;
        const icon =
          tab.icon ?? (tab.item === undefined ? undefined : <ItemIcon name={tab.item} />);
        return (
          <Tooltip
            // oxlint-disable-next-line react/no-array-index-key -- tabs are identified by position
            key={index}
            content={tab.label}
          >
            <CreativeTab
              className="cobble-placed"
              style={placeAt(
                creativeTabX(column),
                top ? 0 : TAB_MARGIN + CREATIVE_WINDOW_HEIGHT - 4,
              )}
              label={tab.label}
              row={top ? 'top' : 'bottom'}
              column={(column + 1) as CreativeTabColumn}
              selected={index === selectedTab}
              {...(onTabClick === undefined ? {} : { onClick: () => onTabClick(index) })}
            >
              {icon}
            </CreativeTab>
          </Tooltip>
        );
      })}
      {current === undefined ? null : (
        <Text
          className="cobble-placed cobble-creative-title"
          style={placeAt(8, TAB_MARGIN + 6)}
          color="#404040"
          shadow={false}
        >
          {current.label}
        </Text>
      )}
      {searching ? (
        <TextField
          className="cobble-placed"
          style={placeAt(82, TAB_MARGIN + 6)}
          aria-label={tOr('itemGroup.search', 'Search Items')}
          width={80}
          height={9}
          maxLength={50}
          bordered={false}
          textColor="#ffffff"
          textShadow={false}
          {...(search === undefined ? {} : { value: search })}
          {...(onSearchChange === undefined ? {} : { onValueChange: onSearchChange })}
        />
      ) : null}
      <SlotGrid
        className="cobble-placed"
        style={placeAt(8, TAB_MARGIN + 17)}
        bare={background}
        columns={9}
        rows={5}
        label={tOr('cobble.creative.items', 'Items')}
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('items', i) })}
      />
      <CreativeScroller
        className="cobble-placed"
        style={placeAt(175, TAB_MARGIN + 18)}
        aria-label={tOr('cobble.creative.scroll_items', 'Scroll items')}
        disabled={!scrollable}
        value={scroll}
        {...(onScrollChange === undefined ? {} : { onValueChange: onScrollChange })}
      />
      <SlotGrid
        className="cobble-placed"
        style={placeAt(8, TAB_MARGIN + 111)}
        bare={background}
        columns={9}
        rows={1}
        label={tOr('cobble.creative.hotbar', 'Hotbar')}
        {...(hotbar === undefined ? {} : { items: hotbar })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('hotbar', i) })}
      />
    </Component>
  );
}
