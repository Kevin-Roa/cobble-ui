import type { ElementType, JSX, ReactNode } from "react";
import type { PolymorphicProps } from "../../internal/polymorphic.ts";
import {
  LoomPatternButton,
  LoomScroller,
} from "../button/ContainerButtons.tsx";
import { BeaconButton } from "./BeaconButton.tsx";
import { placeAt } from "../shared.ts";
import {
  ARMOR_STAND_VIEWPORT_FEET,
  ARMOR_STAND_VIEWPORT_WIDTH,
  ArmorStand,
  SMITHING_ARMOR_STAND_X,
  SMITHING_ARMOR_STAND_Y,
} from "./ArmorStand.tsx";
import {
  CartographyMap,
  CrafterRedstone,
  CrafterSlot,
} from "./ContainerParts.tsx";
import { ContainerError } from "../sprite/ContainerError.tsx";
import type { SlotGridItem } from "./SlotGrid.tsx";
import { StationSlot, usePanelRoot } from "./StationPanels.tsx";

// -------------------------------------------------------------------------------------- loom

export interface LoomPattern {
  /** The pattern preview. Supply your own. */
  readonly content?: ReactNode;
  readonly label: string;
}

export interface LoomPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly banner?: SlotGridItem | undefined;
  readonly dye?: SlotGridItem | undefined;
  readonly patternItem?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  readonly patterns?: readonly LoomPattern[];
  readonly selectedPattern?: number | null;
  readonly onPatternClick?: (index: number) => void;
  /** Scroll position of the pattern grid, 0 to 1. */
  readonly scroll?: number;
  readonly onScrollChange?: (scroll: number) => void;
  readonly onSlotClick?: (
    slot: "banner" | "dye" | "patternItem" | "result",
  ) => void;
}

export type LoomPanelProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  LoomPanelOwnProps
>;

/** Columns and visible rows of the loom's pattern grid. */
export const LOOM_COLUMNS = 4;
export const LOOM_VISIBLE_ROWS = 4;

/**
 * Index of the first visible pattern for a scroll position, in whole rows of four
 * (`LoomScreen#startRow`): `(int)(scroll * offscreenRows + 0.5)`.
 */
export function loomStartIndex(scroll: number, patternCount: number): number {
  const rows = Math.ceil(patternCount / LOOM_COLUMNS);
  const offscreen = Math.max(rows - LOOM_VISIBLE_ROWS, 0);
  const clamped = Math.min(
    Math.max(Number.isFinite(scroll) ? scroll : 0, 0),
    1,
  );
  return Math.floor(clamped * offscreen + 0.5) * LOOM_COLUMNS;
}

/**
 * The interactive part of the loom screen: banner, dye, pattern item and result slots, and the
 * grid of pattern cells with its scroller. Coordinates are recalled from vanilla and are
 * approximations; the screen's artwork is drawn behind it unless `background` is false.
 */
export function LoomPanel<E extends ElementType = "div">(
  props: LoomPanelProps<E>,
): JSX.Element {
  const {
    as,
    banner,
    dye,
    patternItem,
    result,
    patterns = [],
    selectedPattern = null,
    onPatternClick,
    scroll = 0,
    onScrollChange,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as LoomPanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "loom-panel",
    161,
    76,
    className,
    style,
    rest,
  );
  const click = (
    slot: "banner" | "dye" | "patternItem" | "result",
  ): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  const start = loomStartIndex(scroll, patterns.length);
  const visible = patterns.slice(
    start,
    start + LOOM_COLUMNS * LOOM_VISIBLE_ROWS,
  );
  return (
    <Component {...root}>
      <StationSlot
        x={13}
        y={26}
        label="Banner"
        item={banner}
        {...click("banner")}
      />
      <StationSlot x={33} y={26} label="Dye" item={dye} {...click("dye")} />
      <StationSlot
        x={23}
        y={45}
        label="Banner pattern"
        item={patternItem}
        {...click("patternItem")}
      />
      <StationSlot
        x={143}
        y={57}
        label="Loom result"
        item={result}
        {...click("result")}
        bare
      />
      {visible.map((pattern, offset) => {
        const index = start + offset;
        return (
          <LoomPatternButton
            key={index}
            className="cobble-placed"
            style={placeAt(
              60 + (offset % LOOM_COLUMNS) * 14,
              13 + Math.floor(offset / LOOM_COLUMNS) * 14,
            )}
            label={pattern.label}
            selected={index === selectedPattern}
            {...(onPatternClick === undefined
              ? {}
              : { onClick: () => onPatternClick(index) })}
          >
            {pattern.content}
          </LoomPatternButton>
        );
      })}
      <LoomScroller
        className="cobble-placed"
        style={placeAt(119, 12)}
        disabled={patterns.length <= LOOM_COLUMNS * LOOM_VISIBLE_ROWS}
        value={scroll}
        {...(onScrollChange === undefined
          ? {}
          : { onValueChange: onScrollChange })}
      />
    </Component>
  );
}

