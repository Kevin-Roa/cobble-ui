import {
  AdvancementBox,
  Button,
  Icon,
  Panel,
  Tab,
  TabList,
  Tabs,
  TextField,
  AdvancementTab,
  AdvancementWidget,
  AnimatedSprite,
  ItemIcon,
  LoadingDots,
  NotificationBadge,
  PackListEntry,
  RealmStatusIcon,
  SocialPlayerEntry,
  WorldListEntry,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';
import { AnimatedSpriteExplorer } from './explorers.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function WorldListEntryPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A singleplayer world row: a 305×36 entry with a world icon, the name and up to two gray
          detail lines. Hovering shows the join arrow; <Code>status</Code> swaps it for{' '}
          <Code>marked</Code>, <Code>warning</Code> or <Code>error</Code> icons.
        </>
      }
      demo={
        <div className="site-stack">
          <WorldListEntry
            name="New World"
            details={['New World (10/22/26 9:41 AM)', 'Survival Mode, Cheats, Version: 26.3']}
          />
          <WorldListEntry
            name="Old World"
            status="warning"
            details={['Old World (1/1/24)', 'Creative Mode, Version: 1.20.4']}
          />
          <WorldListEntry name="Broken" status="error" details={['Broken (2/2/25)']} />
        </div>
      }
      code="<WorldListEntry name='New World' details={['New World (10/22/26)', 'Survival Mode']} onJoin={play} />"
      rows={[
        { name: 'name', type: 'ReactNode', description: 'World name.' },
        { name: 'details', type: 'ReactNode[]', description: 'Up to two gray lines.' },
        { name: 'icon', type: 'string', description: 'URL of the world icon.' },
        {
          name: 'status',
          type: "'normal' | 'marked' | 'warning' | 'error'",
          defaultValue: "'normal'",
          description: 'The overlay icon shown on hover.',
        },
        {
          name: 'onJoin',
          type: '() => void',
          description: 'Overlay clicked or entry double-clicked.',
        },
        { name: 'width', type: 'number', defaultValue: '305', description: 'Width in GUI units.' },
        AS,
      ]}
    />
  );
}

export function PackListEntryPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A resource pack or data pack row: a 32×32 icon with the name and two description lines.
          Hovering shows the available <Code>transferable_list</Code> arrows over the icon: the left
          half enables or disables the pack, the top right moves it up and the bottom right moves it
          down. Each is a real button. The 157-unit width and the hit areas are approximations of
          the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <PackListEntry
            name="Programmer Art"
            description={['The classic look', 'Pack format 34']}
            canSelect
            canMoveUp
            canMoveDown
          />
          <PackListEntry name="Vanilla" description={['The default resources']} canUnselect />
        </div>
      }
      code="<PackListEntry name='Vanilla' canUnselect canMoveDown onAction={(action) => …} />"
      rows={[
        { name: 'name', type: 'ReactNode', description: 'Pack name.' },
        { name: 'description', type: 'ReactNode[]', description: 'Up to two description lines.' },
        {
          name: 'canSelect / canUnselect',
          type: 'boolean',
          description: 'Offer to enable or disable the pack.',
        },
        {
          name: 'canMoveUp / canMoveDown',
          type: 'boolean',
          description: 'Offer to reorder the pack.',
        },
        {
          name: 'onAction',
          type: "(action: 'select' | 'unselect' | 'move_up' | 'move_down') => void",
          description: 'Called with the clicked action.',
        },
        { name: 'width', type: 'number', defaultValue: '157', description: 'Width in GUI units.' },
        AS,
      ]}
    />
  );
}

export function AdvancementBoxPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 200×26 box behind an advancement&apos;s title, nine-sliced with a 10-unit border so it
          can be any width. <Code>kind</Code> is <Code>title</Code>, <Code>obtained</Code> or{' '}
          <Code>unobtained</Code>.
        </>
      }
      demo={
        <div className="site-stack">
          <AdvancementBox width={200} />
          <AdvancementBox width={120} kind="obtained" />
          <AdvancementBox width={120} kind="unobtained" />
        </div>
      }
      code="<AdvancementBox kind='obtained' width={120}>…</AdvancementBox>"
      rows={[
        {
          name: 'kind',
          type: "'title' | 'obtained' | 'unobtained'",
          defaultValue: "'title'",
          description: 'Which box sprite.',
        },
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '200 / 26',
          description: 'Size in GUI units.',
        },
        { name: 'children', type: 'ReactNode', description: 'Content drawn over the box.' },
        AS,
      ]}
    />
  );
}

