import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ElementType, type JSX, type ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useTextureUrl } from '../../provider/hooks.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { SERVER_ENTRY_HEIGHT, SERVER_ICON_SIZE } from './ServerListEntry.tsx';

/** Width of a pack entry. */
export const PACK_ENTRY_WIDTH = 157;

/** The action under the pointer on the icon overlay. */
export type PackAction = 'select' | 'unselect' | 'move_up' | 'move_down';

/** Which actions the pack currently offers. */
export interface PackActions {
  readonly canSelect?: boolean;
  readonly canUnselect?: boolean;
  readonly canMoveUp?: boolean;
  readonly canMoveDown?: boolean;
}

export interface PackRegion {
  readonly action: PackAction;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The hit areas on the 32×32 icon: the left half selects or unselects, the top right moves the
 * pack up and the bottom right moves it down. Mirrors the hit areas of
 * `TransferableSelectionList.PackEntry`, as best recalled.
 */
export function packRegions(actions: PackActions): PackRegion[] {
  const half = SERVER_ICON_SIZE / 2;
  const regions: PackRegion[] = [];
  if (actions.canUnselect === true) {
    regions.push({ action: 'unselect', x: 0, y: 0, width: half, height: SERVER_ICON_SIZE });
  } else if (actions.canSelect === true) {
    regions.push({ action: 'select', x: 0, y: 0, width: half, height: SERVER_ICON_SIZE });
  }
  if (actions.canMoveUp === true) {
    regions.push({ action: 'move_up', x: half, y: 0, width: half, height: half });
  }
  if (actions.canMoveDown === true) {
    regions.push({ action: 'move_down', x: half, y: half, width: half, height: half });
  }
  return regions;
}

/** Overlay sprites (`transferable_list/*`) drawn while hovering, with the one under the pointer highlighted. */
export function packOverlaySprites(actions: PackActions, over: PackAction | undefined): SpriteId[] {
  const layers: PackAction[] = [];
  if (actions.canUnselect === true) layers.push('unselect');
  else if (actions.canSelect === true) layers.push('select');
  if (actions.canMoveUp === true) layers.push('move_up');
  if (actions.canMoveDown === true) layers.push('move_down');
  return layers.map((action): SpriteId =>
    action === over ? `transferable_list/${action}_highlighted` : `transferable_list/${action}`,
  );
}

const PACK_ACTION_LABELS: Record<PackAction, string> = {
  select: 'Enable pack',
  unselect: 'Disable pack',
  move_up: 'Move up',
  move_down: 'Move down',
};

export interface PackListEntrySlotProps {
  readonly icon?: SlotProps<'img'>;
  readonly name?: SlotProps<'span'>;
  readonly description?: SlotProps<'span'>;
}

export interface PackListEntryOwnProps extends PackActions {
  /** The pack's name, drawn in white. */
  readonly name: ReactNode;
  /** The description lines under the name (at most two are shown). */
  readonly description?: readonly ReactNode[];
  /** URL of the pack icon, shown at 32×32. */
  readonly icon?: string;
  /** Width in GUI units. Defaults to 157. */
  readonly width?: number;
  /** Called with the action that was clicked on the icon overlay. */
  readonly onAction?: (action: PackAction) => void;
  readonly slotProps?: PackListEntrySlotProps;
}

export type PackListEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  PackListEntryOwnProps
>;

/**
 * A resource pack or data pack row (`TransferableSelectionList.PackEntry`): a 32×32 icon, the
 * name and two description lines. Hovering dims the icon and shows the available
 * `transferable_list` arrows over it; the one under the pointer is highlighted and clicking it
 * calls `onAction`. The row width and the hit areas are approximations of the game's.
 */
export function PackListEntry<E extends ElementType = 'div'>(
  props: PackListEntryProps<E>,
): JSX.Element {
  const {
    as,
    name,
    description = [],
    icon,
    width = PACK_ENTRY_WIDTH,
    canSelect,
    canUnselect,
    canMoveUp,
    canMoveDown,
    onAction,
    slotProps,
    className,
    style,
    ...rest
  } = props as PackListEntryProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fallbackIcon = useTextureUrl('misc/unknown_pack');
  const iconUrl = icon ?? fallbackIcon;
  const actions: PackActions = {
    ...(canSelect === undefined ? {} : { canSelect }),
    ...(canUnselect === undefined ? {} : { canUnselect }),
    ...(canMoveUp === undefined ? {} : { canMoveUp }),
    ...(canMoveDown === undefined ? {} : { canMoveDown }),
  };
  const [hovered, setHovered] = useState(false);
  const [over, setOver] = useState<PackAction | undefined>(undefined);
  const hasActions =
    canSelect === true || canUnselect === true || canMoveUp === true || canMoveDown === true;

  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': SERVER_ENTRY_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-server-entry', 'cobble-pack-entry', className),
          style: rootStyle,
          onPointerEnter: () => setHovered(true),
          onPointerLeave: () => {
            setHovered(false);
            setOver(undefined);
          },
        },
        rest,
      )}
      data-hovered={hovered ? '' : undefined}
    >
      {iconUrl === undefined ? null : (
        <img
          alt=""
          {...slotProps?.icon}
          className={cx('cobble-server-entry-icon', slotProps?.icon?.className)}
          src={iconUrl}
          style={placeAt(0, 0, slotProps?.icon?.style)}
        />
      )}
      {hovered && hasActions ? (
        <div className="cobble-server-entry-join cobble-pack-entry-actions" style={placeAt(0, 0)}>
          {packOverlaySprites(actions, over).map((sprite) => (
            <Sprite
              key={sprite}
              sprite={sprite}
              width={SERVER_ICON_SIZE}
              height={SERVER_ICON_SIZE}
            />
          ))}
          {packRegions(actions).map((region) => (
            <button
              key={region.action}
              type="button"
              aria-label={PACK_ACTION_LABELS[region.action]}
              className="cobble-pack-entry-action"
              style={
                {
                  ...placeAt(region.x, region.y),
                  '--cobble-w': region.width,
                  '--cobble-h': region.height,
                } as CssVariables
              }
              onPointerEnter={() => setOver(region.action)}
              onPointerLeave={() => setOver(undefined)}
              onFocus={() => setOver(region.action)}
              onBlur={() => setOver(undefined)}
              onClick={() => onAction?.(region.action)}
            />
          ))}
        </div>
      ) : null}
      <span
        {...slotProps?.name}
        className={cx('cobble-server-entry-name', 'cobble-text', slotProps?.name?.className)}
        style={placeAt(SERVER_ICON_SIZE + 3, 1, slotProps?.name?.style)}
        data-shadow=""
      >
        {name}
      </span>
      {description.slice(0, 2).map((line, lineIndex) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- description lines have no identity
          key={lineIndex}
          {...slotProps?.description}
          className={cx(
            'cobble-server-entry-motd',
            'cobble-text',
            slotProps?.description?.className,
          )}
          style={placeAt(SERVER_ICON_SIZE + 3, 12 + lineIndex * 9, slotProps?.description?.style)}
          data-shadow=""
        >
          {line}
        </span>
      ))}
    </Component>
  );
}
