import {
  type EffectId,
  AnvilPanel,
  BeaconButton,
  BeaconPanel,
  BrewArrow,
  BrewingStandPanel,
  BundleProgressBar,
  BundleSlot,
  CartographyPanel,
  CookingArrow,
  CrafterPanel,
  CraftingGrid,
  CreativeInventoryPanel,
  CreativeScroller,
  CreativeTab,
  DispenserPanel,
  EffectIcon,
  EnchantingTablePanel,
  EnchantmentSlot,
  FuelBar,
  FuelFlame,
  FurnacePanel,
  GameModeSlot,
  GrindstonePanel,
  HopperPanel,
  ItemIcon,
  LoomPanel,
  Panel,
  PlayerInventoryGrid,
  SlotGrid,
  SmithingTablePanel,
  StatusEffectEntry,
  StonecutterPanel,
  TradeArrow,
  VillagerScroller,
  VillagerTradePanel,
  VillagerXpBar,
} from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

/** Real item textures to fill demo slots with. */
const DEMO_ITEMS = [
  'stone',
  'oak_planks',
  'iron_ingot',
  'diamond',
  'apple',
  'torch',
  'coal',
  'emerald',
  'arrow',
  'stick',
] as const;

function demoItem(index: number): string {
  return DEMO_ITEMS[index % DEMO_ITEMS.length] ?? 'stone';
}

const CREATIVE_TAB_ITEMS = [
  'bricks',
  'red_dye',
  'oak_log',
  'crafting_table',
  'redstone',
  'iron_sword',
  'apple',
  'ender_pearl',
  'lava_bucket',
  'compass',
  'chest',
  'barrier',
];

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function BundleSlotPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A slot of the bundle contents grid: a 24×24 nine-sliced background with the item inset by
          4 units. It draws a highlight frame behind and in front of the item on hover or focus, or
          whenever <Code>highlighted</Code> is set. The highlight placement is an approximation of
          the game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <BundleSlot />
          <BundleSlot highlighted>
            <ItemIcon name="apple" />
          </BundleSlot>
        </div>
      }
      code="<BundleSlot highlighted>{item}</BundleSlot>"
      rows={[
        { name: 'children', type: 'ReactNode', description: 'The item, in the 16×16 area.' },
        {
          name: 'highlighted',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Force the highlight frames.',
        },
        AS,
      ]}
    />
  );
}

export function BundleProgressBarPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The fill bar in a bundle tooltip: a nine-sliced border with a fill inside it, switching to
          the <Code>full</Code> sprite at 100%. Its default 94×13 size and 1-unit inset are
          approximations of the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <BundleProgressBar progress={0.3} />
          <BundleProgressBar progress={1} />
        </div>
      }
      code="<BundleProgressBar progress={0.3} />"
      rows={[
        { name: 'progress', type: 'number', description: 'How full, 0 to 1.' },
        {
          name: 'width / height',
          type: 'number',
          defaultValue: '94 / 13',
          description: 'Size in GUI units.',
        },
        AS,
      ]}
    />
  );
}

export function CreativeTabPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A creative inventory tab: 26×32, with a distinct sprite for each of the 7 columns of the
          top and bottom rows. The icon offset is an approximation of the game&apos;s. It is a
          toggle button (<Code>aria-pressed</Code>). To build a real tab list, put the tabs in an
          element with <Code>role=&quot;tablist&quot;</Code> and pass{' '}
          <Code>role=&quot;tab&quot;</Code> and <Code>aria-selected</Code> to each.
        </>
      }
      demo={
        <div className="site-stack">
          <div className="site-row">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((column) => (
              <CreativeTab
                key={column}
                label={`Tab ${String(column)}`}
                column={column}
                selected={column === 2}
              />
            ))}
          </div>
          <div className="site-row">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((column) => (
              <CreativeTab
                key={column}
                label={`Bottom tab ${String(column)}`}
                row="bottom"
                column={column}
                selected={column === 5}
              />
            ))}
          </div>
        </div>
      }
      code="<CreativeTab label='Building Blocks' row='top' column={1} selected />"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name of the tab.' },
        { name: 'row', type: "'top' | 'bottom'", defaultValue: "'top'", description: 'Which row.' },
        {
          name: 'column',
          type: '1 | 2 | 3 | 4 | 5 | 6 | 7',
          defaultValue: '1',
          description: 'Position in the row; picks the sprite.',
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

export function CreativeScrollerPage(): JSX.Element {
  const [value, setValue] = useState(0.3);
  return (
    <ComponentDoc
      intro={
        <>
          The 12×15 scroll thumb of the creative inventory on an invisible track. Drag it, or use
          the arrow keys, Home and End. Pass <Code>sprite</Code>, <Code>disabledSprite</Code>,{' '}
          <Code>thumbWidth</Code> and <Code>thumbHeight</Code> to use any other thumb;{' '}
          <Code>VillagerScroller</Code> is built that way.
        </>
      }
      demo={
        <div className="site-row">
          <CreativeScroller value={value} onValueChange={setValue} aria-label="Scroll" />
          <CreativeScroller disabled aria-label="Scroll (disabled)" />
        </div>
      }
      code="<CreativeScroller value={scroll} onValueChange={setScroll} height={112} />"
      rows={[
        { name: 'value / defaultValue', type: 'number', description: 'Scroll position, 0 to 1.' },
        {
          name: 'onValueChange',
          type: '(value: number) => void',
          description: 'Called while dragging.',
        },
        {
          name: 'height',
          type: 'number',
          defaultValue: '112',
          description: 'Track height in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed thumb, no input.',
        },
        { name: 'step', type: 'number', defaultValue: '0.1', description: 'Arrow key step.' },
        AS,
      ]}
    />
  );
}

export function VillagerScrollerPage(): JSX.Element {
  const [value, setValue] = useState(0.4);
  return (
    <ComponentDoc
      intro={
        <>
          The 6×27 thumb beside the villager trade list: a <Code>CreativeScroller</Code> with the
          trading screen&apos;s sprites. The default track height of 139 is an approximation of the
          game&apos;s.
        </>
      }
      demo={
        <div className="site-row">
          <VillagerScroller value={value} onValueChange={setValue} />
          <VillagerScroller disabled aria-label="Trades (disabled)" />
        </div>
      }
      code="<VillagerScroller value={scroll} onValueChange={setScroll} />"
      rows={[
        { name: 'value / defaultValue', type: 'number', description: 'Scroll position, 0 to 1.' },
        {
          name: 'onValueChange',
          type: '(value: number) => void',
          description: 'Called while dragging.',
        },
        {
          name: 'height',
          type: 'number',
          defaultValue: '139',
          description: 'Track height in GUI units.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Greyed thumb, no input.',
        },
        AS,
      ]}
    />
  );
}

export function TradeArrowPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The 10×9 arrow between a trade&apos;s inputs and its result. <Code>outOfStock</Code> draws
          the red, crossed-out variant.
        </>
      }
      demo={
        <div className="site-row">
          <TradeArrow />
          <TradeArrow outOfStock />
        </div>
      }
      code="<TradeArrow outOfStock={trade.soldOut} />"
      rows={[
        {
          name: 'outOfStock',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The crossed-out arrow.',
        },
      ]}
    />
  );
}