export function AdvancementTabPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A tab of the advancements screen. <Code>side</Code> picks the edge (above, below, left or
          right; 28×32 or 32×28), <Code>position</Code> picks <Code>first</Code>,{' '}
          <Code>middle</Code> or <Code>last</Code> along it, and <Code>selected</Code> draws the
          raised variant. The icon is centred in the sprite, which approximates the game&apos;s
          placement. It is a toggle button (<Code>aria-pressed</Code>). To build a real tab list,
          put the tabs in an element with <Code>role=&quot;tablist&quot;</Code> and pass{' '}
          <Code>role=&quot;tab&quot;</Code> and <Code>aria-selected</Code> to each.
        </>
      }
      demo={
        <div className="site-row">
          <AdvancementTab label="Story" selected position="first">
            <ItemIcon name="grass_block" />
          </AdvancementTab>
          <AdvancementTab label="Nether" position="middle">
            <ItemIcon name="netherrack" />
          </AdvancementTab>
          <AdvancementTab label="End" position="last">
            <ItemIcon name="end_stone" />
          </AdvancementTab>
        </div>
      }
      code="<AdvancementTab label='Story' side='above' position='first' selected />"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'side',
          type: "'above' | 'below' | 'left' | 'right'",
          defaultValue: "'above'",
          description: 'The edge.',
        },
        {
          name: 'position',
          type: "'first' | 'middle' | 'last'",
          defaultValue: "'first'",
          description: 'Place along the edge.',
        },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The raised variant.',
        },
        { name: 'children', type: 'ReactNode', description: 'The icon.' },
        AS,
      ]}
    />
  );
}

export function AdvancementWidgetPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          One advancement in the tree: the frame, and while <Code>expanded</Code> the box behind the
          title and description beside it, sized to its text. The text offsets, vertical placement
          and colors are approximations of the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <AdvancementWidget
            title="Stone Age"
            type="task"
            obtained
            expanded
            description={['Mine stone with your new pickaxe']}
          />
          <AdvancementWidget
            title="Diamonds!"
            type="goal"
            expanded
            description={['Acquire diamonds']}
          />
          <AdvancementWidget title="Monsters Hunted" type="challenge" obtained />
        </div>
      }
      code="<AdvancementWidget title='Stone Age' type='task' obtained expanded description={['…']}><Icon /></AdvancementWidget>"
      rows={[
        { name: 'title', type: 'ReactNode', description: 'The advancement’s title.' },
        { name: 'description', type: 'ReactNode[]', description: 'Lines shown while expanded.' },
        {
          name: 'type',
          type: "'task' | 'goal' | 'challenge'",
          defaultValue: "'task'",
          description: 'Frame shape.',
        },
        {
          name: 'obtained',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Lights the frame and box.',
        },
        {
          name: 'expanded',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Show the box with the text.',
        },
        { name: 'children', type: 'ReactNode', description: 'The icon.' },
        AS,
      ]}
    />
  );
}

export function RealmStatusIconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 10×28 status light on a Realm entry: green for open, red for closed, grey for expired,
          and a blinking light when it expires soon. Built on <Code>AnimatedSprite</Code>.
        </>
      }
      demo={
        <div className="site-row">
          <RealmStatusIcon status="open" />
          <RealmStatusIcon status="closed" />
          <RealmStatusIcon status="expired" />
          <RealmStatusIcon status="expires_soon" />
        </div>
      }
      code="<RealmStatusIcon status='expires_soon' />"
      rows={[
        {
          name: 'status',
          type: "'open' | 'closed' | 'expired' | 'expires_soon'",
          description: 'The light shown.',
        },
      ]}
    />
  );
}

export function AnimatedSpritePage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          Plays a sprite sheet (frames stacked vertically) the way the game plays an{' '}
          <Code>.mcmeta</Code> animation. Pass just the sprite id: the frame size, frame order and
          timing are read from the sheet&apos;s own <Code>animation</Code> metadata, in game ticks
          (50 ms). Any of the props below overrides what the metadata says.
        </>
      }
      demo={
        <div className="site-row">
          <AnimatedSprite sprite="icon/trial_available" />
          <AnimatedSprite sprite="icon/music_notes" />
          <AnimatedSprite sprite="realm_status/expires_soon" />
        </div>
      }
      code={`<AnimatedSprite sprite="icon/trial_available" />`}
      after={<AnimatedSpriteExplorer />}
      rows={[
        { name: 'sprite', type: 'SpriteId', description: 'Sheet sprite id.' },
        {
          name: 'frameWidth / frameHeight',
          type: 'number',
          description: 'Size of one frame, in GUI units. Defaults to the metadata.',
        },
        {
          name: 'frametime',
          type: 'number',
          description: 'Ticks per frame. Defaults to the metadata.',
        },
        {
          name: 'frames',
          type: '{ index, time }[]',
          description: 'Explicit frame order and times. Defaults to the metadata.',
        },
      ]}
    />
  );
}

export function LoadingDotsPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The gray <Code>O o o</Code> that cycles every 300 ms while connecting.
        </>
      }
      demo={<LoadingDots />}
      code="<LoadingDots />"
      rows={[]}
    />
  );
}

export function NotificationBadgePage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The small red count badge shown on menu buttons: 8×8, a digit from 1 to 5, or a plus sign
          above that. Renders nothing at 0.
        </>
      }
      demo={
        <div className="site-row">
          <NotificationBadge count={1} />
          <NotificationBadge count={4} />
          <NotificationBadge count={9} />
        </div>
      }
      code="<NotificationBadge count={unread} />"
      rows={[{ name: 'count', type: 'number', description: 'Number of notifications.' }]}
    />
  );
}

