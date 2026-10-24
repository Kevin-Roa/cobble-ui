import {
  AnvilTextField,
  BrewBubbles,
  Button,
  CartographyMap,
  CrafterRedstone,
  CrafterSlot,
  HorseChestSlots,
  ItemIcon,
  PlayerPingIcon,
  ProgressBar,
  RecipeOverlayButton,
  Text,
  useToasts,
  EffectIcon,
  PlayerHead,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { EffectExplorer, IconExplorer } from './explorers.tsx';
import { Code, ComponentDoc } from '../../components/Prose.tsx';
import { useDefaultPlayer } from '../../settings.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function AnvilTextFieldPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The item name field of the anvil: a <Code>TextField</Code> drawn with the anvil&apos;s own
          110×16 box. The box does not change when focused, and it dims when disabled (no item in
          the slot). The maximum length defaults to 50 characters. Any <Code>TextField</Code> can
          use other box sprites through <Code>backgroundSprites</Code>.
        </>
      }
      demo={
        <div className="site-stack">
          <AnvilTextField aria-label="Item name" defaultValue="Excalibur" />
          <AnvilTextField aria-label="Item name (disabled)" disabled />
        </div>
      }
      code="<AnvilTextField aria-label='Item name' value={name} onValueChange={setName} />"
      rows={[
        {
          name: 'value / defaultValue',
          type: 'string',
          description: 'Controlled or initial text.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: 'Called on every change.',
        },
        {
          name: 'maxLength',
          type: 'number',
          defaultValue: '50',
          description: 'Maximum length.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Dim box, no input.',
        },
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '110 / 16',
          description: 'Size in GUI units.',
        },
        AS,
      ]}
    />
  );
}

export function BrewBubblesPage(): JSX.Element {
  const [time, setTime] = useState(100);
  return (
    <ComponentDoc
      intro={
        <>
          The bubbles that rise through the brewing stand while it brews: 12×29. Drive it with the
          remaining brew time, counting down, and it cycles through the game&apos;s bubble heights (
          <Code>29, 24, 20, 16, 11, 6, 0</Code>, one every two ticks). Nothing is drawn at 0.
        </>
      }
      demo={
        <div className="site-row">
          <BrewBubbles brewTime={time} />
          <input
            type="range"
            min={0}
            max={14}
            value={time}
            aria-label="Brew time"
            onChange={(event) => setTime(Number(event.target.value))}
          />
        </div>
      }
      code="<BrewBubbles brewTime={brewTime} />"
      rows={[
        {
          name: 'brewTime',
          type: 'number',
          description: 'Ticks left in the brew.',
        },
        AS,
      ]}
    />
  );
}

export function RecipeOverlayButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A cell of the recipe book&apos;s alternative-recipes popup: 25×25, in four looks
          (craftable or not, hovered or not). A grey cell is still clickable. <Code>station</Code>{' '}
          switches to the furnace artwork. The item is inset by 4; that offset is an approximation
          of the game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <RecipeOverlayButton label="Oak Planks">
            <ItemIcon name="oak_planks" />
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Birch Planks" craftable={false}>
            <ItemIcon name="birch_planks" />
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Smelted" station="furnace">
            <ItemIcon name="iron_ingot" />
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Blasted" station="furnace" craftable={false}>
            <ItemIcon name="gold_ingot" />
          </RecipeOverlayButton>
        </div>
      }
      code="<RecipeOverlayButton label='Oak Planks' craftable onClick={craft}><Item /></RecipeOverlayButton>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'craftable',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Ingredients are on hand.',
        },
        {
          name: 'station',
          type: "'crafting' | 'furnace'",
          defaultValue: "'crafting'",
          description: 'Artwork.',
        },
        { name: 'children', type: 'ReactNode', description: 'The item.' },
        AS,
      ]}
    />
  );
}

