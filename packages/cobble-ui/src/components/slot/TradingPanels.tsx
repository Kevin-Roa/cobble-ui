import { Fragment, type ElementType, type JSX, type ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Button } from '../button/Button.tsx';
import { VillagerScroller } from '../trade/VillagerScroller.tsx';
import { TradeArrow, VillagerXpBar } from '../trade/Trade.tsx';
import { placeAt } from '../shared.ts';
import { SlotGrid, type SlotGridItem } from './SlotGrid.tsx';
import {
  ContainerChrome,
  PanelLabel,
  StationSlot,
  usePanelRoot,
  type ContainerChromeOwnProps,
} from './StationPanels.tsx';

// --------------------------------------------------------------------------------- villager

/** Number of trade rows visible at once, and the size of a trade button. */
export const TRADE_VISIBLE_ROWS = 7;
export const TRADE_BUTTON_WIDTH = 88;
export const TRADE_BUTTON_HEIGHT = 20;

export interface TradeOffer {
  /** Accessible name, e.g. `2 Emerald for Bread`. */
  readonly label: string;
  /** The first item asked for, drawn in a 16×16 area. */
  readonly buy: ReactNode;
  /** The second item asked for, if any. */
  readonly buy2?: ReactNode;
  /** The item given. */
  readonly sell: ReactNode;
  /** The trade is used up: the arrow is crossed out and the button cannot be used. */
  readonly outOfStock?: boolean;
}

/**
 * Index of the first visible trade for a scroll position, `(int)(scroll * (count - 7) + 0.5)`
 * (`MerchantScreen#scrollOff`).
 */
export function tradeStartIndex(scroll: number, offerCount: number): number {
  const offscreen = Math.max(offerCount - TRADE_VISIBLE_ROWS, 0);
  const clamped = Math.min(Math.max(Number.isFinite(scroll) ? scroll : 0, 0), 1);
  return Math.floor(clamped * offscreen + 0.5);
}

export interface VillagerTradePanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly offers?: readonly TradeOffer[];
  readonly selectedOffer?: number | null;
  readonly onOfferClick?: (index: number) => void;
  /** Scroll position of the trade list, 0 to 1. */
  readonly scroll?: number;
  readonly onScrollChange?: (scroll: number) => void;
  /** The two payment slots and the result of the selected trade. */
  readonly payment?: readonly (SlotGridItem | undefined)[];
  readonly result?: SlotGridItem | undefined;
  /** Progress through the villager's level, 0 to 1. Omitted for a wandering trader. */
  readonly levelProgress?: number;
  readonly onSlotClick?: (slot: 'payment-1' | 'payment-2' | 'result') => void;
  /** The label above the trade list. Defaults to `Trades`; `null` hides it. */
  readonly tradesTitle?: ReactNode;
}

export type VillagerTradePanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  VillagerTradePanelOwnProps
>;

/**
 * The interactive part of the villager trading screen: the scrollable list of up to seven trades,
 * its scroller, the level bar and the two payment slots with the result. Coordinates are recalled
 * from vanilla and are approximations; the screen's artwork is drawn behind it unless `background` is false.
 */
