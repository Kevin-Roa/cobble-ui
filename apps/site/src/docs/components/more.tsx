import {
  AnvilTextField,
  BrewBubbles,
  CartographyMap,
  CrafterRedstone,
  CrafterSlot,
  HorseChestSlots,
  Icon,
  ICON_NAMES,
  MusicNotes,
  PlayerPingIcon,
  RealmsButton,
  RecipeOverlayButton,
  TrialAvailableIcon,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

function Letter({ children }: { readonly children: string }): JSX.Element {
  return (
    <span className="cobble-text" data-shadow="">
      {children}
    </span>
  );
}

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
        { name: 'maxLength', type: 'number', defaultValue: '50', description: 'Maximum length.' },
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
      rows={[{ name: 'brewTime', type: 'number', description: 'Ticks left in the brew.' }, AS]}
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
            <Letter>O</Letter>
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Birch Planks" craftable={false}>
            <Letter>B</Letter>
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Smelted" station="furnace">
            <Letter>S</Letter>
          </RecipeOverlayButton>
          <RecipeOverlayButton label="Blasted" station="furnace" craftable={false}>
            <Letter>B</Letter>
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
              <Letter>◆</Letter>
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
        { name: 'children', type: 'ReactNode', description: 'The item (hidden while disabled).' },
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
      rows={[{ name: 'powered', type: 'boolean', description: 'Receiving a redstone signal.' }]}
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

export function MusicNotesPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The bobbing notes beside the &quot;now playing&quot; toast: <Code>icon/music_notes</Code>,
          16×16, eight frames at two ticks each. A ready-made use of <Code>AnimatedSprite</Code>.
        </>
      }
      demo={<MusicNotes />}
      code="<MusicNotes />"
      rows={[]}
    />
  );
}

export function TrialAvailableIconPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The sparkling marker for an available trial realm: <Code>icon/trial_available</Code>, 8×8,
          a long rest then a quick shine, using the sheet&apos;s own frame timing.
        </>
      }
      demo={<TrialAvailableIcon />}
      code="<TrialAvailableIcon />"
      rows={[]}
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
      demo={
        <div className="site-row">
          {ICON_NAMES.map((name) => (
            <Icon key={name} name={name} title={name} />
          ))}
        </div>
      }
      code="<Icon name='language' label='Language' />"
      rows={[
        { name: 'name', type: 'IconName', description: 'Which icon; see ICON_NAMES.' },
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
      rows={[{ name: 'latency', type: "number | 'unknown'", description: 'Latency in ms.' }]}
    />
  );
}

export function RealmsButtonPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A regular <Code>Button</Code> drawn with the Realms screens&apos; own button sprites. It
          accepts every <Code>Button</Code> prop.
        </>
      }
      demo={
        <div className="site-row">
          <RealmsButton width={120}>Play</RealmsButton>
          <RealmsButton width={120} disabled>
            Unavailable
          </RealmsButton>
        </div>
      }
      code="<RealmsButton width={120}>Play</RealmsButton>"
      rows={[
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '150 / 20',
          description: 'Size in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Grey label, no interaction.',
        },
        AS,
      ]}
    />
  );
}
