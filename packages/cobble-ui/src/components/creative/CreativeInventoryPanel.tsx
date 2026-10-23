import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { placeAt } from '../shared.ts';
import { SlotGrid, type SlotGridItem } from '../slot/SlotGrid.tsx';
import { usePanelRoot } from '../slot/StationPanels.tsx';
import { CreativeScroller } from './CreativeScroller.tsx';
import { CreativeTab, type CreativeTabColumn } from './CreativeTab.tsx';

/** Size of the creative inventory window itself, without its tabs. */
export const CREATIVE_WINDOW_WIDTH = 195;
export const CREATIVE_WINDOW_HEIGHT = 136;
/** Room the tabs take above and below the window. */
const TAB_MARGIN = 28;

export interface CreativeInventoryTab {
  /** Accessible name, e.g. `Building Blocks`. */
  readonly label: string;
  /** The tab icon. Supply your own. */
  readonly icon?: ReactNode;
}

export interface CreativeInventoryPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** Up to 14 tabs: the first seven go along the top, the rest along the bottom. */
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
}

export type CreativeInventoryPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  CreativeInventoryPanelOwnProps
>;

/**
 * The interactive part of the creative inventory screen: the tabs along the top and bottom, the
 * 9×5 item grid with its scroller, and the hotbar row. Coordinates are recalled from vanilla and
 * are approximations; the window's artwork is drawn behind it unless `background` is false.
 */
export function CreativeInventoryPanel<E extends ElementType = 'div'>(
  props: CreativeInventoryPanelProps<E>,
): JSX.Element {
  const {
    as,
    tabs = [],
    selectedTab = 0,
    onTabClick,
    items,
    hotbar,
    scroll = 0,
    onScrollChange,
    scrollable = true,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as CreativeInventoryPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'creative-panel',
    CREATIVE_WINDOW_WIDTH,
    CREATIVE_WINDOW_HEIGHT + 2 * TAB_MARGIN,
    className,
    style,
    rest,
  );
  return (
    <Component {...root}>
      {tabs.slice(0, 14).map((tab, index) => {
        const top = index < 7;
        const column = ((index % 7) + 1) as CreativeTabColumn;
        return (
          <CreativeTab
            // oxlint-disable-next-line react/no-array-index-key -- tabs are identified by position
            key={index}
            className="cobble-placed"
            style={placeAt(27 * (index % 7), top ? 0 : TAB_MARGIN + CREATIVE_WINDOW_HEIGHT - 4)}
            label={tab.label}
            row={top ? 'top' : 'bottom'}
            column={column}
            selected={index === selectedTab}
            {...(onTabClick === undefined ? {} : { onClick: () => onTabClick(index) })}
          >
            {tab.icon}
          </CreativeTab>
        );
      })}
      <SlotGrid
        className="cobble-placed"
        style={placeAt(9, TAB_MARGIN + 18)}
        columns={9}
        rows={5}
        label="Items"
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('items', i) })}
      />
      <CreativeScroller
        className="cobble-placed"
        style={placeAt(175, TAB_MARGIN + 18)}
        aria-label="Scroll items"
        disabled={!scrollable}
        value={scroll}
        {...(onScrollChange === undefined ? {} : { onValueChange: onScrollChange })}
      />
      <SlotGrid
        className="cobble-placed"
        style={placeAt(9, TAB_MARGIN + 112)}
        columns={9}
        rows={1}
        label="Hotbar"
        {...(hotbar === undefined ? {} : { items: hotbar })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (i: number) => onSlotClick('hotbar', i) })}
      />
    </Component>
  );
}
