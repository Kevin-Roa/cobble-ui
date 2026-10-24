import { mergeProps } from '@base-ui/react/merge-props';
import type { CSSProperties, ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { BrewArrow, FuelBar } from '../bar/BrewingProgress.tsx';
import { BrewBubbles } from '../bar/BrewingBubbles.tsx';
import { CookingArrow, FuelFlame, type CookingStation } from '../bar/CookingProgress.tsx';
import { StonecutterRecipeButton, StonecutterScroller } from '../button/ContainerButtons.tsx';
import { useTextureUrl } from '../../provider/hooks.ts';
import { cx, placeAt } from '../shared.ts';
import { ContainerError } from '../sprite/ContainerError.tsx';
import { AnvilTextField } from '../text-field/AnvilTextField.tsx';
import { Text } from '../../text/Text.tsx';
import { textWidth, useCharWidth } from '../../text/metrics.ts';
import { InventorySlot, type EmptySlotIcon } from './InventorySlot.tsx';
import { PlayerInventoryGrid, type SlotGridItem } from './SlotGrid.tsx';

/** Colour of a container screen's labels (`AbstractContainerScreen#renderLabels`: `0xFF404040`). */
export const CONTAINER_LABEL_COLOR = '#404040';

/**
 * A label of a container screen (`AbstractContainerScreen#renderLabels`): dark grey, no shadow, at
 * the screen's coordinates. With `center`, `x` is the centre and the text starts at
 * `(2x - width) / 2`, like screens that set `titleLabelX = (imageWidth - width) / 2`.
 * Renders nothing for `null`, `undefined` or `false`.
 */
export function PanelLabel(props: {
  readonly x: number;
  readonly y: number;
  readonly center?: boolean;
  readonly children?: ReactNode;
}): JSX.Element | null {
  const { x, y, center = false, children } = props;
  const width = useCharWidth();
  if (children === null || children === undefined || children === false) return null;
  let left = x;
  let transform: string | undefined;
  if (center) {
    if (typeof children === 'string') left = Math.trunc((2 * x - textWidth(children, width)) / 2);
    else transform = 'translateX(-50%)';
  }
  return (
    <Text
      className="cobble-placed"
      color={CONTAINER_LABEL_COLOR}
      shadow={false}
      style={{ ...placeAt(left, y), ...(transform === undefined ? {} : { transform }) }}
    >
      {children}
    </Text>
  );
}

/** What every container panel takes for its labels and the player's inventory. */
export interface ContainerChromeOwnProps {
  /** The screen's title label; `null` hides it. Each panel defaults to the vanilla one. */
  readonly title?: ReactNode;
  /** The label above the player's inventory; `null` hides it. Defaults to `Inventory`. */
  readonly inventoryTitle?: ReactNode;
  /**
   * Do not draw the player's inventory slots and label. The screen artwork is still drawn.
   * Defaults to false.
   */
  readonly isolate?: boolean | undefined;
  /** Items in the player's 27 main slots and 9 hotbar slots. */
  readonly inventory?: readonly (SlotGridItem | undefined)[] | undefined;
  readonly hotbar?: readonly (SlotGridItem | undefined)[] | undefined;
  /** A player inventory slot was clicked; `index` is within its area. */
  readonly onInventoryClick?: ((area: 'main' | 'hotbar', index: number) => void) | undefined;
}

/**
 * The labels and the player's inventory every container screen has: the title, the `Inventory`
 * label (`inventoryLabelY = imageHeight - 94`) and the 27 + 9 slots. Slots are drawn bare when the
 * screen's artwork already has them.
 */
export function ContainerChrome(
  props: ContainerChromeOwnProps & {
    readonly background: boolean;
    readonly titleX?: number;
    readonly titleY?: number;
    readonly titleCenter?: boolean;
    readonly inventoryLabelX?: number;
    readonly inventoryLabelY?: number;
    /** Top-left of the slot box of the first inventory slot. */
    readonly inventoryX?: number;
    readonly inventoryY?: number;
  },
): JSX.Element {
  const {
    title,
    inventoryTitle = 'Inventory',
    isolate = false,
    inventory,
    hotbar,
    onInventoryClick,
    background,
    titleX = 8,
    titleY = 6,
    titleCenter = false,
    inventoryLabelX = 8,
    inventoryLabelY = 72,
    inventoryX = 7,
    inventoryY = 83,
  } = props;
  return (
    <>
      <PanelLabel x={titleX} y={titleY} center={titleCenter}>
        {title}
      </PanelLabel>
      {isolate ? null : (
        <>
          <PanelLabel x={inventoryLabelX} y={inventoryLabelY}>
            {inventoryTitle}
          </PanelLabel>
          <PlayerInventoryGrid
            className="cobble-placed"
            style={placeAt(inventoryX, inventoryY)}
            bare={background}
            {...(inventory === undefined ? {} : { items: inventory })}
            {...(hotbar === undefined ? {} : { hotbar })}
            {...(onInventoryClick === undefined ? {} : { onSlotClick: onInventoryClick })}
          />
        </>
      )}
    </>
  );
}

/** A slot at the screen's item coordinates; the 18×18 slot starts one unit before the item. */
export function StationSlot(props: {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly item?: SlotGridItem | undefined;
  readonly emptyIcon?: EmptySlotIcon;
  /** Draw no slot of its own: the panel's background already has one. */
  readonly bare?: boolean;
  readonly onClick?: () => void;
}): JSX.Element {
  const { x, y, label, item, emptyIcon, bare, onClick } = props;
  return (
    <InventorySlot
      className="cobble-placed"
      aria-label={item?.label ?? label}
      style={placeAt(x - 1, y - 1)}
      {...(bare === true ? { bare } : {})}
      {...(item?.count === undefined ? {} : { count: item.count })}
      {...(emptyIcon === undefined ? {} : { emptyIcon })}
      {...(onClick === undefined ? {} : { onClick })}
    >
      {item?.content}
    </InventorySlot>
  );
}

/** A container screen's background in the client (`textures/gui/container/*.png`, a 256-wide sheet). */
interface ContainerTexture {
  readonly texture: string;
  /** Size of the screen's window (`imageWidth` × `imageHeight`). */
  readonly width: number;
  readonly height: number;
  readonly sheetWidth?: number;
  readonly sheetHeight?: number;
  /** Where the window starts inside the panel. */
  readonly offsetY?: number;
  /**
   * Height of the part above the player inventory. Without the inventory only this part and the
   * window's bottom edge are drawn, like the game's own split blits.
   */
  readonly cut?: number;
}

/** Height of the window's bottom edge kept when the inventory part is cropped away. */
const CONTAINER_BOTTOM_EDGE = 4;

const CONTAINER_TEXTURES: Readonly<Record<string, ContainerTexture>> = {
  anvil: { texture: 'anvil', width: 176, height: 166 },
  beacon: { texture: 'beacon', width: 230, height: 219 },
  blast_furnace: { texture: 'blast_furnace', width: 176, height: 166 },
  brewing: { texture: 'brewing_stand', width: 176, height: 166 },
  cartography: { texture: 'cartography_table', width: 176, height: 166 },
  crafter: { texture: 'crafter', width: 176, height: 166 },
  crafting_table: { texture: 'crafting_table', width: 176, height: 166 },
  creative: {
    texture: 'creative_inventory/tab_items',
    width: 195,
    height: 136,
    offsetY: 28,
  },
  creative_search: {
    texture: 'creative_inventory/tab_item_search',
    width: 195,
    height: 136,
    offsetY: 28,
  },
  dispenser: { texture: 'dispenser', width: 176, height: 166, cut: 73 },
  enchanting: { texture: 'enchanting_table', width: 176, height: 166 },
  furnace: { texture: 'furnace', width: 176, height: 166 },
  grindstone: { texture: 'grindstone', width: 176, height: 166 },
  inventory: { texture: 'inventory', width: 176, height: 166 },
  hopper: { texture: 'hopper', width: 176, height: 133, cut: 40 },
  loom: { texture: 'loom', width: 176, height: 166 },
  smithing: { texture: 'smithing', width: 176, height: 166 },
  smoker: { texture: 'smoker', width: 176, height: 166 },
  stonecutter: { texture: 'stonecutter', width: 176, height: 166 },
  trade: { texture: 'villager', width: 276, height: 166, sheetWidth: 512 },
};

/** The names a panel can draw its background for (`CONTAINER_TEXTURES` keys). */
export type ContainerBackgroundName = string;

/**
 * The real screen artwork behind a panel's slots: the window part of the screen's texture, at the
 * screen's own coordinates, so a panel lines up with the game's screen. Grows the panel to the
 * window's size; pass `enabled = false` to get the bare interactive area instead.
 */
export function useContainerBackground(
  name: ContainerBackgroundName,
  width: number,
  height: number,
  enabled: boolean,
  compact = false,
): {
  readonly width: number;
  readonly height: number;
  readonly style: CssVariables;
  readonly attributes: {
    readonly 'data-container-background'?: '';
    readonly 'data-container-compact'?: '';
  };
} {
  const info = CONTAINER_TEXTURES[name];
  const url = useTextureUrl(`gui/container/${info?.texture ?? ''}`);
  if (!enabled || info === undefined) return { width, height, style: {}, attributes: {} };
  const cut = compact ? info.cut : undefined;
  const style: CssVariables = {
    '--cobble-container-width': info.width,
    '--cobble-container-height': cut ?? info.height,
    '--cobble-container-full-height': info.height,
    '--cobble-container-edge': CONTAINER_BOTTOM_EDGE,
    '--cobble-container-sheet-width': info.sheetWidth ?? 256,
    '--cobble-container-sheet-height': info.sheetHeight ?? 256,
    '--cobble-container-y': info.offsetY ?? 0,
    ...(url === undefined ? {} : { '--cobble-container-image': `url("${url}")` }),
  };
  if (cut !== undefined) {
    return {
      width: info.width,
      height: cut + CONTAINER_BOTTOM_EDGE,
      style,
      attributes: {
        'data-container-background': '',
        'data-container-compact': '',
      },
    };
  }
  return {
    width: Math.max(width, info.width),
    height: Math.max(height, info.height + (info.offsetY ?? 0) * 2),
    style,
    attributes: { 'data-container-background': '' },
  };
}

export function usePanelRoot<E extends ElementType>(
  as: E | undefined,
  name: string,
  width: number,
  height: number,
  className: string | undefined,
  style: CSSProperties | undefined,
  rest: object,
  texture: ContainerBackgroundName = name.replace(/-panel$/, ''),
  compact = false,
): {
  readonly Component: ElementType;
  readonly props: Record<string, unknown>;
} {
  const { background = true, ...others } = rest as {
    readonly background?: boolean;
  };
  const container = useContainerBackground(texture, width, height, background, compact);
  const rootStyle: CssVariables = {
    '--cobble-width': container.width,
    '--cobble-height': container.height,
    ...container.style,
    ...style,
  };
  return {
    Component: as ?? 'div',
    props: mergeProps<'div'>(
      {
        className: cx('cobble-station-panel', `cobble-${name}`, className),
        style: rootStyle,
        ...container.attributes,
      },
      others,
    ) as Record<string, unknown>,
  };
}

// ----------------------------------------------------------------------------------- anvil

export type AnvilSlot = 'left' | 'right' | 'result';

export interface AnvilPanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly left?: SlotGridItem | undefined;
  readonly right?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  /** The item's new name. */
  readonly name?: string;
  readonly onNameChange?: (name: string) => void;
  /** The combination is not allowed: draws the red cross over the arrow. */
  readonly error?: boolean;
  readonly onSlotClick?: (slot: AnvilSlot) => void;
}