export function VillagerXpBarPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The villager level bar of the trading screen: 102×5, with the current progress and, past
          it, a lighter span for the experience the selected trade would grant.
        </>
      }
      demo={
        <div className="site-stack">
          <VillagerXpBar progress={0.4} gain={0.2} />
          <VillagerXpBar progress={0.75} />
        </div>
      }
      code="<VillagerXpBar progress={0.4} gain={0.2} />"
      rows={[
        { name: 'progress', type: 'number', description: 'Progress through the level, 0 to 1.' },
        {
          name: 'gain',
          type: 'number',
          defaultValue: '0',
          description: 'Progress the selected trade adds.',
        },
        AS,
      ]}
    />
  );
}

export function StatusEffectEntryPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          An active effect in the inventory&apos;s side panel: the 32×32 nine-sliced{' '}
          <Code>effect_background</Code> (a different one for ambient effects such as beacons), the
          icon, and the name and remaining time. <Code>compact</Code> shows only the icon in a 32×32
          box. The text and icon offsets are approximations of the game&apos;s; the icon is any
          element, like <Code>EffectIcon</Code>.
        </>
      }
      demo={
        <div className="site-stack">
          <StatusEffectEntry name="Speed II" duration="0:42">
            <EffectIcon name="speed" />
          </StatusEffectEntry>
          <StatusEffectEntry name="Haste" duration="∞" ambient>
            <EffectIcon name="haste" />
          </StatusEffectEntry>
          <StatusEffectEntry compact>
            <EffectIcon name="speed" />
          </StatusEffectEntry>
        </div>
      }
      code="<StatusEffectEntry name='Speed II' duration='0:42'><EffectIcon /></StatusEffectEntry>"
      rows={[
        { name: 'name', type: 'ReactNode', description: 'The effect’s name.' },
        { name: 'duration', type: 'ReactNode', description: 'Remaining time.' },
        {
          name: 'ambient',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Beacon or conduit background.',
        },
        {
          name: 'compact',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Icon only, 32×32.',
        },
        { name: 'children', type: 'ReactNode', description: 'The icon, in an 18×18 area.' },
        AS,
      ]}
    />
  );
}

export function GameModeSlotPage(): JSX.Element {
  const [selected, setSelected] = useState(1);
  const modes = [
    ['Creative Mode', 'grass_block'],
    ['Survival Mode', 'iron_sword'],
    ['Adventure Mode', 'map'],
    ['Spectator Mode', 'ender_eye'],
  ] as const;
  return (
    <ComponentDoc
      intro={
        <>
          One slot of the F3+F4 game mode switcher: the 26×26 <Code>gamemode_switcher/slot</Code>{' '}
          with the <Code>selection</Code> frame drawn over it while selected and the icon centred
          inside. Supply your own icon.
        </>
      }
      demo={
        <div className="site-row" role="radiogroup" aria-label="Game mode">
          {modes.map(([mode, item], index) => (
            <GameModeSlot
              key={mode}
              label={mode}
              selected={index === selected}
              onClick={() => setSelected(index)}
            >
              <ItemIcon name={item} />
            </GameModeSlot>
          ))}
        </div>
      }
      code="<GameModeSlot label='Creative Mode' selected={mode === 'creative'}><Icon /></GameModeSlot>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name of the mode.' },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draw the selection frame.',
        },
        { name: 'children', type: 'ReactNode', description: 'The mode’s icon.' },
        AS,
      ]}
    />
  );
}