// ------------------------------------------------------------------------------- cartography

export interface CartographyPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly map?: SlotGridItem | undefined;
  readonly material?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  /** What the preview frame shows; omit for none. */
  readonly preview?: "map" | "scaled" | "duplicated" | undefined;
  /** The map is locked: the small padlock is drawn. */
  readonly locked?: boolean;
  /** The combination is not allowed: draws the red cross. */
  readonly error?: boolean;
  /** The map preview contents, drawn inside the frame. Supply your own. */
  readonly children?: ReactNode;
  readonly onSlotClick?: (slot: "map" | "material" | "result") => void;
}

export type CartographyPanelProps<E extends ElementType = "div"> =
  PolymorphicProps<E, CartographyPanelOwnProps>;

/**
 * The interactive part of the cartography table screen: map, material and result slots, the
 * preview frame (plain, zoomed out or copied) with the padlock, and the error cross. Coordinates
 * are recalled from vanilla and are approximations.
 */
export function CartographyPanel<E extends ElementType = "div">(
  props: CartographyPanelProps<E>,
): JSX.Element {
  const {
    as,
    map,
    material,
    result,
    preview,
    locked = false,
    error = false,
    children,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as CartographyPanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "cartography-panel",
    165,
    80,
    className,
    style,
    rest,
  );
  const click = (
    slot: "map" | "material" | "result",
  ): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      <StationSlot x={15} y={15} label="Map" item={map} {...click("map")} />
      <StationSlot
        x={15}
        y={52}
        label="Material"
        item={material}
        {...click("material")}
      />
      <StationSlot
        x={145}
        y={39}
        label="Cartography result"
        item={result}
        {...click("result")}
        bare
      />
      {preview === undefined ? null : (
        <CartographyMap
          className="cobble-placed"
          kind={preview}
          style={placeAt(preview === "duplicated" ? 75 : 67, 13)}
        />
      )}
      {children === undefined ? null : (
        <span className="cobble-placed" style={placeAt(75, 21)}>
          {children}
        </span>
      )}
      {locked ? (
        <CartographyMap
          className="cobble-placed"
          kind="locked"
          style={placeAt(114, 66)}
        />
      ) : null}
      {error ? (
        <ContainerError
          className="cobble-placed"
          kind="cartography_table"
          style={placeAt(92, 36)}
        />
      ) : null}
    </Component>
  );
}

// ------------------------------------------------------------------------------- grindstone

export interface GrindstonePanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly top?: SlotGridItem | undefined;
  readonly bottom?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  readonly error?: boolean;
  readonly onSlotClick?: (slot: "top" | "bottom" | "result") => void;
}

export type GrindstonePanelProps<E extends ElementType = "div"> =
  PolymorphicProps<E, GrindstonePanelOwnProps>;

/**
 * The interactive part of the grindstone screen: two input slots, the result and the error cross.
 * Coordinates are recalled from vanilla and are approximations.
 */
export function GrindstonePanel<E extends ElementType = "div">(
  props: GrindstonePanelProps<E>,
): JSX.Element {
  const {
    as,
    top,
    bottom,
    result,
    error = false,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as GrindstonePanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "grindstone-panel",
    147,
    58,
    className,
    style,
    rest,
  );
  const click = (
    slot: "top" | "bottom" | "result",
  ): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      <StationSlot
        x={49}
        y={19}
        label="Grindstone top input"
        item={top}
        {...click("top")}
      />
      <StationSlot
        x={49}
        y={40}
        label="Grindstone bottom input"
        item={bottom}
        {...click("bottom")}
      />
      <StationSlot
        x={129}
        y={34}
        label="Grindstone result"
        item={result}
        {...click("result")}
      />
      {error ? (
        <ContainerError
          className="cobble-placed"
          kind="grindstone"
          style={placeAt(92, 31)}
        />
      ) : null}
    </Component>
  );
}

