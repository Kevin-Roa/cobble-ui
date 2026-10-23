import type { SpriteId } from '../../assets/sprite-id.ts';
import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ElementType, type JSX, type ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { useTextureUrl } from '../../provider/hooks.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { SERVER_ENTRY_HEIGHT, SERVER_ENTRY_WIDTH, SERVER_ICON_SIZE } from './ServerListEntry.tsx';

/** What the join arrow over a world's icon looks like (`world_list/*`). */
export type WorldEntryStatus = 'normal' | 'marked' | 'warning' | 'error';

/** Sprite of the overlay icon, e.g. `world_list/join_highlighted`. */
export function worldListSprite(status: WorldEntryStatus, highlighted: boolean): SpriteId {
  const base = status === 'normal' ? 'join' : status === 'marked' ? 'marked_join' : status;
  return `world_list/${base}${highlighted ? '_highlighted' : ''}`;
}

export interface WorldListEntrySlotProps {
  readonly icon?: SlotProps<'img'>;
  readonly name?: SlotProps<'span'>;
  readonly detail?: SlotProps<'span'>;
}

export interface WorldListEntryOwnProps {
  /** The world's name, drawn in white. */
  readonly name: ReactNode;
  /** The gray lines under the name: the folder and date, then the game mode and version. */
  readonly details?: readonly ReactNode[];
  /** URL of the 64×64 world icon, shown at 32×32. */
  readonly icon?: string;
  readonly status?: WorldEntryStatus;
  /** Width in GUI units. Defaults to 305. */
  readonly width?: number;
  /** Called when the overlay icon is clicked or the entry is double-clicked. */
  readonly onJoin?: () => void;
  readonly slotProps?: WorldListEntrySlotProps;
}

export type WorldListEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  WorldListEntryOwnProps
>;

/**
 * A singleplayer world row (`WorldSelectionList.WorldListEntry`): a 32×32 icon, the
 * name in white and up to two gray detail lines beside it. Hovering dims the icon and
 * shows the join arrow, or a warning/error icon for worlds that cannot be played normally.
 */
export function WorldListEntry<E extends ElementType = 'div'>(
  props: WorldListEntryProps<E>,
): JSX.Element {
  const {
    as,
    name,
    details = [],
    icon,
    status = 'normal',
    width = SERVER_ENTRY_WIDTH,
    onJoin,
    slotProps,
    className,
    style,
    ...rest
  } = props as WorldListEntryProps<'div'>;
  const Component: ElementType = as ?? 'div';
  const fallbackIcon = useTextureUrl('misc/unknown_server');
  const iconUrl = icon ?? fallbackIcon;
  const [hovered, setHovered] = useState(false);
  const [overIcon, setOverIcon] = useState(false);
  const rootStyle: CssVariables = {
    '--cobble-width': width,
    '--cobble-height': SERVER_ENTRY_HEIGHT,
    ...style,
  };
  return (
    <Component
      {...mergeProps<'div'>(
        {
          className: cx('cobble-server-entry', 'cobble-world-entry', className),
          style: rootStyle,
          onPointerEnter: () => setHovered(true),
          onPointerLeave: () => {
            setHovered(false);
            setOverIcon(false);
          },
          onDoubleClick: () => onJoin?.(),
        },
        rest,
      )}
      data-hovered={hovered ? '' : undefined}
      data-status={status}
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
      {hovered ? (
        <button
          type="button"
          aria-label={status === 'normal' || status === 'marked' ? 'Play world' : 'Open world'}
          className="cobble-server-entry-join"
          style={placeAt(0, 0)}
          onPointerEnter={() => setOverIcon(true)}
          onPointerLeave={() => setOverIcon(false)}
          onClick={() => onJoin?.()}
        >
          <Sprite
            sprite={worldListSprite(status, overIcon)}
            width={SERVER_ICON_SIZE}
            height={SERVER_ICON_SIZE}
          />
        </button>
      ) : null}
      <span
        {...slotProps?.name}
        className={cx('cobble-server-entry-name', 'cobble-text', slotProps?.name?.className)}
        style={placeAt(SERVER_ICON_SIZE + 3, 1, slotProps?.name?.style)}
        data-shadow=""
      >
        {name}
      </span>
      {details.slice(0, 2).map((line, lineIndex) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- detail lines have no identity
          key={lineIndex}
          {...slotProps?.detail}
          className={cx('cobble-server-entry-motd', 'cobble-text', slotProps?.detail?.className)}
          style={placeAt(SERVER_ICON_SIZE + 3, 12 + lineIndex * 9, slotProps?.detail?.style)}
          data-shadow=""
        >
          {line}
        </span>
      ))}
    </Component>
  );
}