export function CookingArrowPage(): JSX.Element {
  const [progress, setProgress] = useState(0.5);
  return (
    <ComponentDoc
      intro={
        <>
          The arrow of a furnace, smoker or blast furnace that fills left to right as the item
          cooks: 24×16, filled by <Code>ceil(progress * 24)</Code> units. In the game it is drawn
          over the empty arrow printed on the screen&apos;s background texture; here the empty arrow
          is not drawn, so the demo shows the fill alone.
        </>
      }
      demo={
        <div className="site-row">
          <CookingArrow progress={progress} />
          <CookingArrow progress={progress} station="smoker" />
          <CookingArrow progress={progress} station="blast_furnace" />
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
      code="<CookingArrow progress={cookTime / cookTimeTotal} station='smoker' />"
      rows={[
        { name: 'progress', type: 'number', description: 'Progress through the item, 0 to 1.' },
        {
          name: 'station',
          type: "'furnace' | 'smoker' | 'blast_furnace'",
          defaultValue: "'furnace'",
          description: 'Which sprites.',
        },
        AS,
      ]}
    />
  );
}

export function FuelFlamePage(): JSX.Element {
  const [lit, setLit] = useState(0.6);
  return (
    <ComponentDoc
      intro={
        <>
          The flame of a furnace, smoker or blast furnace that burns down from the top as the fuel
          runs out: 14×14, with <Code>ceil(lit * 13) + 1</Code> rows visible while there is fuel.
          Like the arrow, it is drawn over a flame printed on the background texture in the game.
        </>
      }
      demo={
        <div className="site-row">
          <FuelFlame lit={lit} />
          <FuelFlame lit={lit} station="smoker" />
          <FuelFlame lit={lit} station="blast_furnace" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={lit}
            aria-label="Fuel"
            onChange={(event) => setLit(Number(event.target.value))}
          />
        </div>
      }
      code="<FuelFlame lit={litTime / litDuration} />"
      rows={[
        { name: 'lit', type: 'number', description: 'Fuel left in the current item, 0 to 1.' },
        {
          name: 'station',
          type: "'furnace' | 'smoker' | 'blast_furnace'",
          defaultValue: "'furnace'",
          description: 'Which sprites.',
        },
        AS,
      ]}
    />
  );
}

export function BrewArrowPage(): JSX.Element {
  const [progress, setProgress] = useState(0.5);
  return (
    <ComponentDoc
      intro={
        <>
          The down arrow of the brewing stand that fills from the top as potions brew: 9×28, filled
          by <Code>floor(28 * progress)</Code> units.
        </>
      }
      demo={
        <div className="site-row">
          <BrewArrow progress={progress} />
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
      code="<BrewArrow progress={1 - brewTime / 400} />"
      rows={[
        { name: 'progress', type: 'number', description: 'Progress through the brew, 0 to 1.' },
        AS,
      ]}
    />
  );
}

export function FuelBarPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The blaze powder bar of the brewing stand: 18×4, with the fill set by the number of
          charges left out of 20.
        </>
      }
      demo={
        <div className="site-stack">
          <FuelBar fuel={20} />
          <FuelBar fuel={10} />
          <FuelBar fuel={1} />
        </div>
      }
      code="<FuelBar fuel={fuel} />"
      rows={[{ name: 'fuel', type: 'number', description: 'Charges left, 0 to 20.' }, AS]}
    />
  );
}

export function EnchantmentSlotPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          One option row of the enchanting table: the 108×19 row with its level icon at the left,
          the hint text, and the level cost at the right end. A row that cannot be bought is dim and
          inert. The text positions and colors are approximations of the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <EnchantmentSlot option={1} label="Enchantment option 1, 1 level" cost={1}>
            Clue text
          </EnchantmentSlot>
          <EnchantmentSlot option={2} label="Enchantment option 2, 2 levels" cost={2}>
            Clue text
          </EnchantmentSlot>
          <EnchantmentSlot option={3} label="Enchantment option 3, 3 levels" cost={30} disabled>
            Clue text
          </EnchantmentSlot>
        </div>
      }
      code="<EnchantmentSlot option={2} cost={2} label='Enchantment option 2' onClick={buy}>…</EnchantmentSlot>"
      rows={[
        { name: 'option', type: '1 | 2 | 3', description: 'The row number; picks the level icon.' },
        { name: 'cost', type: 'ReactNode', description: 'Level cost, drawn at the right end.' },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Dim, inert row.',
        },
        { name: 'label', type: 'string', description: 'Accessible name.' },
        { name: 'children', type: 'ReactNode', description: 'The hint text.' },
        AS,
      ]}
    />
  );
}

export function BeaconButtonPage(): JSX.Element {
  const [selected, setSelected] = useState(0);
  return (
    <ComponentDoc
      intro={
        <>
          A button of the beacon screen: the 22×22 <Code>container/beacon/button</Code> frame, lit
          when hovered or focused and dark when selected or disabled. <Code>effect</Code> buttons
          hold an 18×18 icon you supply; <Code>confirm</Code> and <Code>cancel</Code> have their
          own.
        </>
      }
      demo={
        <div className="site-row">
          {(
            [
              ['speed', 'Speed'],
              ['haste', 'Haste'],
              ['resistance', 'Resistance'],
            ] as const
          ).map(([id, name], index) => (
            <BeaconButton
              key={name}
              label={name}
              selected={index === selected}
              onClick={() => setSelected(index)}
            >
              <EffectIcon name={id} />
            </BeaconButton>
          ))}
          <BeaconButton label="Jump Boost" disabled />
          <BeaconButton label="Confirm" kind="confirm" />
          <BeaconButton label="Cancel" kind="cancel" />
        </div>
      }
      code="<BeaconButton label='Speed' selected={effect === 'speed'} onClick={choose}><Icon /></BeaconButton>"
      rows={[
        { name: 'label', type: 'string', description: 'Accessible name.' },
        {
          name: 'kind',
          type: "'effect' | 'confirm' | 'cancel'",
          defaultValue: "'effect'",
          description: 'Which icon.',
        },
        {
          name: 'selected',
          type: 'boolean',
          defaultValue: 'false',
          description: 'The chosen effect.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Dim, inert button.',
        },
        { name: 'children', type: 'ReactNode', description: 'The effect icon.' },
        AS,
      ]}
    />
  );
}

export function PanelPage(): JSX.Element {
  const backgrounds = [
    'popup/background',
    'social_interactions/background',
    'friends/background',
    'friends/background_dark',
    'advancements/title_box',
    'widget/text_field',
  ] as const;
  return (
    <ComponentDoc
      intro={
        <>
          A box with one of the game&apos;s nine-sliced backgrounds behind its content. Give it a{' '}
          <Code>width</Code> and <Code>height</Code>, or let the content decide and pad it with CSS:
          the background follows the measured box, keeping its corners.
        </>
      }
      demo={
        <div className="site-stack">
          {backgrounds.map((background) => (
            <Panel key={background} background={background} width={200} height={30}>
              <span
                className="cobble-text"
                data-shadow=""
                style={{
                  position: 'absolute',
                  left: 'calc(8 * var(--cobble-px))',
                  top: 'calc(10 * var(--cobble-px))',
                }}
              >
                {background}
              </span>
            </Panel>
          ))}
        </div>
      }
      code="<Panel background='popup/background' width={200} height={60}>…</Panel>"
      rows={[
        {
          name: 'background',
          type: 'PanelBackground',
          defaultValue: "'popup/background'",
          description: 'Which nine-slice sprite.',
        },
        {
          name: 'width / height',
          type: 'number',
          description: 'Fixed size in GUI units; measured when omitted.',
        },
        AS,
      ]}
    />
  );
}