export type AnvilPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  AnvilPanelOwnProps
>;

/**
 * The interactive part of the anvil screen: the two input slots, the result, the name field and
 * the error cross, at the game's own coordinates (recalled from vanilla, so approximate).
 */
export function AnvilPanel<E extends ElementType = 'div'>(props: AnvilPanelProps<E>): JSX.Element {
  const {
    as,
    left,
    right,
    result,
    name = '',
    onNameChange,
    error = false,
    onSlotClick,
    className,
    style,
    title = 'Repair & Name',
    inventoryTitle,
    isolate,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    ...rest
  } = props as AnvilPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(as, 'anvil-panel', 169, 66, className, style, {
    ...rest,
    background,
  });
  const click = (slot: AnvilSlot): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      <AnvilTextField
        className="cobble-placed"
        aria-label="Item name"
        style={placeAt(59, 20)}
        value={name}
        disabled={left === undefined}
        {...(onNameChange === undefined ? {} : { onValueChange: onNameChange })}
      />
      <StationSlot x={27} y={47} label="Anvil first input" item={left} {...click('left')} />
      <StationSlot x={76} y={47} label="Anvil second input" item={right} {...click('right')} />
      <StationSlot x={134} y={47} label="Anvil result" item={result} {...click('result')} />
      {error ? (
        <ContainerError className="cobble-placed" kind="anvil" style={placeAt(99, 45)} />
      ) : null}
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        titleX={60}
      />
    </Component>
  );
}

