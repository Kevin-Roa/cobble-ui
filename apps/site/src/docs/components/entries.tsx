import {
  AdvancementBox,
  AdvancementTab,
  AdvancementWidget,
  AnimatedSprite,
  LoadingDots,
  NotificationBadge,
  PackListEntry,
  RealmStatusIcon,
  SocialPlayerEntry,
  WorldListEntry,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

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
            <span className="cobble-text" data-shadow="">
              S
            </span>
          </AdvancementTab>
          <AdvancementTab label="Nether" position="middle">
            <span className="cobble-text" data-shadow="">
              N
            </span>
          </AdvancementTab>
          <AdvancementTab label="End" position="last" />
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
          <Code>.mcmeta</Code> animation. The renderer does not read animation metadata, so pass the
          frame size and timing yourself; the number of frames comes from the sheet height. Times
          are in game ticks (50 ms).
        </>
      }
      demo={
        <div className="site-row">
          <AnimatedSprite
            sprite="icon/trial_available"
            frameWidth={8}
            frameHeight={8}
            frames={[
              { index: 0, time: 10 },
              { index: 1, time: 2 },
              { index: 2, time: 2 },
              { index: 3, time: 2 },
              { index: 4, time: 2 },
              { index: 5, time: 2 },
            ]}
          />
        </div>
      }
      code={`<AnimatedSprite sprite="icon/trial_available" frameWidth={8} frameHeight={8}
  frames={[{ index: 0, time: 10 }, { index: 1, time: 2 }]} />`}
      rows={[
        { name: 'sprite', type: 'SpriteId', description: 'Sheet sprite id.' },
        {
          name: 'frameWidth / frameHeight',
          type: 'number',
          description: 'Size of one frame, in GUI units.',
        },
        { name: 'frametime', type: 'number', defaultValue: '1', description: 'Ticks per frame.' },
        {
          name: 'frames',
          type: '{ index, time }[]',
          description: 'Explicit frame order and times.',
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

export function SocialPlayerEntryPage(): JSX.Element {
  const [muted, setMuted] = useState(false);
  return (
    <ComponentDoc
      intro={
        <>
          A player row of the social interactions screen: the 236×34 nine-sliced background, a 24×24
          face, the name with an optional gray status line, and the mute and report buttons at the
          right. Skins are not GUI assets, so supply the face. The inner offsets are approximations
          of the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <SocialPlayerEntry
            name="Steve"
            muted={muted}
            onMutedChange={setMuted}
            onReport={() => undefined}
          >
            <span className="cobble-text" data-shadow="">
              S
            </span>
          </SocialPlayerEntry>
          <SocialPlayerEntry name="Alex" status="Hidden" onReport={() => undefined} />
          <SocialPlayerEntry name="Herobrine" status="Blocked" />
        </div>
      }
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
        { name: 'children', type: 'ReactNode', description: 'The face, in a 24×24 area.' },
        { name: 'width', type: 'number', defaultValue: '236', description: 'Width in GUI units.' },
        AS,
      ]}
    />
  );
}