export function SlotGridPage(): JSX.Element {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <ComponentDoc
      intro={
        <>
          A rectangular grid of <Code>InventorySlot</Code>s 18 units apart, like a chest or the
          crafting grid. Pass <Code>items</Code> in reading order; each can carry a stack{' '}
          <Code>count</Code> and an accessible <Code>label</Code>. Item textures are not GUI assets,
          so supply your own content.
        </>
      }
      demo={
        <div className="site-stack">
          <SlotGrid
            columns={9}
            rows={3}
            label="Chest"
            onSlotClick={setPicked}
            items={[
              { content: <ItemIcon name="cobblestone" />, count: 64, label: 'Cobblestone' },
              { content: <ItemIcon name="iron_ingot" />, count: 12, label: 'Iron Ingot' },
              undefined,
              { content: <ItemIcon name="diamond_pickaxe" />, label: 'Diamond Pickaxe' },
            ]}
          />
          <SlotGrid columns={4} rows={1} label="Armor" emptyIcon="helmet" />
          <span className="cobble-text" data-shadow="">
            {picked === null ? 'Click a slot' : `Slot ${String(picked + 1)}`}
          </span>
        </div>
      }
      code="<SlotGrid columns={9} rows={3} items={chest.map(toItem)} onSlotClick={pickUp} />"
      rows={[
        { name: 'columns / rows', type: 'number', description: 'Grid size in slots.' },
        {
          name: 'items',
          type: '(SlotGridItem | undefined)[]',
          description: 'Slot contents in reading order.',
        },
        {
          name: 'emptyIcon',
          type: 'EmptySlotIcon',
          description: 'Placeholder in every empty slot.',
        },
        {
          name: 'onSlotClick',
          type: '(index: number) => void',
          description: 'A slot was clicked or activated.',
        },
        { name: 'label', type: 'string', description: 'Accessible name of the grid.' },
        AS,
      ]}
    />
  );
}

export function PlayerInventoryGridPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The player&apos;s inventory as every container screen shows it: three rows of nine, a
          4-unit gap, then the hotbar row. It is 162 units wide and 76 tall. Slots are reported as{' '}
          <Code>main</Code> or <Code>hotbar</Code> plus their index within that area.
        </>
      }
      demo={
        <PlayerInventoryGrid
          items={[{ content: <ItemIcon name="oak_planks" />, count: 32, label: 'Oak Planks' }]}
          hotbar={[
            { content: <ItemIcon name="iron_sword" />, label: 'Sword' },
            { content: <ItemIcon name="torch" />, count: 16, label: 'Torch' },
          ]}
        />
      }
      code="<PlayerInventoryGrid items={inventory.main} hotbar={inventory.hotbar} onSlotClick={pickUp} />"
      rows={[
        {
          name: 'items',
          type: '(SlotGridItem | undefined)[]',
          description: 'The 27 main slots, in reading order.',
        },
        {
          name: 'hotbar',
          type: '(SlotGridItem | undefined)[]',
          description: 'The 9 hotbar slots.',
        },
        {
          name: 'onSlotClick',
          type: "(area: 'main' | 'hotbar', index: number) => void",
          description: 'A slot was clicked or activated.',
        },
        AS,
      ]}
    />
  );
}

export function CraftingGridPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          A crafting grid with its result slot: 3×3 (or, with <Code>size={'{2}'}</Code>, 2×2)
          ingredient slots and the output slot to the right. The arrow between them is part of the
          screen&apos;s background texture in the game and is not drawn here. The result offset is
          recalled from vanilla and is an approximation.
        </>
      }
      demo={
        <div className="site-stack">
          <CraftingGrid
            ingredients={[
              { content: <ItemIcon name="oak_planks" />, label: 'Plank' },
              { content: <ItemIcon name="oak_planks" />, label: 'Plank' },
              undefined,
              { content: <ItemIcon name="oak_planks" />, label: 'Plank' },
              { content: <ItemIcon name="oak_planks" />, label: 'Plank' },
            ]}
            result={{
              content: <ItemIcon name="crafting_table" />,
              count: 1,
              label: 'Crafting Table',
            }}
          />
          <CraftingGrid size={2} />
        </div>
      }
      code="<CraftingGrid ingredients={recipe} result={output} onResultClick={take} />"
      rows={[
        { name: 'size', type: '2 | 3', defaultValue: '3', description: 'Grid size.' },
        {
          name: 'ingredients',
          type: '(SlotGridItem | undefined)[]',
          description: 'Ingredient slots in reading order.',
        },
        {
          name: 'result',
          type: 'SlotGridItem',
          description: 'The crafted item; empty when omitted.',
        },
        {
          name: 'onIngredientClick',
          type: '(index: number) => void',
          description: 'An ingredient slot was clicked.',
        },
        { name: 'onResultClick', type: '() => void', description: 'The result slot was clicked.' },
        AS,
      ]}
    />
  );
}