// ------------------------------------------------------------------------------ brewing stand

export type BrewingSlot = 'bottle-1' | 'bottle-2' | 'bottle-3' | 'ingredient' | 'fuel';

/** Ticks a brew takes (`BrewingStandMenu`). */
export const BREW_TOTAL_TICKS = 400;

export interface BrewingStandPanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** The three potion bottles, left to right. */
  readonly bottles?: readonly (SlotGridItem | undefined)[];
  readonly ingredient?: SlotGridItem | undefined;
  readonly fuel?: SlotGridItem | undefined;
  /** Ticks left in the current brew; 0 when idle. */
  readonly brewTime?: number;
  /** Blaze powder charges left, 0 to 20. */
  readonly fuelCharges?: number;
  readonly onSlotClick?: (slot: BrewingSlot) => void;
}

export type BrewingStandPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  BrewingStandPanelOwnProps
>;

/** Progress through a brew for `brewTime` ticks remaining: `1 - brewTime / 400`, 0 when idle. */
export function brewProgress(brewTime: number): number {
  if (!(brewTime > 0)) return 0;
  return Math.min(Math.max(1 - brewTime / BREW_TOTAL_TICKS, 0), 1);
}

/**
 * The interactive part of the brewing stand screen: three bottle slots, the ingredient and fuel
 * slots, the blaze powder bar, the brewing arrow and the bubbles. Coordinates are recalled from
 * vanilla and are approximations; the stand's own artwork is drawn behind it unless `background` is false.
 */