type SocialTab = 'all' | 'hidden' | 'blocked';

const SOCIAL_PLAYERS = [
  { name: 'Steve', tab: 'all' },
  { name: 'Alex', tab: 'all' },
  { name: 'Herobrine', tab: 'hidden' },
] as const;

/** Mirrors `SocialInteractionsScreen`: title, All/Hidden/Blocked tabs, a search box and the player list. */
function SocialInteractionsDemo(): JSX.Element {
  const [tab, setTab] = useState<SocialTab>('all');
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState<readonly string[]>(['Herobrine']);
  const query = search.trim().toLowerCase();
  const players = SOCIAL_PLAYERS.filter((p) => p.name.toLowerCase().includes(query)).filter((p) =>
    tab === 'all' ? true : tab === 'hidden' ? hidden.includes(p.name) : false,
  );
  const empty =
    query !== ''
      ? 'Couldn’t find any player with that name'
      : tab === 'hidden'
        ? 'No hidden players in chat'
        : tab === 'blocked'
          ? 'No blocked players in chat'
          : 'No players are currently online';
  return (
    <div style={{ width: 'calc(254 * var(--cobble-px))' }}>
      <div
        className="cobble-text"
        data-shadow=""
        style={{
          marginBottom: 'calc(4 * var(--cobble-px))',
          paddingLeft: 'calc(8 * var(--cobble-px))',
        }}
      >
        Minecraft Server - {SOCIAL_PLAYERS.length} players
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as SocialTab)}>
        <div style={{ paddingLeft: 'calc(8 * var(--cobble-px))' }}>
          <TabList width={238}>
            <Tab value="all">All</Tab>
            <Tab value="hidden">Hidden</Tab>
            <Tab value="blocked">Blocked</Tab>
          </TabList>
        </div>
      </Tabs>
      <Panel background="social_interactions/background" width={254} height={156}>
        <div
          style={{ position: 'absolute', inset: 'calc(8 * var(--cobble-px))', overflow: 'hidden' }}
        >
          <div
            className="site-row"
            style={{
              alignItems: 'center',
              height: 'calc(24 * var(--cobble-px))',
              gap: 'calc(2 * var(--cobble-px))',
              paddingLeft: 'calc(2 * var(--cobble-px))',
              boxSizing: 'border-box',
            }}
          >
            <Icon name="search" />
            <TextField
              aria-label="Search"
              placeholder="Search..."
              value={search}
              onValueChange={setSearch}
              width={200}
              height={14}
              bordered={false}
            />
          </div>
          {players.map((player, index) => (
            <SocialPlayerEntry
              key={player.name}
              name={player.name}
              status={hidden.includes(player.name) ? 'Hidden' : undefined}
              muted={hidden.includes(player.name)}
              onMutedChange={(muted) =>
                setHidden(
                  muted ? [...hidden, player.name] : hidden.filter((n) => n !== player.name),
                )
              }
              onReport={() => undefined}
              highlighted={index % 2 === 0}
              width={238}
            />
          ))}
          {players.length === 0 ? (
            <div
              className="cobble-text"
              style={{
                textAlign: 'center',
                color: '#a0a0a0',
                marginTop: 'calc(40 * var(--cobble-px))',
              }}
            >
              {empty}
            </div>
          ) : null}
        </div>
      </Panel>
      {tab === 'blocked' ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'calc(-10 * var(--cobble-px))',
            position: 'relative',
          }}
        >
          <Button width={204}>Manage with Microsoft account</Button>
        </div>
      ) : null}
    </div>
  );
}

export function SocialPlayerEntryPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A player row of the social interactions screen (<Code>PlayerEntry</Code>): a flat dark row
          that lightens when hovered, a 24×24 face, the white name with an optional gray status
          line, and the chat-toggle and report buttons at the right. The panel around the rows is a
          separate <Code>Panel</Code>; the full screen is demonstrated below.
        </>
      }
      demo={<SocialInteractionsDemo />}
      code="<SocialPlayerEntry name='Steve' status='Hidden' muted={muted} onMutedChange={setMuted} onReport={report}><Face /></SocialPlayerEntry>"
      rows={[
        { name: 'name', type: 'ReactNode', description: 'The player’s name.' },
        { name: 'status', type: 'ReactNode', description: 'Gray line under the name.' },
        {
          name: 'muted / onMutedChange',
          type: 'boolean',
          description: 'Controls the mute button.',
        },
        {
          name: 'onReport',
          type: '() => void',
          description: 'Shows and handles the report button.',
        },
        {
          name: 'highlighted',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Lighter hovered/selected fill without the pointer.',
        },
        { name: 'children', type: 'ReactNode', description: 'The face, in a 24×24 area.' },
        { name: 'width', type: 'number', defaultValue: '236', description: 'Width in GUI units.' },
        AS,
      ]}
    />
  );
}
