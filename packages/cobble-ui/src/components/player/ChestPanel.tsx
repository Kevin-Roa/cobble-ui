import type { CSSProperties, ElementType, JSX, ReactNode } from 'react';
import type { CssVariables, PolymorphicProps } from '../../internal/polymorphic.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import { useTranslation } from '../../i18n/Translation.tsx';
import { Text } from '../../text/Text.tsx';
import { useTextureUrl } from '../../provider/hooks.ts';
import { cx, placeAt } from '../shared.ts';
import { INVENTORY_HOTBAR_GAP, SlotGrid, type SlotGridItem } from '../slot/SlotGrid.tsx';

export const CHEST_MAX_ROWS = 6;

/** Height of the window's bottom border kept when isolated (last rows of `generic_54`'s inventory part). */
const CHEST_BOTTOM_EDGE = 4;

export type ChestArea = 'chest' | 'main' | 'hotbar';

export interface ChestPanelOwnProps {
  /** Draw the screen's own artwork behind the slots. Defaults to true. */
  readonly background?: boolean;
  /** Rows of chest slots, 1 to 6: 3 for a chest, 6 for a double chest. Defaults to 3. */
  readonly rows?: number;
  /** Title drawn above the chest slots. Defaults to `Chest`; `null` hides it. */
  readonly title?: ReactNode;
  /** Title above the player's inventory. Defaults to `Inventory`; `null` hides it. */
  readonly inventoryTitle?: ReactNode;
  /** Slots of the container, in reading order. */
  readonly items?: readonly (SlotGridItem | undefined)[];
  /**
   * Render only the container, without the player's inventory; the window's bottom border is
   * kept. Defaults to false.
   */
  readonly isolate?: boolean;
  readonly inventory?: readonly (SlotGridItem | undefined)[];
  readonly hotbar?: readonly (SlotGridItem | undefined)[];
  readonly onSlotClick?: (area: ChestArea, index: number) => void;
}

export type ChestPanelProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ChestPanelOwnProps
>;

/**
 * A generic container screen (`ContainerScreen`, the chest): a title, 1 to 6 rows of nine slots
 * and, optionally, the player's inventory below. The artwork is the top of the 6-row texture
 * with its bottom part, as the game draws it.
 */
export function ChestPanel<E extends ElementType = 'div'>(props: ChestPanelProps<E>): JSX.Element {
  const {
    as,
    background = true,
    rows: requested = 3,
    title: titleProp,
    inventoryTitle: inventoryTitleProp,
    items,
    isolate = false,
    inventory,
    hotbar,
    onSlotClick,
    className,
    style,
    ...rest
  } = props as ChestPanelProps<'div'>;
  const { tOr } = useTranslation();
  const title = titleProp === undefined ? tOr('container.chest', 'Chest') : titleProp;
  const inventoryTitle =
    inventoryTitleProp === undefined ? tOr('container.inventory', 'Inventory') : inventoryTitleProp;
  const Component: ElementType = as ?? 'div';
  const rows = Math.min(Math.max(Math.trunc(requested), 1), CHEST_MAX_ROWS);
  const url = useTextureUrl('gui/container/generic_54');
  // `ContainerScreen`: imageHeight = 114 + rows * 18, with the inventory part always 96 tall.
  const top = rows * 18 + 17;
  const inventoryTop = top;
  const height = isolate ? top + CHEST_BOTTOM_EDGE : 114 + rows * 18;
  const layer = (y: number, h: number, sourceY: number): CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: `calc(${String(y)} * var(--cobble-px))`,
    width: 'calc(176 * var(--cobble-px))',
    height: `calc(${String(h)} * var(--cobble-px))`,
    backgroundImage: url === undefined ? 'none' : `url("${url}")`,
    backgroundSize: 'calc(256 * var(--cobble-px)) calc(256 * var(--cobble-px))',
    backgroundPosition: `0 calc(${String(-sourceY)} * var(--cobble-px) + var(--cobble-px))`,
    imageRendering: 'pixelated',
    pointerEvents: 'none',
    zIndex: -1,
  });
  const rootStyle: CssVariables = {
    '--cobble-width': 176,
    '--cobble-height': height,
    isolation: 'isolate',
    ...style,
  };
  const click = (area: ChestArea) =>
    onSlotClick === undefined ? {} : { onSlotClick: (index: number) => onSlotClick(area, index) };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-station-panel cobble-chest-panel', className),
          style: rootStyle,
        },
        rest,
      )}
    >
      {background ? (
        <>
          <span aria-hidden style={layer(0, top, 0)} />
          {isolate ? (
            <span aria-hidden data-chest-edge="" style={layer(top, CHEST_BOTTOM_EDGE, 218)} />
          ) : (
            <span aria-hidden style={layer(inventoryTop, 96, 126)} />
          )}
        </>
      ) : null}
      {title === undefined || title === null ? null : (
        <Text className="cobble-placed" color="#404040" shadow={false} style={placeAt(8, 6)}>
          {title}
        </Text>
      )}
      <SlotGrid
        className="cobble-placed"
        style={placeAt(7, 17)}
        columns={9}
        rows={rows}
        label={tOr('cobble.chest.slots', 'Container')}
        {...(items === undefined ? {} : { items })}
        {...click('chest')}
      />
      {!isolate ? (
        <>
          {inventoryTitle === null ? null : (
            <Text
              className="cobble-placed"
              color="#404040"
              shadow={false}
              style={placeAt(8, rows * 18 + 20)}
            >
              {inventoryTitle}
            </Text>
          )}
          <SlotGrid
            className="cobble-placed"
            style={placeAt(7, rows * 18 + 31)}
            columns={9}
            rows={3}
            label={tOr('container.inventory', 'Inventory')}
            {...(inventory === undefined ? {} : { items: inventory })}
            {...click('main')}
          />
          <SlotGrid
            className="cobble-placed"
            style={placeAt(7, rows * 18 + 31 + 54 + INVENTORY_HOTBAR_GAP)}
            columns={9}
            rows={1}
            label={tOr('cobble.inventory.hotbar', 'Hotbar')}
            {...(hotbar === undefined ? {} : { items: hotbar })}
            {...click('hotbar')}
          />
        </>
      ) : null}
    </Component>
  );
}