export function BrewingStandPanel<E extends ElementType = 'div'>(
  props: BrewingStandPanelProps<E>,
): JSX.Element {
  const {
    as,
    bottles = [],
    ingredient,
    fuel,
    brewTime = 0,
    fuelCharges = 0,
    onSlotClick,
    className,
    style,
    title = 'Brewing Stand',
    inventoryTitle,
    isolate,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    ...rest
  } = props as BrewingStandPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(as, 'brewing-panel', 119, 76, className, style, {
    ...rest,
    background,
  });
  const click = (slot: BrewingSlot): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  const bottlePositions = [
    { x: 56, y: 51, slot: 'bottle-1' },
    { x: 79, y: 58, slot: 'bottle-2' },
    { x: 102, y: 51, slot: 'bottle-3' },
  ] as const;
  return (
    <Component {...root}>
      <FuelBar className="cobble-placed" style={placeAt(60, 44)} fuel={fuelCharges} />
      <BrewBubbles className="cobble-placed" style={placeAt(63, 14)} brewTime={brewTime} />
      <BrewArrow
        className="cobble-placed"
        style={placeAt(97, 16)}
        progress={brewProgress(brewTime)}
      />
      <StationSlot
        x={17}
        y={17}
        label="Blaze powder"
        item={fuel}
        emptyIcon="brewing_fuel"
        {...click('fuel')}
      />
      <StationSlot
        x={79}
        y={17}
        label="Brewing ingredient"
        item={ingredient}
        {...click('ingredient')}
      />
      {bottlePositions.map(({ x, y, slot }, index) => (
        <StationSlot
          key={slot}
          x={x}
          y={y}
          label={`Potion bottle ${String(index + 1)}`}
          item={bottles[index]}
          emptyIcon="potion"
          {...click(slot)}
        />
      ))}
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        titleX={88}
        titleCenter
      />
    </Component>
  );
}

