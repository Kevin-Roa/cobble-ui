import type { JSX, KeyboardEvent, ReactNode } from 'react';
import { Text } from '../../text/Text.tsx';
import {
  SelectionList,
  SelectionListItem,
  type SelectionListOwnProps,
} from '../selection-list/SelectionList.tsx';
import { SERVER_ENTRY_HEIGHT, SERVER_ENTRY_WIDTH } from '../server-list/ServerListEntry.tsx';
import { WorldListEntry, type WorldEntryStatus } from '../server-list/WorldListEntry.tsx';

/** The game modes a world can be saved in (`GameType`). */
export type WorldGameMode = 'survival' | 'creative' | 'adventure' | 'spectator';

/** Display names (`GameType#getLongDisplayName`). */
export const GAME_MODE_NAMES: Readonly<Record<WorldGameMode, string>> = {
  survival: 'Survival Mode',
  creative: 'Creative Mode',
  adventure: 'Adventure Mode',
  spectator: 'Spectator Mode',
};

/** What the list needs to know about one save (`LevelSummary`). */
export interface WorldSummary {
  /** The save folder name (`LevelSummary#getLevelId`); also the row's selection value. */
  readonly id: string;
  /** The level name (`LevelSummary#getLevelName`). May be empty. */
  readonly name: string;
  /** Last played time as epoch milliseconds or a `Date` (`LevelSummary#getLastPlayed`). */
  readonly lastPlayed?: number | Date;
  readonly gameMode: WorldGameMode;
  readonly hardcore?: boolean;
  readonly cheats?: boolean;
  /** Version name the world was last saved in (`LevelSummary#getWorldVersionName`). */
  readonly version?: string;
  /** URL of the 64×64 `icon.png`. */
  readonly icon?: string;
  /** Overlay shown on hover. Defaults to `"normal"`. */
  readonly status?: WorldEntryStatus;
}

/**
 * The name line of an entry (`WorldSelectionList.WorldListEntry` constructor): an empty level
 * name becomes `"Unnamed World <n>"` with a 1-based `index`.
 */
export function worldDisplayName(world: Pick<WorldSummary, 'name'>, index: number): string {
  return world.name.trim() === '' ? `Unnamed World ${index + 1}` : world.name;
}

/** Default date format; the game uses the locale's date and time (`DateFormat`). */
export function formatWorldDate(date: number | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

/**
 * The first detail line (`WorldSelectionList.WorldListEntry`): `"<id> (<date>)"`, or only the
 * id when the world has never been played.
 */
export function worldIdLine(
  world: Pick<WorldSummary, 'id' | 'lastPlayed'>,
  formatDate: (date: number | Date) => string = formatWorldDate,
): string {
  return world.lastPlayed === undefined
    ? world.id
    : `${world.id} (${formatDate(world.lastPlayed)})`;
}

/**
 * The second detail line (`LevelSummary#getInfo`): the game mode (`Hardcore Mode` in dark red
 * for hardcore worlds), `Cheats` and the version, joined by commas.
 */
export function worldInfoLine(
  world: Pick<WorldSummary, 'gameMode' | 'hardcore' | 'cheats' | 'version'>,
): ReactNode {
  return (
    <>
      {world.hardcore === true ? (
        <Text color="dark_red">Hardcore Mode</Text>
      ) : (
        GAME_MODE_NAMES[world.gameMode]
      )}
      {world.cheats === true ? ', Cheats' : null}
      {world.version === undefined ? null : `, Version: ${world.version}`}
    </>
  );
}

export interface WorldSelectionListOwnProps extends Omit<
  SelectionListOwnProps,
  'children' | 'itemHeight' | 'rowWidth' | 'onItemActivate'
> {
  readonly worlds: readonly WorldSummary[];
  /** Called with the world's id when it is double-clicked, Enter is pressed or its arrow is clicked. */
  readonly onPlay?: (id: string) => void;
  /** Formats `lastPlayed`. Defaults to {@link formatWorldDate}. */
  readonly formatDate?: (date: number | Date) => string;
}

/**
 * The singleplayer world list (`WorldSelectionList` on `SelectWorldScreen`): a
 * {@link SelectionList} of {@link WorldListEntry} rows, each with the icon, the name, the
 * `id (date)` line and the game mode / cheats / version summary. Selection and arrow-key
 * navigation come from the list; Enter or double-click plays the selected world
 * (`WorldListEntry#keyPressed` / `mouseClicked`). Controlled and presentational: it never
 * reads saves.
 */
export function WorldSelectionList(props: WorldSelectionListOwnProps): JSX.Element {
  const {
    worlds,
    onPlay,
    formatDate = formatWorldDate,
    slotProps,
    'aria-label': ariaLabel = 'Select World',
    ...rest
  } = props;
  const viewport = slotProps?.viewport;
  return (
    <SelectionList
      {...rest}
      aria-label={ariaLabel}
      itemHeight={SERVER_ENTRY_HEIGHT}
      rowWidth={SERVER_ENTRY_WIDTH}
      slotProps={{
        ...slotProps,
        viewport: {
          ...viewport,
          // Rows call `onPlay` themselves on double-click (through `WorldListEntry#onJoin`), so
          // the list's own activation is unused; Enter is handled here for the same callback.
          onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
            viewport?.onKeyDown?.(event);
            // The list already prevented the default of Enter when it activated the selection.
            if (event.key !== 'Enter') return;
            const active = event.currentTarget.querySelector<HTMLElement>(
              '[role="option"][aria-selected="true"]',
            );
            const id = active?.dataset['value'];
            if (id === undefined) return;
            event.preventDefault();
            onPlay?.(id);
          },
        },
      }}
    >
      {worlds.map((world, index) => (
        <SelectionListItem key={world.id} value={world.id}>
          <WorldListEntry
            name={worldDisplayName(world, index)}
            details={[worldIdLine(world, formatDate), worldInfoLine(world)]}
            {...(world.icon === undefined ? {} : { icon: world.icon })}
            {...(world.status === undefined ? {} : { status: world.status })}
            onJoin={() => onPlay?.(world.id)}
          />
        </SelectionListItem>
      ))}
    </SelectionList>
  );
}