export function EnchantingTablePanelPage(): JSX.Element {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the enchanting table screen: the item slot, the lapis slot (with
          its placeholder icon while empty) and the three option rows, at the game&apos;s own
          coordinates. The book is not drawn; the screen background is. The slot coordinates are
          recalled from vanilla and are approximations.
        </>
      }
      demo={
        <div className="site-stack">
          <EnchantingTablePanel
            item={{ content: <ItemIcon name="iron_sword" />, label: 'Iron Sword' }}
            lapis={{ content: <ItemIcon name="lapis_lazuli" />, count: 3 }}
            options={[
              { clue: 'Clue text', cost: 1, label: 'Enchantment option 1, 1 level' },
              { clue: 'Clue text', cost: 2, label: 'Enchantment option 2, 2 levels' },
              {
                clue: 'Clue text',
                cost: 30,
                disabled: true,
                label: 'Enchantment option 3, 30 levels',
              },
            ]}
            onOptionClick={setChosen}
          />
          <span className="cobble-text" data-shadow="">
            {chosen === null ? 'Pick an option' : `Option ${String(chosen)}`}
          </span>
        </div>
      }
      code="<EnchantingTablePanel item={sword} lapis={lapis} options={offers} onOptionClick={enchant} />"
      rows={[
        { name: 'item', type: 'SlotGridItem', description: 'The item to enchant.' },
        { name: 'lapis', type: 'SlotGridItem', description: 'The lapis lazuli stack.' },
        {
          name: 'options',
          type: 'EnchantingOption[]',
          description: 'The three offers; missing ones are disabled rows.',
        },
        {
          name: 'onItemClick / onLapisClick',
          type: '() => void',
          description: 'A slot was clicked.',
        },
        {
          name: 'onOptionClick',
          type: '(option: 1 | 2 | 3) => void',
          description: 'An offer was chosen.',
        },
        AS,
      ]}
    />
  );
}

const NOTE = (
  <>
    Coordinates are recalled from vanilla and are approximations; the screen&apos;s own background
    artwork is drawn behind it. Any element works as item content.
  </>
);

export function AnvilPanelPage(): JSX.Element {
  const [name, setName] = useState('Excalibur');
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the anvil screen: two input slots, the result, the name field (dim
          until there is an item) and the red cross over the arrow. {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <AnvilPanel
            left={{ content: <ItemIcon name="iron_sword" />, label: 'Iron Sword' }}
            right={{ content: <ItemIcon name="iron_ingot" />, count: 2, label: 'Iron Ingot' }}
            result={{ content: <ItemIcon name="iron_sword" />, label: 'Repaired Iron Sword' }}
            name={name}
            onNameChange={setName}
          />
          <AnvilPanel
            left={{ content: <ItemIcon name="diamond_sword" />, label: 'Diamond Sword' }}
            right={{ content: <ItemIcon name="oak_planks" />, label: 'Oak Planks' }}
            error
          />
        </div>
      }
      code="<AnvilPanel left={a} right={b} result={out} name={name} onNameChange={setName} error={!ok} />"
      rows={[
        { name: 'left / right / result', type: 'SlotGridItem', description: 'The three slots.' },
        { name: 'name / onNameChange', type: 'string', description: 'The new item name.' },
        {
          name: 'error',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draw the red cross.',
        },
        {
          name: 'onSlotClick',
          type: "(slot: 'left' | 'right' | 'result') => void",
          description: 'A slot was clicked.',
        },
        AS,
      ]}
    />
  );
}

export function BrewingStandPanelPage(): JSX.Element {
  const [time, setTime] = useState(200);
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the brewing stand screen: three bottle slots, the ingredient and
          fuel slots, the blaze powder bar, the brewing arrow and the bubbles. Drive it with the
          ticks left in the brew (out of 400). {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <BrewingStandPanel
            bottles={[
              { content: <ItemIcon name="potion" />, label: 'Water Bottle' },
              undefined,
              { content: <ItemIcon name="potion" />, label: 'Water Bottle' },
            ]}
            ingredient={{ content: <ItemIcon name="nether_wart" />, label: 'Nether Wart' }}
            fuel={{ content: <ItemIcon name="blaze_powder" />, count: 3, label: 'Blaze Powder' }}
            brewTime={time}
            fuelCharges={15}
          />
          <input
            type="range"
            min={0}
            max={400}
            value={time}
            aria-label="Brew time"
            onChange={(event) => setTime(Number(event.target.value))}
          />
        </div>
      }
      code="<BrewingStandPanel bottles={bottles} ingredient={i} fuel={f} brewTime={t} fuelCharges={n} />"
      rows={[
        {
          name: 'bottles',
          type: '(SlotGridItem | undefined)[]',
          description: 'The three bottle slots.',
        },
        { name: 'ingredient / fuel', type: 'SlotGridItem', description: 'The other two slots.' },
        { name: 'brewTime', type: 'number', defaultValue: '0', description: 'Ticks left, of 400.' },
        {
          name: 'fuelCharges',
          type: 'number',
          defaultValue: '0',
          description: 'Blaze powder charges, 0 to 20.',
        },
        { name: 'onSlotClick', type: '(slot) => void', description: 'A slot was clicked.' },
        AS,
      ]}
    />
  );
}

export function FurnacePanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the furnace, smoker and blast furnace screens: input, fuel and
          output slots, the flame and the cooking arrow. {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <FurnacePanel
            input={{ content: <ItemIcon name="raw_iron" />, label: 'Raw Iron' }}
            fuel={{ content: <ItemIcon name="coal" />, count: 8, label: 'Coal' }}
            output={{ content: <ItemIcon name="iron_ingot" />, count: 3, label: 'Iron Ingot' }}
            cookProgress={0.6}
            litProgress={0.7}
          />
          <FurnacePanel station="smoker" cookProgress={0.3} litProgress={0.4} />
        </div>
      }
      code="<FurnacePanel input={i} fuel={f} output={o} cookProgress={0.6} litProgress={0.7} />"
      rows={[
        { name: 'input / fuel / output', type: 'SlotGridItem', description: 'The three slots.' },
        {
          name: 'cookProgress / litProgress',
          type: 'number',
          description: 'Arrow and flame, 0 to 1.',
        },
        {
          name: 'station',
          type: "'furnace' | 'smoker' | 'blast_furnace'",
          defaultValue: "'furnace'",
          description: 'Which artwork.',
        },
        {
          name: 'onSlotClick',
          type: "(slot: 'input' | 'fuel' | 'output') => void",
          description: 'A slot was clicked.',
        },
        AS,
      ]}
    />
  );
}