// --------------------------------------------------------------------------------- furnace

export type FurnaceSlot = 'input' | 'fuel' | 'output';

export interface FurnacePanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly input?: SlotGridItem | undefined;
  readonly fuel?: SlotGridItem | undefined;
  readonly output?: SlotGridItem | undefined;
  /** Progress through the current item, 0 to 1. */
  readonly cookProgress?: number;
  /** Fuel left in the current item, 0 to 1. */
  readonly litProgress?: number;
  readonly station?: CookingStation;
  readonly onSlotClick?: (slot: FurnaceSlot) => void;
}

export type FurnacePanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  FurnacePanelOwnProps
>;

/**
 * The interactive part of the furnace, smoker and blast furnace screens: input, fuel and output
 * slots, the flame and the cooking arrow. Coordinates are recalled from vanilla and are
 * approximations; the furnace's own artwork is drawn behind it unless `background` is false.
 */
export function FurnacePanel<E extends ElementType = 'div'>(
  props: FurnacePanelProps<E>,
): JSX.Element {
  const {
    as,
    input,
    fuel,
    output,
    cookProgress = 0,
    litProgress = 0,
    station = 'furnace',
    onSlotClick,
    className,
    style,
    title,
    inventoryTitle,
    isolate,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    ...rest
  } = props as FurnacePanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'furnace-panel',
    134,
    72,
    className,
    style,
    { ...rest, background },
    station === 'furnace' ? 'furnace' : station === 'smoker' ? 'smoker' : 'blast_furnace',
  );
  const click = (slot: FurnaceSlot): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      <FuelFlame
        className="cobble-placed"
        style={placeAt(56, 36)}
        lit={litProgress}
        station={station}
      />
      <CookingArrow
        className="cobble-placed"
        style={placeAt(79, 34)}
        progress={cookProgress}
        station={station}
      />
      <StationSlot x={56} y={17} label="Furnace input" item={input} {...click('input')} />
      <StationSlot x={56} y={53} label="Furnace fuel" item={fuel} {...click('fuel')} />
      <StationSlot x={116} y={35} label="Furnace output" item={output} {...click('output')} bare />
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        title={
          title === undefined
            ? station === 'furnace'
              ? 'Furnace'
              : station === 'smoker'
                ? 'Smoker'
                : 'Blast Furnace'
            : title
        }
        titleX={88}
        titleCenter
      />
    </Component>
  );
}

// ----------------------------------------------------------------------------- stonecutter

/** Columns and visible rows of the stonecutter's recipe grid. */
export const STONECUTTER_COLUMNS = 4;
export const STONECUTTER_VISIBLE_ROWS = 3;

/**
 * Index of the first visible recipe for a scroll position: `(int)(scroll * offscreenRows + 0.5)`
 * whole rows down (`StonecutterScreen#startIndex`).
 */
