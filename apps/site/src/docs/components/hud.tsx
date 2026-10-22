import {
  AdvancementBox,
  AdvancementFrame,
  AdvancementWidget,
  AdvancementTab,
  Air,
  Armor,
  Hearts,
  Hunger,
  PackListEntry,
  JumpBar,
  LocatorBar,
  BossBar,
  ExperienceBar,
  Hotbar,
  LoadingDots,
  PingIcon,
  ServerListEntry,
  SpectatorMenu,
  Toast,
  WorldListEntry,
  type BossBarColor,
  type BossBarOverlay,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};
const SLOT = {
  name: 'slotProps',
  type: 'object',
  description: 'Props for the inner parts.',
};

const COLORS: readonly BossBarColor[] = [
  'pink',
  'blue',
  'red',
  'green',
  'yellow',
  'purple',
  'white',
];
const OVERLAYS: readonly BossBarOverlay[] = [
  'progress',
  'notched_6',
  'notched_10',
  'notched_12',
  'notched_20',
];

export function BossBarPage(): JSX.Element {
  const [progress, setProgress] = useState(0.6);
  return (
    <>
      <P>
        The boss health bar: a 182×5 colored bar, optionally overlaid with notches, with the boss
        name one line above it. The fill is <Code>(int)(progress * 183)</Code> units wide, like
        vanilla.
      </P>
      <Demo>
        <div className="site-stack">
          <BossBar progress={progress} color="pink">
            Ender Dragon
          </BossBar>
          {COLORS.slice(1).map((color, index) => (
            <BossBar
              key={color}
              progress={progress}
              color={color}
              overlay={OVERLAYS[index % OVERLAYS.length] ?? 'progress'}
              style={{ marginTop: 'calc(9 * var(--cobble-px))' }}
            >
              {color} · {OVERLAYS[index % OVERLAYS.length]}
            </BossBar>
          ))}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            aria-label="Progress"
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </div>
      </Demo>
      <CodeBlock
        code={`<BossBar progress={0.6} color="purple" overlay="notched_10">Wither</BossBar>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'progress', type: 'number', description: 'Health from 0 to 1.' },
          {
            name: 'color',
            type: "'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'white'",
            defaultValue: "'pink'",
            description: 'Bar color.',
          },
          {
            name: 'overlay',
            type: "'progress' | 'notched_6' | 'notched_10' | 'notched_12' | 'notched_20'",
            defaultValue: "'progress'",
            description: 'Notch overlay.',
          },
          { name: 'children', type: 'ReactNode', description: 'The name above the bar.' },
          SLOT,
          AS,
        ]}
      />
    </>
  );
}

export function ExperienceBarPage(): JSX.Element {
  return (
    <>
      <P>
        The experience bar: 182×5 with the level drawn in outlined green six units above it. The
        level is hidden at 0.
      </P>
      <Demo>
        <div className="site-stack">
          <ExperienceBar
            progress={0.4}
            level={12}
            style={{ marginTop: 'calc(9 * var(--cobble-px))' }}
          />
          <ExperienceBar
            progress={1}
            level={30}
            style={{ marginTop: 'calc(9 * var(--cobble-px))' }}
          />
          <ExperienceBar progress={0} style={{ marginTop: 'calc(9 * var(--cobble-px))' }} />
        </div>
      </Demo>
      <CodeBlock code={`<ExperienceBar progress={0.4} level={12} />`} />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'progress',
            type: 'number',
            description: 'Progress to the next level, 0 to 1.',
          },
          { name: 'level', type: 'number', description: 'Experience level; hidden when 0.' },
          SLOT,
          AS,
        ]}
      />
    </>
  );
}

const HOTBAR_DEMO_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
  <span key={number} className="cobble-text" data-shadow="">
    {number}
  </span>
));

export function HotbarPage(): JSX.Element {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <P>
        The item hotbar: the 182×22 bar with a 24×24 selection frame. Each slot hosts a 16×16 item
        area for your own content. Number keys 1–9 and the arrow keys change the selection; pass{' '}
        <Code>wheel</Code> to enable the mouse wheel. Item textures are not part of the GUI assets,
        so supply your own.
      </P>
      <Demo>
        <Hotbar
          wheel
          selected={selected}
          onSelectedChange={setSelected}
          slots={HOTBAR_DEMO_SLOTS}
        />
      </Demo>
      <CodeBlock
        code={`<Hotbar selected={slot} onSelectedChange={setSlot} slots={items.map(renderItem)} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'slots', type: 'ReactNode[]', description: 'Contents of each of the 9 slots.' },
          {
            name: 'selected / defaultSelected',
            type: 'number',
            description: 'Controlled or initial slot (0–8).',
          },
          {
            name: 'onSelectedChange',
            type: '(selected: number) => void',
            description: 'Called when the selection changes.',
          },
          {
            name: 'wheel',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Scroll the selection with the mouse wheel, wrapping around.',
          },
          SLOT,
          AS,
        ]}
      />
      <H2>SpectatorMenu</H2>
      <P>
        The hotbar frame with a 16×16 <Code>spectator/*</Code> icon in each slot you fill: close,
        scroll left and right, teleport to player and teleport to team. Which icon goes where is up
        to you; the game&apos;s own slot assignment is not reproduced.
      </P>
      <Demo>
        <SpectatorMenu
          icons={[
            'scroll_left',
            'teleport_to_player',
            'teleport_to_team',
            undefined,
            undefined,
            undefined,
            'scroll_right',
            undefined,
            'close',
          ]}
        />
      </Demo>
    </>
  );
}

export function ToastPage(): JSX.Element {
  const [open, setOpen] = useState(true);
  return (
    <>
      <P>
        A system toast: the <Code>toast/system</Code> background with a yellow title and white
        message lines, none shadowed. The height is <Code>20 + max(lines, 1) × 12</Code>. It slides
        in over 600 ms when <Code>open</Code> becomes true.
      </P>
      <Demo>
        <div className="site-stack" style={{ overflow: 'hidden' }}>
          <Toast open={open} title="Saved" messages={['World backed up']} />
          <Toast open={open} title="Title only" />
          <label>
            <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />{' '}
            open
          </label>
        </div>
      </Demo>
      <CodeBlock code={`<Toast open title="Saved" messages={['World backed up']} />`} />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'title', type: 'ReactNode', description: 'The yellow title.' },
          { name: 'messages', type: 'ReactNode[]', description: 'White lines under the title.' },
          {
            name: 'width',
            type: 'number',
            defaultValue: '160',
            description: 'Width in GUI units.',
          },
          { name: 'open', type: 'boolean', defaultValue: 'true', description: 'Slide in or out.' },
          SLOT,
          AS,
        ]}
      />
    </>
  );
}

export function PingIconPage(): JSX.Element {
  return (
    <>
      <P>
        The 10×8 connection icon of a server list entry. Latency maps to five bars at 150, 300, 600
        and 1000 ms; negative means unreachable. <Code>'pinging'</Code> plays the bouncing animation
        and <Code>'incompatible'</Code> shows the version mismatch icon.
      </P>
      <Demo>
        <div className="site-row">
          {[20, 200, 400, 800, 2000, -1, 'pinging', 'incompatible'].map((latency) => (
            <PingIcon
              key={latency}
              latency={latency as number | 'pinging' | 'incompatible'}
              style={{ position: 'static' }}
            />
          ))}
        </div>
      </Demo>
      <CodeBlock code={`<PingIcon latency={42} />\n<PingIcon latency="pinging" index={3} />`} />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'latency',
            type: "number | 'pinging' | 'incompatible'",
            description: 'Latency in ms, or a state.',
          },
          { name: 'index', type: 'number', description: 'Offsets the pinging animation.' },
        ]}
      />
      <H2>LoadingDots</H2>
      <P>
        <Code>LoadingDots</Code> is the gray <Code>O o o</Code> that cycles every 300 ms while
        connecting.
      </P>
      <Demo>
        <LoadingDots />
      </Demo>
    </>
  );
}

export function StatusIconsPage(): JSX.Element {
  const [health, setHealth] = useState(15);
  const [food, setFood] = useState(13);
  return (
    <>
      <P>
        The survival meters: <Code>Hearts</Code>, <Code>Hunger</Code>, <Code>Armor</Code> and{' '}
        <Code>Air</Code>. Each is a row of 9×9 icons 8 units apart, measured in half points like the
        game. Hunger and air fill from the right.
      </P>
      <Demo>
        <div className="site-stack">
          <Hearts value={health} />
          <Hearts value={health} absorption={6} variant="poisoned" />
          <Hearts value={health} hardcore variant="frozen" />
          <Hunger value={food} />
          <Hunger value={food} hunger />
          <Armor value={13} />
          <Air value={140} />
          <input
            type="range"
            min={0}
            max={20}
            value={health}
            aria-label="Health"
            onChange={(event) => setHealth(Number(event.target.value))}
          />
          <input
            type="range"
            min={0}
            max={20}
            value={food}
            aria-label="Food"
            onChange={(event) => setFood(Number(event.target.value))}
          />
        </div>
      </Demo>
      <CodeBlock
        code={`<Hearts value={15} absorption={4} />
<Hunger value={13} />
<Armor value={13} />
<Air value={140} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'number',
            description: 'Half hearts, half drumsticks, armor points (0–20) or air ticks (0–300).',
          },
          {
            name: 'max',
            type: 'number',
            description: 'Hearts: maximum health (default 20). Air: maximum ticks (default 300).',
          },
          {
            name: 'absorption',
            type: 'number',
            description: 'Hearts only: golden hearts after the health.',
          },
          {
            name: 'variant',
            type: "'normal' | 'poisoned' | 'withered' | 'frozen'",
            description: 'Hearts only: tint.',
          },
          { name: 'hardcore', type: 'boolean', description: 'Hearts only: hardcore sprites.' },
          {
            name: 'hunger',
            type: 'boolean',
            description: 'Hunger only: green hunger-effect sprites.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function ServerListEntryPage(): JSX.Element {
  return (
    <>
      <P>
        A multiplayer list row: a 32×32 icon, the name in white and up to two gray MOTD lines to its
        right, then the player count and ping icon at the far end. Hovering shows the join arrow
        over the icon. Entries are 305×36; put them in a <Code>SelectionList</Code> or stack them
        yourself.
      </P>
      <Demo>
        <div className="site-stack">
          <ServerListEntry
            name="Minecraft Server"
            motd={['A Minecraft Server', 'Welcome!']}
            status="3/20"
            latency={42}
          />
          <ServerListEntry name="Pinging…" status="?" latency="pinging" index={1} />
          <ServerListEntry name="Old server" motd={['Outdated']} latency="incompatible" />
          <ServerListEntry name="Offline" motd={['Can’t connect to server']} latency={-1} />
        </div>
      </Demo>
      <CodeBlock
        code={`<ServerListEntry name="My Server" motd={['Line 1', 'Line 2']} status="3/20" latency={42} onJoin={join} />`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'name', type: 'ReactNode', description: 'Server name.' },
          { name: 'motd', type: 'ReactNode[]', description: 'Up to two gray lines.' },
          { name: 'status', type: 'ReactNode', description: 'Player count text.' },
          {
            name: 'latency',
            type: "number | 'pinging' | 'incompatible'",
            description: 'See PingIcon.',
          },
          { name: 'icon', type: 'string', description: 'URL of the server icon.' },
          { name: 'index', type: 'number', description: 'Offsets the pinging animation.' },
          {
            name: 'onJoin',
            type: '() => void',
            description: 'Join arrow clicked or entry double-clicked.',
          },
          {
            name: 'width',
            type: 'number',
            defaultValue: '305',
            description: 'Width in GUI units.',
          },
        ]}
      />
      <H2>WorldListEntry</H2>
      <P>
        The singleplayer equivalent: the same 305×36 row with a world icon, the name and up to two
        gray detail lines. Hovering shows the join arrow; <Code>status</Code> swaps it for{' '}
        <Code>marked</Code>, <Code>warning</Code> or <Code>error</Code> icons.
      </P>
      <Demo>
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
      </Demo>
      <H2>PackListEntry</H2>
      <P>
        A resource pack or data pack row: a 32×32 icon with the name and two description lines.
        Hovering shows the available <Code>transferable_list</Code> arrows over the icon: the left
        half enables or disables the pack, the top right moves it up and the bottom right moves it
        down. Each is a real button; <Code>onAction</Code> receives <Code>select</Code>,{' '}
        <Code>unselect</Code>, <Code>move_up</Code> or <Code>move_down</Code>. The 157-unit width
        and the hit areas are approximations of the game&apos;s.
      </P>
      <Demo>
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
      </Demo>
    </>
  );
}

export function AdvancementFramePage(): JSX.Element {
  const frames = ['task', 'goal', 'challenge'] as const;
  return (
    <>
      <P>
        The 26×26 frame around an advancement icon: square for tasks, rounded for goals, spiked for
        challenges, dark until obtained. Children fill the 16×16 icon area; item textures are not
        part of the GUI assets, so supply your own image.
      </P>
      <Demo>
        <div className="site-row">
          {frames.map((type) => (
            <AdvancementFrame key={type} type={type} obtained>
              <span className="cobble-text" data-shadow="">
                {type.slice(0, 1).toUpperCase()}
              </span>
            </AdvancementFrame>
          ))}
          {frames.map((type) => (
            <AdvancementFrame key={`${type}-locked`} type={type} />
          ))}
        </div>
      </Demo>
      <CodeBlock code="<AdvancementFrame type='challenge' obtained><img src={icon} /></AdvancementFrame>" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'type',
            type: "'task' | 'goal' | 'challenge'",
            defaultValue: "'task'",
            description: 'Frame shape.',
          },
          { name: 'obtained', type: 'boolean', defaultValue: 'false', description: 'Lit frame.' },
          { name: 'children', type: 'ReactNode', description: 'The icon.' },
        ]}
      />
      <H2>AdvancementBox</H2>
      <P>
        The 200×26 box behind an advancement&apos;s title, nine-sliced with a 10-unit border so it
        can be any width. <Code>kind</Code> is <Code>title</Code>, <Code>obtained</Code> or{' '}
        <Code>unobtained</Code>.
      </P>
      <Demo>
        <div className="site-stack">
          <AdvancementBox width={200} />
          <AdvancementBox width={120} kind="obtained" />
          <AdvancementBox width={120} kind="unobtained" />
        </div>
      </Demo>
      <H2>AdvancementTab</H2>
      <P>
        A tab of the advancements screen. <Code>side</Code> picks the edge (above, below, left,
        right; 28×32 or 32×28), <Code>position</Code> picks <Code>first</Code>, <Code>middle</Code>{' '}
        or <Code>last</Code> along it, and <Code>selected</Code> draws the raised variant. The icon
        is centred in the sprite, which approximates the game&apos;s placement.
      </P>
      <Demo>
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
      </Demo>
      <CodeBlock code="<AdvancementTab label='Story' side='above' position='first' selected />" />
      <H2>AdvancementWidget</H2>
      <P>
        One advancement in the tree: the frame, and while <Code>expanded</Code> the box behind the
        title and description beside it, sized to its text. The text offsets, vertical placement and
        colors are approximations of the game&apos;s.
      </P>
      <Demo>
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
      </Demo>
    </>
  );
}

export function JumpBarPage(): JSX.Element {
  const [progress, setProgress] = useState(0.5);
  return (
    <>
      <P>
        The horse jump bar: the same 182×5 bar as the experience bar, filled by{' '}
        <Code>(int)(progress * 183)</Code> units. While <Code>cooldown</Code> is set, the cooldown
        sprite covers the whole bar instead.
      </P>
      <Demo>
        <div className="site-stack">
          <JumpBar progress={progress} />
          <JumpBar progress={progress} cooldown />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            aria-label="Charge"
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </div>
      </Demo>
      <CodeBlock code="<JumpBar progress={charge} cooldown={recharging} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          { name: 'progress', type: 'number', description: 'Jump charge, 0 to 1.' },
          {
            name: 'cooldown',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Show the recharge sprite.',
          },
          AS,
        ]}
      />
    </>
  );
}

export function LocatorBarPage(): JSX.Element {
  return (
    <>
      <P>
        The locator bar: <Code>hud/locator_bar_background</Code> nine-sliced to 182×5, with waypoint
        dots two units above its top edge. <Code>position</Code> runs from -1 (left end) to 1 (right
        end). A waypoint with <Code>arrow</Code> set to <Code>up</Code> or <Code>down</Code> shows a
        blinking arrow beside its dot, animated with the sheet&apos;s own timing. The dot placement
        and the arrow offsets are approximations of the game&apos;s.
      </P>
      <Demo>
        <div className="site-stack" style={{ paddingBlock: 'calc(4 * var(--cobble-px))' }}>
          <LocatorBar
            waypoints={[
              { position: -0.8, dot: 'default_0' },
              { position: -0.2, dot: 'default_2' },
              { position: 0.4, dot: 'default_3' },
              { position: 0.9, dot: 'bowtie' },
              { position: -0.5, dot: 'default_1', arrow: 'up' },
              { position: 0.65, dot: 'default_2', arrow: 'down' },
            ]}
          />
        </div>
      </Demo>
      <CodeBlock code="<LocatorBar waypoints={[{ position: -0.3, dot: 'default_2' }]} />" />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'waypoints',
            type: "{ position: number; dot?: LocatorDot; arrow?: 'up' | 'down' }[]",
            description:
              'Dots to draw. dot is default_0–default_3 or bowtie; arrow adds a blinking arrow.',
          },
          AS,
        ]}
      />
    </>
  );
}