// ---------------------------------------------------------------------------- smithing table

export interface SmithingTablePanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  readonly template?: SlotGridItem | undefined;
  readonly base?: SlotGridItem | undefined;
  readonly addition?: SlotGridItem | undefined;
  readonly result?: SlotGridItem | undefined;
  readonly error?: boolean;
  /** Show the armor stand preview. Defaults to true when the background is drawn. */
  readonly armorStand?: boolean;
  readonly onSlotClick?: (
    slot: "template" | "base" | "addition" | "result",
  ) => void;
}

export type SmithingTablePanelProps<E extends ElementType = "div"> =
  PolymorphicProps<E, SmithingTablePanelOwnProps>;

/**
 * The interactive part of the smithing table screen: template, base, addition and result slots
 * (the first three with their placeholder silhouettes) and the error cross. Coordinates are
 * recalled from vanilla and are approximations. The armor stand is a 3D model (drag to turn it)
 * without armor.
 */
export function SmithingTablePanel<E extends ElementType = "div">(
  props: SmithingTablePanelProps<E>,
): JSX.Element {
  const {
    as,
    template,
    base,
    addition,
    result,
    error = false,
    background = true,
    armorStand = background,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as SmithingTablePanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "smithing-panel",
    116,
    67,
    className,
    style,
    {
      ...rest,
      background,
    },
  );
  const click = (
    slot: "template" | "base" | "addition" | "result",
  ): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(slot) };
  return (
    <Component {...root}>
      <StationSlot
        x={8}
        y={48}
        label="Smithing template"
        item={template}
        emptyIcon="smithing_template_armor_trim"
        {...click("template")}
      />
      <StationSlot
        x={26}
        y={48}
        label="Smithing base"
        item={base}
        emptyIcon="chestplate"
        {...click("base")}
      />
      <StationSlot
        x={44}
        y={48}
        label="Smithing addition"
        item={addition}
        emptyIcon="ingot"
        {...click("addition")}
      />
      <StationSlot
        x={98}
        y={48}
        label="Smithing result"
        item={result}
        {...click("result")}
      />
      {armorStand ? (
        <ArmorStand
          className="cobble-placed"
          // The feet stay where `SmithingScreen` puts them; the viewport has room around the stand.
          style={placeAt(
            SMITHING_ARMOR_STAND_X - (ARMOR_STAND_VIEWPORT_WIDTH * 1.5) / 2,
            SMITHING_ARMOR_STAND_Y - ARMOR_STAND_VIEWPORT_FEET * 1.5,
          )}
          initialYaw={-30}
          initialPitch={5}
        />
      ) : null}
      {error ? (
        <ContainerError
          className="cobble-placed"
          kind="smithing"
          style={placeAt(65, 46)}
        />
      ) : null}
    </Component>
  );
}

// ------------------------------------------------------------------------------------ beacon

export interface BeaconEffectChoice {
  /** The effect icon. Supply your own. */
  readonly content?: ReactNode;
  /** Accessible name, e.g. `Speed`. */
  readonly label: string;
  readonly disabled?: boolean;
}

export interface BeaconPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** The payment slot (iron, gold, emerald or diamond). */
  readonly payment?: SlotGridItem | undefined;
  /** Rows of effects, one per pyramid tier that is unlocked; each row is centred. */
  readonly tiers?: readonly (readonly BeaconEffectChoice[])[];
  /** The chosen effect as `[tier, index]` pairs. */
  readonly selected?: readonly (readonly [number, number])[];
  readonly onEffectClick?: (tier: number, index: number) => void;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  /** The confirm button cannot be used yet (no payment or no effect). */
  readonly confirmDisabled?: boolean;
  readonly onPaymentClick?: () => void;
}

export type BeaconPanelProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  BeaconPanelOwnProps
>;

/** Left edge of effect button `index` in a tier of `count`: `76 + index * 24 - (count * 22 + (count - 1) * 2) / 2`. */
export function beaconEffectX(index: number, count: number): number {
  return 76 + index * 24 - Math.trunc((count * 22 + (count - 1) * 2) / 2);
}