export function VillagerTradePanel<E extends ElementType = 'div'>(
  props: VillagerTradePanelProps<E>,
): JSX.Element {
  const {
    as,
    offers = [],
    selectedOffer = null,
    onOfferClick,
    scroll = 0,
    onScrollChange,
    payment = [],
    result,
    levelProgress,
    onSlotClick,
    tradesTitle = 'Trades',
    title = 'Villager',
    inventoryTitle,
    isolate,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    className,
    style,
    ...rest
  } = props as VillagerTradePanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(as, 'trade-panel', 240, 158, className, style, {
    ...rest,
    background,
  });
  const start = tradeStartIndex(scroll, offers.length);
  const visible = offers.slice(start, start + TRADE_VISIBLE_ROWS);
  const click = (slot: 'payment-1' | 'payment-2' | 'result'): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      {visible.map((offer, offset) => {
        const index = start + offset;
        const top = 18 + offset * TRADE_BUTTON_HEIGHT;
        return (
          <Fragment key={index}>
            <Button
              className="cobble-placed cobble-trade-button"
              style={placeAt(5, top)}
              width={TRADE_BUTTON_WIDTH}
              height={TRADE_BUTTON_HEIGHT}
              aria-label={offer.label}
              aria-pressed={index === selectedOffer}
              disabled={offer.outOfStock === true}
              highlighted={index === selectedOffer}
              {...(onOfferClick === undefined ? {} : { onClick: () => onOfferClick(index) })}
            />
            <span className="cobble-placed cobble-trade-items" aria-hidden style={placeAt(5, top)}>
              <span className="cobble-trade-item" style={placeAt(5, 2)}>
                {offer.buy}
              </span>
              {offer.buy2 === undefined ? null : (
                <span className="cobble-trade-item" style={placeAt(35, 2)}>
                  {offer.buy2}
                </span>
              )}
              <TradeArrow
                className="cobble-trade-arrow"
                outOfStock={offer.outOfStock === true}
                style={placeAt(57, 5)}
              />
              <span className="cobble-trade-item" style={placeAt(68, 2)}>
                {offer.sell}
              </span>
            </span>
          </Fragment>
        );
      })}
      <VillagerScroller
        className="cobble-placed"
        style={placeAt(94, 18)}
        height={TRADE_VISIBLE_ROWS * TRADE_BUTTON_HEIGHT}
        disabled={offers.length <= TRADE_VISIBLE_ROWS}
        value={scroll}
        {...(onScrollChange === undefined ? {} : { onValueChange: onScrollChange })}
      />
      {levelProgress === undefined ? null : (
        <VillagerXpBar
          className="cobble-placed"
          style={placeAt(136, 16)}
          progress={levelProgress}
        />
      )}
      <StationSlot
        x={136}
        y={37}
        label="First payment"
        item={payment[0]}
        bare={background}
        {...click('payment-1')}
      />
      <StationSlot
        x={162}
        y={37}
        label="Second payment"
        item={payment[1]}
        bare={background}
        {...click('payment-2')}
      />
      <StationSlot
        x={220}
        y={37}
        label="Trade result"
        item={result}
        bare={background}
        {...click('result')}
      />
      {offers.length > 0 ? (
        <PanelLabel x={53} y={6} center>
          {tradesTitle}
        </PanelLabel>
      ) : null}
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        titleX={187}
        titleCenter
        inventoryLabelX={107}
        inventoryX={107}
      />
    </Component>
  );
}

// ------------------------------------------------------------------------- hopper, dispenser

export interface SlotsPanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly items?: readonly (SlotGridItem | undefined)[];
  readonly onSlotClick?: (index: number) => void;
}

export type HopperPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SlotsPanelOwnProps
>;
export type DispenserPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  SlotsPanelOwnProps
>;

/** The hopper's row of five slots, 18 units apart, at the screen's coordinates (approximate). */
export function HopperPanel<E extends ElementType = 'div'>(
  props: HopperPanelProps<E>,
): JSX.Element {
  const {
    as,
    items,
    onSlotClick,
    title = 'Item Hopper',
    inventoryTitle,
    isolate = false,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    className,
    style,
    ...rest
  } = props as HopperPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'hopper-panel',
    176,
    isolate ? 40 : 133,
    className,
    style,
    { ...rest, background },
    undefined,
    isolate,
  );
  return (
    <Component {...root}>
      <SlotGrid
        className="cobble-placed"
        style={placeAt(43, 19)}
        bare={background}
        columns={5}
        rows={1}
        label="Hopper"
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined ? {} : { onSlotClick })}
      />
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        inventoryLabelY={39}
        inventoryY={50}
      />
    </Component>
  );
}

/** The dispenser and dropper's 3×3 grid at the screen's coordinates (approximate). */
export function DispenserPanel<E extends ElementType = 'div'>(
  props: DispenserPanelProps<E>,
): JSX.Element {
  const {
    as,
    items,
    onSlotClick,
    title = 'Dispenser',
    inventoryTitle,
    isolate = false,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    className,
    style,
    ...rest
  } = props as DispenserPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'dispenser-panel',
    176,
    isolate ? 73 : 166,
    className,
    style,
    { ...rest, background },
    undefined,
    isolate,
  );
  return (
    <Component {...root}>
      <SlotGrid
        className="cobble-placed"
        style={placeAt(61, 16)}
        bare={background}
        columns={3}
        rows={3}
        label="Dispenser"
        {...(items === undefined ? {} : { items })}
        {...(onSlotClick === undefined ? {} : { onSlotClick })}
      />
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        inventoryLabelY={72}
        inventoryY={83}
      />
    </Component>
  );
}