/** What the stonecutter makes from one stone. */
const STONE_RECIPES = [
  ['Stone Slab', 'stone_slab'],
  ['Stone Stairs', 'stone_stairs'],
  ['Stone Bricks', 'stone_bricks'],
  ['Stone Brick Slab', 'stone_brick_slab'],
  ['Stone Brick Stairs', 'stone_brick_stairs'],
  ['Stone Brick Wall', 'stone_brick_wall'],
  ['Chiseled Stone Bricks', 'chiseled_stone_bricks'],
] as const;

export function StonecutterPanelPage(): JSX.Element {
  const [selected, setSelected] = useState<number | null>(1);
  const [scroll, setScroll] = useState(0);
  const recipes = STONE_RECIPES.map(([label, item]) => ({
    content: <ItemIcon name={item} />,
    label,
  }));
  const chosen = selected === null ? undefined : STONE_RECIPES[selected];
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the stonecutter screen: the input and result slots, the 4×3 grid
          of recipe cells and its scroller. The grid scrolls by whole rows, starting at{' '}
          <Code>(int)(scroll * offscreenRows + 0.5)</Code> rows down. {NOTE}
        </>
      }
      demo={
        <StonecutterPanel
          input={{ content: <ItemIcon name="stone" />, count: 5, label: 'Stone' }}
          result={
            chosen === undefined
              ? undefined
              : { content: <ItemIcon name={chosen[1]} />, label: chosen[0] }
          }
          recipes={recipes}
          selectedRecipe={selected}
          onRecipeClick={setSelected}
          scroll={scroll}
          onScrollChange={setScroll}
        />
      }
      code="<StonecutterPanel input={stone} recipes={recipes} selectedRecipe={i} onRecipeClick={pick} scroll={s} onScrollChange={setS} />"
      rows={[
        { name: 'input / result', type: 'SlotGridItem', description: 'The two slots.' },
        { name: 'recipes', type: '{ content, label }[]', description: 'Every available recipe.' },
        {
          name: 'selectedRecipe / onRecipeClick',
          type: 'number',
          description: 'The chosen recipe.',
        },
        {
          name: 'scroll / onScrollChange',
          type: 'number',
          description: 'Scroll position, 0 to 1.',
        },
        AS,
      ]}
    />
  );
}

/** The patterns the loom offers for a banner and a dye alone (the ones that need no pattern item). */
const LOOM_PATTERNS = [
  'Bottom Stripe',
  'Top Stripe',
  'Left Stripe',
  'Right Stripe',
  'Center Stripe',
  'Middle Stripe',
  'Down Right Stripe',
  'Down Left Stripe',
  'Small Stripes',
  'Diagonal Left',
  'Diagonal Right',
  'Diagonal Up Left',
  'Diagonal Up Right',
  'Circle',
  'Rhombus',
  'Half Vertical',
  'Half Horizontal',
  'Half Vertical Right',
  'Half Horizontal Bottom',
  'Bottom Left Corner',
  'Bottom Right Corner',
  'Top Left Corner',
  'Top Right Corner',
  'Bottom Triangle',
  'Top Triangle',
  'Bottom Triangle Sawtooth',
  'Top Triangle Sawtooth',
  'Cross',
  'Straight Cross',
  'Gradient',
  'Base Gradient',
] as const;

export function LoomPanelPage(): JSX.Element {
  const [selected, setSelected] = useState<number | null>(0);
  const [scroll, setScroll] = useState(0);
  const patterns = LOOM_PATTERNS.map((label) => ({ label }));
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the loom screen: banner, dye, pattern item and result slots, and
          the 4×4 grid of pattern cells with its scroller. The grid scrolls by whole rows. Patterns
          are labelled with the game&apos;s names; supply a banner preview as <Code>content</Code>{' '}
          to draw them. {NOTE}
        </>
      }
      demo={
        <LoomPanel
          banner={{ content: <ItemIcon name="white_banner" />, label: 'White Banner' }}
          dye={{ content: <ItemIcon name="red_dye" />, label: 'Red Dye' }}
          result={{ content: <ItemIcon name="white_banner" />, label: 'White Banner' }}
          patterns={patterns}
          selectedPattern={selected}
          onPatternClick={setSelected}
          scroll={scroll}
          onScrollChange={setScroll}
        />
      }
      code="<LoomPanel banner={b} dye={d} patterns={patterns} selectedPattern={i} onPatternClick={pick} />"
      rows={[
        {
          name: 'banner / dye / patternItem / result',
          type: 'SlotGridItem',
          description: 'The four slots.',
        },
        { name: 'patterns', type: '{ content, label }[]', description: 'Every available pattern.' },
        {
          name: 'selectedPattern / onPatternClick',
          type: 'number',
          description: 'The chosen pattern.',
        },
        {
          name: 'scroll / onScrollChange',
          type: 'number',
          description: 'Scroll position, 0 to 1.',
        },
        AS,
      ]}
    />
  );
}

export function CartographyPanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the cartography table screen: map, material and result slots, the
          preview frame (plain, zoomed out or copied), the padlock for a locked map, and the red
          error cross. Draw the map itself as children. {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <CartographyPanel
            map={{ content: <ItemIcon name="filled_map" />, label: 'Map' }}
            material={{ content: <ItemIcon name="paper" />, label: 'Paper' }}
            result={{ content: <ItemIcon name="filled_map" />, label: 'Zoomed Map' }}
            preview="scaled"
          >
            <ItemIcon name="filled_map" />
          </CartographyPanel>
          <CartographyPanel
            map={{ content: <ItemIcon name="filled_map" />, label: 'Map' }}
            material={{ content: <ItemIcon name="map" />, label: 'Empty Map' }}
            result={{ content: <ItemIcon name="filled_map" />, count: 2, label: 'Copied Map' }}
            preview="duplicated"
          />
          <CartographyPanel
            map={{ content: <ItemIcon name="filled_map" />, label: 'Map' }}
            material={{ content: <ItemIcon name="glass_pane" />, label: 'Glass Pane' }}
            result={{ content: <ItemIcon name="filled_map" />, label: 'Locked Map' }}
            preview="map"
            locked
          />
          <CartographyPanel
            map={{ content: <ItemIcon name="filled_map" />, label: 'Map' }}
            material={{ content: <ItemIcon name="paper" />, label: 'Paper' }}
            error
          />
        </div>
      }
      code="<CartographyPanel map={m} material={p} preview='scaled' locked={l} error={!ok}><MapView /></CartographyPanel>"
      rows={[
        { name: 'map / material / result', type: 'SlotGridItem', description: 'The three slots.' },
        {
          name: 'preview',
          type: "'map' | 'scaled' | 'duplicated'",
          description: 'The preview frame.',
        },
        { name: 'locked / error', type: 'boolean', description: 'Padlock and error cross.' },
        AS,
      ]}
    />
  );
}