export function CrafterSlotPage(): JSX.Element {
  const [off, setOff] = useState([false, true, false]);
  return (
    <ComponentDoc
      intro={
        <>
          A slot of the crafter&apos;s 3×3 grid: 18×18. A disabled slot is drawn with the barred{' '}
          <Code>container/crafter/disabled_slot</Code>. It is a <Code>switch</Code>: click to turn
          the slot on or off.
        </>
      }
      demo={
        <div className="site-row">
          {off.map((slotDisabled, index) => (
            <CrafterSlot
              // oxlint-disable-next-line react/no-array-index-key -- a fixed row of three slots
              key={index}
              label={`Slot ${String(index + 1)}`}
              slotDisabled={slotDisabled}
              onClick={() => setOff(off.map((value, i) => (i === index ? !value : value)))}
            >
              <ItemIcon name="redstone" />
            </CrafterSlot>
          ))}
        </div>
      }
      code="<CrafterSlot label='Slot 1' slotDisabled={disabled[0]} onClick={toggle}>{item}</CrafterSlot>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'slotDisabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draw the barred slot.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          description: 'The item (hidden while disabled).',
        },
        AS,
      ]}
    />
  );
}

export function CrafterRedstonePage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The redstone indicator of the crafter: 16×16, lit while the crafter is receiving a signal.
          It has an image role labelled <Code>Powered</Code> or <Code>Not powered</Code>.
        </>
      }
      demo={
        <div className="site-row">
          <CrafterRedstone powered />
          <CrafterRedstone powered={false} />
        </div>
      }
      code="<CrafterRedstone powered={signal} />"
      rows={[
        {
          name: 'powered',
          type: 'boolean',
          description: 'Receiving a redstone signal.',
        },
      ]}
    />
  );
}

export function CartographyMapPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The frames the cartography table draws behind the map preview: a plain map (66×66), a
          zoomed-out one (66×66), a copy (50×66), and the small padlock for a locked map (10×14).
        </>
      }
      demo={
        <div className="site-row">
          <CartographyMap kind="map" />
          <CartographyMap kind="scaled" />
          <CartographyMap kind="duplicated" />
          <CartographyMap kind="locked" />
        </div>
      }
      code="<CartographyMap kind='scaled' />"
      rows={[
        {
          name: 'kind',
          type: "'map' | 'scaled' | 'duplicated' | 'locked'",
          description: 'Which frame.',
        },
      ]}
    />
  );
}

export function HorseChestSlotsPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The slot grid for a pack animal&apos;s chest: the first <Code>columns</Code> columns of
          the 5×3 sheet, 18 units each. Put your item slots on top of it as children.
        </>
      }
      demo={
        <div className="site-stack">
          <HorseChestSlots columns={5} />
          <HorseChestSlots columns={3} />
          <HorseChestSlots columns={1} />
        </div>
      }
      code="<HorseChestSlots columns={3} />"
      rows={[
        {
          name: 'columns',
          type: 'number',
          description: 'Slot columns, 1 to 5 (always 3 rows tall).',
        },
        AS,
      ]}
    />
  );
}

export function IconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          One of the game&apos;s single-image menu icons at its natural size: the options and pause
          screen icons, the tutorial hint icons and so on. <Code>name</Code> is typed, so a typo is
          a compile error. <Code>link</Code> and <Code>video_link</Code> have hovered artwork (
          <Code>highlighted</Code>). Icons are hidden from assistive technology unless you give them
          a <Code>label</Code>.
        </>
      }
      after={<IconExplorer />}
      rows={[
        {
          name: 'name',
          type: 'IconName',
          description: 'Which icon; see ICON_NAMES.',
        },
        {
          name: 'highlighted',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Hovered artwork, where there is some.',
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name; omit for a decorative icon.',
        },
      ]}
    />
  );
}

export function PlayerPingIconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The connection bars beside a player in the player list: <Code>icon/ping_1</Code> to{' '}
          <Code>ping_5</Code>, 10×8. The thresholds (150, 300, 600 and 1000 ms) match the server
          list&apos;s <Code>PingIcon</Code>, which uses different artwork.
        </>
      }
      demo={
        <div className="site-row">
          {[20, 200, 400, 800, 2000, 'unknown'].map((latency) => (
            <PlayerPingIcon key={latency} latency={latency as number | 'unknown'} />
          ))}
        </div>
      }
      code="<PlayerPingIcon latency={42} />"
      rows={[
        {
          name: 'latency',
          type: "number | 'unknown'",
          description: 'Latency in ms.',
        },
      ]}
    />
  );
}