export function stonecutterStartIndex(scroll: number, recipeCount: number): number {
  const rows = Math.ceil(recipeCount / STONECUTTER_COLUMNS);
  const offscreen = Math.max(rows - STONECUTTER_VISIBLE_ROWS, 0);
  const clamped = Math.min(Math.max(Number.isFinite(scroll) ? scroll : 0, 0), 1);
  return Math.floor(clamped * offscreen + 0.5) * STONECUTTER_COLUMNS;
}

export interface StonecutterRecipe {
  /** The result item. Supply your own. */
  readonly content: ReactNode;
  /** Accessible name, e.g. `Stone Stairs`. */
  readonly label: string;
}

export interface StonecutterPanelOwnProps extends ContainerChromeOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly input?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  readonly recipes?: readonly StonecutterRecipe[];
  readonly selectedRecipe?: number | null;
  readonly onRecipeClick?: (index: number) => void;
  /** Scroll position of the recipe grid, 0 to 1. */
  readonly scroll?: number;
  readonly onScrollChange?: (scroll: number) => void;
  readonly onSlotClick?: (slot: 'input' | 'result') => void;
}

export type StonecutterPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  StonecutterPanelOwnProps
>;

/**
 * The interactive part of the stonecutter screen: the input and result slots, the 4×3 grid of
 * recipe cells with its scroller. Coordinates are recalled from vanilla and are approximations.
 */
export function StonecutterPanel<E extends ElementType = 'div'>(
  props: StonecutterPanelProps<E>,
): JSX.Element {
  const {
    as,
    input,
    result,
    recipes = [],
    selectedRecipe = null,
    onRecipeClick,
    scroll = 0,
    onScrollChange,
    onSlotClick,
    className,
    style,
    title = 'Stonecutter',
    inventoryTitle,
    isolate,
    inventory,
    hotbar,
    onInventoryClick,
    background = true,
    ...rest
  } = props as StonecutterPanelProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'stonecutter-panel',
    161,
    69,
    className,
    style,
    { ...rest, background },
  );
  const start = stonecutterStartIndex(scroll, recipes.length);
  const visible = recipes.slice(start, start + STONECUTTER_COLUMNS * STONECUTTER_VISIBLE_ROWS);
  const scrollable = recipes.length > STONECUTTER_COLUMNS * STONECUTTER_VISIBLE_ROWS;
  return (
    <Component {...root}>
      <StationSlot
        x={20}
        y={33}
        label="Stonecutter input"
        item={input}
        {...(onSlotClick === undefined ? {} : { onClick: () => onSlotClick('input') })}
      />
      <StationSlot
        x={143}
        y={33}
        label="Stonecutter result"
        item={result}
        {...(onSlotClick === undefined ? {} : { onClick: () => onSlotClick('result') })}
        bare
      />
      {visible.map((recipe, offset) => {
        const index = start + offset;
        return (
          <StonecutterRecipeButton
            key={index}
            className="cobble-placed"
            style={placeAt(
              52 + (offset % STONECUTTER_COLUMNS) * 16,
              15 + Math.floor(offset / STONECUTTER_COLUMNS) * 18,
            )}
            label={recipe.label}
            selected={index === selectedRecipe}
            {...(onRecipeClick === undefined ? {} : { onClick: () => onRecipeClick(index) })}
          >
            {recipe.content}
          </StonecutterRecipeButton>
        );
      })}
      <StonecutterScroller
        className="cobble-placed"
        style={placeAt(119, 15)}
        disabled={!scrollable}
        value={scroll}
        {...(onScrollChange === undefined ? {} : { onValueChange: onScrollChange })}
      />
      <ContainerChrome
        background={background}
        {...{ title, inventoryTitle, isolate, inventory, hotbar, onInventoryClick }}
        titleY={5}
      />
    </Component>
  );
}