/**
 * The interactive part of the beacon screen: the effect buttons in centred rows 25 units apart,
 * the payment slot and the confirm and cancel buttons. Coordinates are recalled from vanilla and
 * are approximations.
 */
export function BeaconPanel<E extends ElementType = "div">(
  props: BeaconPanelProps<E>,
): JSX.Element {
  const {
    as,
    payment,
    tiers = [],
    selected = [],
    onEffectClick,
    onConfirm,
    onCancel,
    confirmDisabled = false,
    onPaymentClick,
    className,
    style,
    ...rest
  } = props as BeaconPanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "beacon-panel",
    212,
    134,
    className,
    style,
    rest,
  );
  return (
    <Component {...root}>
      {tiers.map((tier, tierIndex) =>
        tier.map((effect, index) => (
          <BeaconButton
            // oxlint-disable-next-line react/no-array-index-key -- effects are identified by position
            key={`${String(tierIndex)}:${String(index)}`}
            className="cobble-placed"
            style={placeAt(
              beaconEffectX(index, tier.length),
              22 + tierIndex * 25,
            )}
            label={effect.label}
            selected={selected.some(([t, i]) => t === tierIndex && i === index)}
            disabled={effect.disabled === true}
            {...(onEffectClick === undefined
              ? {}
              : { onClick: () => onEffectClick(tierIndex, index) })}
          >
            {effect.content}
          </BeaconButton>
        )),
      )}
      <StationSlot
        x={136}
        y={110}
        label="Beacon payment"
        item={payment}
        {...(onPaymentClick === undefined ? {} : { onClick: onPaymentClick })}
      />
      <BeaconButton
        className="cobble-placed"
        style={placeAt(164, 107)}
        kind="confirm"
        label="Confirm"
        disabled={confirmDisabled}
        {...(onConfirm === undefined ? {} : { onClick: onConfirm })}
      />
      <BeaconButton
        className="cobble-placed"
        style={placeAt(190, 107)}
        kind="cancel"
        label="Cancel"
        {...(onCancel === undefined ? {} : { onClick: onCancel })}
      />
    </Component>
  );
}

// ----------------------------------------------------------------------------------- crafter

export interface CrafterPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** The nine grid slots in reading order. */
  readonly slots?: readonly (SlotGridItem | undefined)[];
  /** Which of the nine slots are switched off. */
  readonly disabledSlots?: readonly boolean[];
  readonly result?: SlotGridItem | undefined;
  readonly powered?: boolean;
  readonly onSlotClick?: (index: number) => void;
  readonly onResultClick?: () => void;
}

export type CrafterPanelProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  CrafterPanelOwnProps
>;

/**
 * The interactive part of the crafter screen: a 3×3 grid whose slots can each be switched off,
 * the result slot and the redstone indicator. Coordinates are recalled from vanilla and are
 * approximations.
 */
export function CrafterPanel<E extends ElementType = "div">(
  props: CrafterPanelProps<E>,
): JSX.Element {
  const {
    as,
    slots = [],
    disabledSlots = [],
    result,
    powered = false,
    onSlotClick,
    onResultClick,
    className,
    style,
    ...rest
  } = props as CrafterPanelProps<"div">;
  const { Component, props: root } = usePanelRoot(
    as,
    "crafter-panel",
    152,
    71,
    className,
    style,
    rest,
  );
  return (
    <Component {...root}>
      {Array.from({ length: 9 }, (_, index) => {
        const item = slots[index];
        return (
          <CrafterSlot
            // oxlint-disable-next-line react/no-array-index-key -- slots are identified by position
            key={index}
            className="cobble-placed"
            style={placeAt(
              26 + (index % 3) * 18,
              17 + Math.floor(index / 3) * 18,
            )}
            label={item?.label ?? `Crafter slot ${String(index + 1)}`}
            slotDisabled={disabledSlots[index] === true}
            {...(onSlotClick === undefined
              ? {}
              : { onClick: () => onSlotClick(index) })}
          >
            {item?.content}
          </CrafterSlot>
        );
      })}
      <CrafterRedstone
        className="cobble-placed"
        style={placeAt(97, 35)}
        powered={powered}
      />
      <StationSlot
        x={134}
        y={35}
        label="Crafter result"
        item={result}
        {...(onResultClick === undefined ? {} : { onClick: onResultClick })}
      />
    </Component>
  );
}