export function ToastManagerPage(): JSX.Element {
  const toasts = useToasts();
  const [count, setCount] = useState(0);
  return (
    <ComponentDoc
      intro={
        <>
          Wrap your app in <Code>ToastProvider</Code> and call <Code>useToasts().show()</Code> from
          anywhere below it. Toasts stack down the right edge, at most five at a time (set{' '}
          <Code>maxVisible</Code>); the rest wait their turn. Each slides in over 600 ms, stays for
          5 seconds (<Code>duration</Code>, or <Code>Infinity</Code> to keep it) and slides out,
          playing the game&apos;s toast sounds. <Code>dismiss(id)</Code> and{' '}
          <Code>dismissAll()</Code> slide them out early.
        </>
      }
      demo={
        <div className="site-row">
          <Button
            width={150}
            onClick={() => {
              setCount(count + 1);
              toasts.show({
                title: 'Saved',
                messages: [`Backup #${String(count + 1)} complete`],
              });
            }}
          >
            Show a toast
          </Button>
          <Button
            width={150}
            onClick={() =>
              toasts.show({
                title: 'Pinned',
                variant: 'tutorial',
                duration: Infinity,
              })
            }
          >
            Show a pinned toast
          </Button>
          <Button width={150} onClick={() => toasts.dismissAll()}>
            Dismiss all
          </Button>
        </div>
      }
      code={`<ToastProvider>
  <App />
</ToastProvider>

const toasts = useToasts();
const id = toasts.show({ title: 'Saved', messages: ['World backed up'] });
toasts.dismiss(id);`}
      rows={[
        {
          name: 'show(options)',
          type: '(ToastOptions) => number',
          description: 'Queues a toast; returns its id.',
        },
        {
          name: 'dismiss(id) / dismissAll()',
          type: 'function',
          description: 'Slides toasts out early.',
        },
        {
          name: 'options.duration',
          type: 'number',
          defaultValue: '5000',
          description: 'Milliseconds on screen once slid in.',
        },
        {
          name: 'options.variant',
          type: 'ToastVariant',
          defaultValue: "'system'",
          description: 'The background.',
        },
        {
          name: 'options.sound',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Play the in and out sounds.',
        },
        {
          name: 'ToastProvider maxVisible',
          type: 'number',
          defaultValue: '5',
          description: 'Toasts shown at once.',
        },
      ]}
    />
  );
}

export function ProgressBarPage(): JSX.Element {
  const [progress, setProgress] = useState(0.4);
  return (
    <ComponentDoc
      intro={
        <>
          The white outlined bar of the game&apos;s loading screens: a 1-unit border, a 1-unit gap,
          then a fill of <Code>ceil((width - 4) * progress)</Code> units. Leave{' '}
          <Code>progress</Code> out for an indeterminate bar that sweeps back and forth. The fill
          rule and the 10-unit height are approximations of the game&apos;s; its logo and red
          background are deliberately not reproduced.
        </>
      }
      demo={
        <div className="site-stack">
          <ProgressBar progress={progress} />
          <ProgressBar progress={progress} width={100} height={6} />
          <ProgressBar />
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
      }
      code="<ProgressBar progress={loaded / total} width={200} />"
      rows={[
        {
          name: 'progress',
          type: 'number',
          description: '0 to 1; omit for an indeterminate bar.',
        },
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '200 / 10',
          description: 'Size in GUI units.',
        },
        {
          name: 'label',
          type: 'string',
          defaultValue: "'Progress'",
          description: 'Accessible name.',
        },
        {
          name: 'as',
          type: 'ElementType',
          description: 'Render a different element or component.',
        },
      ]}
    />
  );
}

