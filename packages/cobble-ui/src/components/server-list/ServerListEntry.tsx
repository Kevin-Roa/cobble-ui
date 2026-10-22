import { mergeProps } from '@base-ui/react/merge-props';
import { useState, type ElementType, type JSX, type ReactNode } from 'react';
import type { CssVariables, PolymorphicProps, SlotProps } from '../../internal/polymorphic.ts';
import { cx, placeAt } from '../shared.ts';
import { Sprite } from '../sprite/Sprite.tsx';
import { PingIcon, type PingIconProps } from './PingIcon.tsx';

/** `ServerSelectionList#getRowWidth`. */
export const SERVER_ENTRY_WIDTH = 305;
/** Height of one entry (`ServerSelectionList` item height). */
export const SERVER_ENTRY_HEIGHT = 36;
/** Size of the server icon. */
export const SERVER_ICON_SIZE = 32;

export interface ServerListEntrySlotProps {
  readonly icon?: SlotProps<'img'>;
  readonly name?: SlotProps<'span'>;
  readonly status?: SlotProps<'span'>;
  readonly motd?: SlotProps<'span'>;
}

export interface ServerListEntryOwnProps {
  /** The server's name, drawn in white. */
  readonly name: ReactNode;
  /** The message of the day, one entry per line (at most two are shown). */
  readonly motd?: readonly ReactNode[];
  /** Player count text, right-aligned before the ping icon. */
  readonly status?: ReactNode;
  /** Connection state, as in {@link PingIcon}. */
  readonly latency: PingIconProps['latency'];
  /** Index in the list, used to offset the pinging animation. */
  readonly index?: number;
  /** URL of the 64×64 server icon, shown at 32×32. */
  readonly icon?: string;
  /** Width in GUI units. Defaults to 305. */
  readonly width?: number;
  /** Called when the join arrow (or the entry) is activated. */
  readonly onJoin?: () => void;
  readonly slotProps?: ServerListEntrySlotProps;
}

export type ServerListEntryProps<E extends ElementType = 'div'> = PolymorphicProps<
  E,
  ServerListEntryOwnProps
>;

/**
 * A multiplayer server row (`ServerSelectionList.OnlineServerEntry`): a 32×32
 * icon, the name and gray MOTD lines to its right, and the player count and
 * ping icon at the far end. Hovering the icon shows the join arrow.
 */
export function ServerListEntry<E extends ElementType = 'div'>(
  props: ServerListEntryProps<E>,
): JSX.Element {
  const {
    as,
    name,
    motd = [],
    status,
    latency,
    index = 0,
    icon,
    width = SERVER_ENTRY_WIDTH,
    onJoin,
    slotProps,
    className,
    style,
    ...rest
  } = props as ServerListEntryProps<'div'>;
  const Component: ElementType = as ?? 'div';
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
          className: cx('cobble-server-entry', className),
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
    >
      {icon === undefined ? null : (
        <img
          alt=""
          {...slotProps?.icon}
          className={cx('cobble-server-entry-icon', slotProps?.icon?.className)}
          src={icon}
          style={placeAt(0, 0, slotProps?.icon?.style)}
        />
      )}
      {hovered ? (
        <button
          type="button"
          aria-label="Join server"
          className="cobble-server-entry-join"
          style={placeAt(0, 0)}
          onPointerEnter={() => setOverIcon(true)}
          onPointerLeave={() => setOverIcon(false)}
          onClick={() => onJoin?.()}
        >
          <Sprite
            sprite={overIcon ? 'server_list/join_highlighted' : 'server_list/join'}
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
      {motd.slice(0, 2).map((line, lineIndex) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- MOTD lines have no identity
          key={lineIndex}
          {...slotProps?.motd}
          className={cx('cobble-server-entry-motd', 'cobble-text', slotProps?.motd?.className)}
          style={placeAt(SERVER_ICON_SIZE + 3, 12 + lineIndex * 9, slotProps?.motd?.style)}
          data-shadow=""
        >
          {line}
        </span>
      ))}
      {status === undefined ? null : (
        <span
          {...slotProps?.status}
          className={cx('cobble-server-entry-status', 'cobble-text', slotProps?.status?.className)}
          style={placeAt(0, 1, slotProps?.status?.style)}
          data-shadow=""
        >
          {status}
        </span>
      )}
      <PingIcon
        latency={latency}
        index={index}
        className="cobble-server-entry-ping"
        style={placeAt(width - 15, 0)}
      />
    </Component>
  );
}