export function GrindstonePanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the grindstone screen: two input slots, the result and the error
          cross. {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <GrindstonePanel
            top={{ content: <ItemIcon name="diamond_sword" />, label: 'Enchanted Diamond Sword' }}
            result={{ content: <ItemIcon name="diamond_sword" />, label: 'Diamond Sword' }}
          />
          <GrindstonePanel error />
        </div>
      }
      code="<GrindstonePanel top={a} bottom={b} result={out} error={!ok} />"
      rows={[
        { name: 'top / bottom / result', type: 'SlotGridItem', description: 'The three slots.' },
        {
          name: 'error',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draw the red cross.',
        },
        AS,
      ]}
    />
  );
}

export function SmithingTablePanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the smithing table screen: template, base, addition and result
          slots (the first three with their placeholder silhouettes), the error cross and the armor
          stand beside them (a flat stand-in for the game&apos;s 3D preview, without armor). {NOTE}
        </>
      }
      demo={
        <div className="site-stack">
          <SmithingTablePanel />
          <SmithingTablePanel
            template={{
              content: <ItemIcon name="netherite_upgrade_smithing_template" />,
              label: 'Netherite Upgrade',
            }}
            base={{ content: <ItemIcon name="diamond_sword" />, label: 'Diamond Sword' }}
            addition={{ content: <ItemIcon name="netherite_ingot" />, label: 'Netherite Ingot' }}
            result={{ content: <ItemIcon name="netherite_sword" />, label: 'Netherite Sword' }}
          />
        </div>
      }
      code="<SmithingTablePanel template={t} base={b} addition={a} result={out} error={!ok} />"
      rows={[
        {
          name: 'template / base / addition / result',
          type: 'SlotGridItem',
          description: 'The four slots.',
        },
        {
          name: 'error',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Draw the red cross.',
        },
        {
          name: 'armorStand',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Draw the armor stand preview (on by default when the background is drawn).',
        },
        AS,
      ]}
    />
  );
}

function effect(
  id: EffectId,
  label: string,
): { readonly content: JSX.Element; readonly label: string } {
  return { content: <EffectIcon name={id} />, label };
}

export function BeaconPanelPage(): JSX.Element {
  const [selected, setSelected] = useState<readonly (readonly [number, number])[]>([[0, 0]]);
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the beacon screen: the effect buttons in centred rows 25 units
          apart (one row per unlocked pyramid tier), the payment slot, and the confirm and cancel
          buttons. Row positions follow <Code>76 + index * 24 - rowWidth / 2</Code>. {NOTE}
        </>
      }
      demo={
        <BeaconPanel
          tiers={[
            [effect('speed', 'Speed'), effect('haste', 'Haste')],
            [effect('resistance', 'Resistance'), effect('jump_boost', 'Jump Boost')],
            [effect('strength', 'Strength')],
          ]}
          selected={selected}
          onEffectClick={(tier, index) => setSelected([[tier, index]])}
          payment={{ content: <ItemIcon name="iron_ingot" />, label: 'Iron Ingot' }}
        />
      }
      code="<BeaconPanel tiers={tiers} selected={chosen} onEffectClick={choose} onConfirm={apply} />"
      rows={[
        {
          name: 'tiers',
          type: '{ content, label, disabled? }[][]',
          description: 'Effect rows, one per tier.',
        },
        { name: 'selected', type: '[tier, index][]', description: 'The chosen effects.' },
        { name: 'payment', type: 'SlotGridItem', description: 'The payment slot.' },
        {
          name: 'onEffectClick / onConfirm / onCancel',
          type: 'function',
          description: 'Handlers.',
        },
        {
          name: 'confirmDisabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Dim the confirm button.',
        },
        AS,
      ]}
    />
  );
}

export function CrafterPanelPage(): JSX.Element {
  const [off, setOff] = useState<readonly boolean[]>([
    false,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the crafter screen: a 3×3 grid whose slots can each be switched
          off, the result slot and the redstone indicator. {NOTE}
        </>
      }
      demo={
        <CrafterPanel
          disabledSlots={off}
          onSlotClick={(index) => setOff(off.map((value, i) => (i === index ? !value : value)))}
          slots={[
            { content: <ItemIcon name="oak_planks" />, label: 'Oak Planks' },
            undefined,
            undefined,
            { content: <ItemIcon name="oak_planks" />, label: 'Oak Planks' },
          ]}
          result={{ content: <ItemIcon name="stick" />, count: 4, label: 'Stick' }}
          powered
        />
      }
      code="<CrafterPanel slots={grid} disabledSlots={off} onSlotClick={toggle} result={out} powered={signal} />"
      rows={[
        {
          name: 'slots',
          type: '(SlotGridItem | undefined)[]',
          description: 'The nine grid slots.',
        },
        { name: 'disabledSlots', type: 'boolean[]', description: 'Which slots are switched off.' },
        { name: 'result', type: 'SlotGridItem', description: 'The result slot.' },
        {
          name: 'powered',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Redstone indicator.',
        },
        AS,
      ]}
    />
  );
}

