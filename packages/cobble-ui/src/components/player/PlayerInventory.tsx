import type { ElementType, JSX, ReactNode } from 'react';
import type { PolymorphicProps } from '../../internal/polymorphic.ts';
import { Text } from '../../text/Text.tsx';
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

const ARMOR_LABELS: Readonly<Record<ArmorSlot, string>> = {
  head: 'Helmet',
  chest: 'Chestplate',
  legs: 'Leggings',
  feet: 'Boots',
};

export type PlayerInventoryArea = 'armor' | 'offhand' | 'crafting' | 'result' | 'main' | 'hotbar';

export interface PlayerInventoryOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** The figure on the left: a username/UUID (fetched from mc-heads.net), or a node of your own. */
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
    className,
    style,
    ...rest
  } = props as PlayerInventoryProps<'div'>;
  const { Component, props: root } = usePanelRoot(
    as,
    'player-inventory-panel',
    176,
    166,
    className,
    style,
    rest,
    'inventory',
  );
  const click = (area: PlayerInventoryArea, index = 0): { readonly onClick?: () => void } =>
    onSlotClick === undefined ? {} : { onClick: () => onSlotClick(area, index) };
  const figure =
    typeof player === 'string' && player.trim() !== '' ? (
      <PlayerRenderer player={player} width={49} height={70} />
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
          label={ARMOR_LABELS[slot]}
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
        label="Offhand"
        item={offhand}
        emptyIcon="shield"
        {...click('offhand')}
      />
      <Text className="cobble-placed" color="#404040" shadow={false} style={placeAt(97, 8)}>
        Crafting
      </Text>
      {[0, 1, 2, 3].map((index) => (
        <StationSlot
          key={index}
          x={98 + (index % 2) * 18}
          y={18 + Math.floor(index / 2) * 18}
          label={`Crafting slot ${String(index + 1)}`}
          item={crafting[index]}
          {...click('crafting', index)}
        />
      ))}
      <StationSlot x={154} y={28} label="Crafting result" item={result} {...click('result')} />
      <SlotGrid
        className="cobble-placed"
        style={placeAt(7, 83)}
        columns={9}
        rows={3}
        label="Inventory"
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
        label="Hotbar"
        {...(hotbar === undefined ? {} : { items: hotbar })}
        {...(onSlotClick === undefined
          ? {}
          : { onSlotClick: (index: number) => onSlotClick('hotbar', index) })}
      />
    </Component>
  );
}