export function AssetLoadingOverlayPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          Shows what the provider is doing while it fetches the game assets: the phase, megabytes
          downloaded and a progress bar, or the error with a retry button. It renders nothing once
          the assets are ready, so you can leave it in your app. The first visit downloads the
          official client (about 41 MB); later visits read the cache. This site uses it: reload with
          the browser cache cleared to see it. <Code>variant=&quot;screen&quot;</Code> covers the
          page instead of sitting at the bottom.
        </>
      }
      demo={<Text color="gray">Nothing to show: the assets on this page are already loaded.</Text>}
      code={`<CobbleProvider font={minecraftTtf('/fonts')}>
  <App />
  <AssetLoadingOverlay note="(first visit only)" />
</CobbleProvider>`}
      rows={[
        {
          name: 'variant',
          type: "'panel' | 'screen'",
          defaultValue: "'panel'",
          description: 'Bottom box or full cover.',
        },
        {
          name: 'phaseLabels',
          type: 'Partial<Record<phase, string>>',
          description: 'Replace the wording of a phase.',
        },
        {
          name: 'note',
          type: 'ReactNode',
          description: 'Appended to the megabytes line while downloading.',
        },
        {
          name: 'barWidth',
          type: 'number',
          defaultValue: '200',
          description: 'Progress bar width in GUI units.',
        },
      ]}
    />
  );
}

export function ItemIconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          An item as the inventory draws it, 16×16, rendered from the game&apos;s own item
          definitions and models: flat sprites, blocks with the inventory lighting, and models like
          torches and stairs. Items the game draws with code (chests, beds, banners, shields) have
          no model to read. Use it as the child of any slot, and browse every item on the{' '}
          <Code>Items</Code> page.
        </>
      }
      demo={
        <div className="site-row">
          {['diamond_sword', 'apple', 'stone', 'grass_block', 'oak_planks', 'redstone_block'].map(
            (name) => (
              <ItemIcon key={name} name={name} />
            ),
          )}
        </div>
      }
      code="<InventorySlot><ItemIcon name='diamond_sword' /></InventorySlot>"
      rows={[
        {
          name: 'name',
          type: 'string',
          description: 'Texture name, like diamond_sword (item) or stone (block).',
        },
        {
          name: 'size',
          type: 'number',
          defaultValue: '16',
          description: 'Size in GUI units.',
        },
      ]}
    />
  );
}

export function EffectIconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A mob effect icon (<Code>textures/mob_effect</Code>), 18×18, as drawn in the inventory
          side panel, the HUD and the beacon screen.
        </>
      }
      demo={
        <div className="site-row">
          {(
            ['speed', 'haste', 'strength', 'regeneration', 'resistance', 'jump_boost'] as const
          ).map((name) => (
            <EffectIcon key={name} name={name} />
          ))}
        </div>
      }
      code="<EffectIcon name='speed' />"
      after={<EffectExplorer />}
      rows={[
        {
          name: 'name',
          type: 'EffectId',
          description: 'Effect id, like speed. A union of every effect icon in the game.',
        },
      ]}
    />
  );
}

export function PlayerHeadPage(): JSX.Element {
  const player = useDefaultPlayer();
  return (
    <ComponentDoc
      intro={
        <>
          A player&apos;s face with the hat layer, cut from a skin texture. Pass <Code>player</Code>{' '}
          (a username or UUID) for the real face, fetched from mc-heads.net by the browser;
          otherwise it uses the Steve skin that ships with the game, or <Code>skin</Code> for
          another texture. <Code>SocialPlayerEntry</Code> shows it when it has no children.
        </>
      }
      demo={
        <div className="site-row">
          <PlayerHead player={player} />
          <PlayerHead player="jeb_" size={16} />
          <PlayerHead player="Dinnerbone" size={32} />
          <PlayerHead size={32} />
        </div>
      }
      code={`<PlayerHead player='${player}' size={16} />`}
      rows={[
        {
          name: 'player',
          type: 'string',
          description: 'Username or UUID, fetched from mc-heads.net.',
        },
        {
          name: 'skin',
          type: 'string',
          defaultValue: "'entity/player/wide/steve'",
          description: 'Skin texture id (64×64 or 64×32).',
        },
        {
          name: 'size',
          type: 'number',
          defaultValue: '8',
          description: 'Size in GUI units.',
        },
      ]}
    />
  );
}