export function VillagerTradePanelPage(): JSX.Element {
  const [selected, setSelected] = useState<number | null>(0);
  const [scroll, setScroll] = useState(0);
  const offers = Array.from({ length: 10 }, (_, i) => ({
    label: `Trade ${String(i + 1)}`,
    buy: <ItemIcon name="emerald" />,
    buy2: i % 3 === 0 ? <ItemIcon name="paper" /> : undefined,
    sell: <ItemIcon name={demoItem(i)} />,
    outOfStock: i === 2,
  }));
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the villager trading screen: the scrollable list of up to seven
          trades, its scroller, the level bar and the two payment slots with the result. A spent
          trade is dimmed with a crossed-out arrow and cannot be chosen. {NOTE}
        </>
      }
      demo={
        <VillagerTradePanel
          offers={offers}
          selectedOffer={selected}
          onOfferClick={setSelected}
          scroll={scroll}
          onScrollChange={setScroll}
          levelProgress={0.4}
          payment={[{ content: <ItemIcon name="emerald" />, count: 24, label: 'Emerald' }]}
        />
      }
      code="<VillagerTradePanel offers={offers} selectedOffer={i} onOfferClick={pick} levelProgress={xp} />"
      rows={[
        {
          name: 'offers',
          type: 'TradeOffer[]',
          description: 'Every trade: label, buy, buy2, sell, outOfStock.',
        },
        { name: 'selectedOffer / onOfferClick', type: 'number', description: 'The chosen trade.' },
        {
          name: 'scroll / onScrollChange',
          type: 'number',
          description: 'Scroll position, 0 to 1.',
        },
        {
          name: 'payment / result',
          type: 'SlotGridItem',
          description: 'The payment slots and the result.',
        },
        {
          name: 'isolate',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Hide the player inventory slots. The villager window has no single crop line, so the full window with its bottom border is kept.',
        },
        {
          name: 'inventory / hotbar',
          type: 'SlotGridItem[]',
          description: 'Items of the player inventory.',
        },
        {
          name: 'levelProgress',
          type: 'number',
          description: 'Villager level progress; omit for a trader.',
        },
        AS,
      ]}
    />
  );
}

export function HopperPanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={<>The hopper&apos;s row of five slots, 18 units apart. {NOTE}</>}
      demo={
        <HopperPanel
          items={[{ content: <ItemIcon name="iron_ingot" />, count: 12, label: 'Iron Ingot' }]}
        />
      }
      code="<HopperPanel items={hopper} onSlotClick={pickUp} />"
      rows={[
        { name: 'items', type: '(SlotGridItem | undefined)[]', description: 'The five slots.' },
        {
          name: 'isolate',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Render only the container content, without the player inventory. The bottom border is kept.',
        },
        {
          name: 'inventory / hotbar',
          type: 'SlotGridItem[]',
          description: 'Items of the player inventory.',
        },
        {
          name: 'onSlotClick',
          type: '(index: number) => void',
          description: 'A slot was clicked.',
        },
        AS,
      ]}
    />
  );
}

export function DispenserPanelPage(): JSX.Element {
  return (
    <ComponentDoc
      intro={<>The 3×3 grid of a dispenser or dropper. {NOTE}</>}
      demo={
        <DispenserPanel
          items={[undefined, { content: <ItemIcon name="arrow" />, count: 64, label: 'Arrow' }]}
        />
      }
      code="<DispenserPanel items={dispenser} onSlotClick={pickUp} />"
      rows={[
        { name: 'items', type: '(SlotGridItem | undefined)[]', description: 'The nine slots.' },
        {
          name: 'isolate',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Render only the container content, without the player inventory. The bottom border is kept.',
        },
        {
          name: 'inventory / hotbar',
          type: 'SlotGridItem[]',
          description: 'Items of the player inventory.',
        },
        {
          name: 'onSlotClick',
          type: '(index: number) => void',
          description: 'A slot was clicked.',
        },
        AS,
      ]}
    />
  );
}

const CREATIVE_DEMO_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  content: <ItemIcon name={demoItem(i)} />,
  label: `Item ${String(i + 1)}`,
}));

const CREATIVE_DEMO_TABS = [
  'Building Blocks',
  'Colored Blocks',
  'Natural Blocks',
  'Functional Blocks',
  'Redstone Blocks',
  'Tools & Utilities',
  'Combat',
  'Food & Drinks',
  'Ingredients',
  'Spawn Eggs',
  'Operator Utilities',
  'Search Items',
  'Saved Hotbars',
  'Survival Inventory',
].map((label, i) => ({
  label,
  icon: <ItemIcon name={CREATIVE_TAB_ITEMS[i % CREATIVE_TAB_ITEMS.length] ?? 'stone'} />,
}));

export function CreativeInventoryPanelPage(): JSX.Element {
  const [tab, setTab] = useState(0);
  const [scroll, setScroll] = useState(0);
  return (
    <ComponentDoc
      intro={
        <>
          The interactive part of the creative inventory screen: up to 14 tabs (seven along the top,
          the rest along the bottom), the 9×5 item grid with its scroller, and the hotbar row.{' '}
          {NOTE}
        </>
      }
      demo={
        <CreativeInventoryPanel
          tabs={CREATIVE_DEMO_TABS}
          selectedTab={tab}
          onTabClick={setTab}
          scroll={scroll}
          onScrollChange={setScroll}
          items={CREATIVE_DEMO_ITEMS}
        />
      }
      code="<CreativeInventoryPanel tabs={tabs} selectedTab={i} onTabClick={pick} items={page} scroll={s} />"
      rows={[
        { name: 'tabs', type: '{ label, icon }[]', description: 'Up to 14 tabs.' },
        { name: 'selectedTab / onTabClick', type: 'number', description: 'The open tab.' },
        {
          name: 'items / hotbar',
          type: 'SlotGridItem[]',
          description: 'The 45 grid slots and 9 hotbar slots.',
        },
        {
          name: 'scroll / onScrollChange',
          type: 'number',
          description: 'Scroll position, 0 to 1.',
        },
        {
          name: 'scrollable',
          type: 'boolean',
          defaultValue: 'true',
          description: 'Grey the scroller out when false.',
        },
        AS,
      ]}
    />
  );
}
