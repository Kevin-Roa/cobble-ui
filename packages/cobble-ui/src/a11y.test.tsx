import axe from 'axe-core';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProvider } from '../test/utils.tsx';
import {
  AdvancementFrame,
  AdvancementTab,
  AdvancementWidget,
  Air,
  AnvilPanel,
  Armor,
  AttackIndicator,
  BeaconPanel,
  BossBar,
  Button,
  Checkbox,
  CartographyPanel,
  ChatInput,
  ChatLog,
  CookingArrow,
  CrafterPanel,
  CraftingGrid,
  CreativeInventoryPanel,
  CreativeScroller,
  CrossButton,
  CycleButton,
  EnchantingTablePanel,
  ExperienceBar,
  FuelFlame,
  GameModeSlot,
  Hearts,
  Hotbar,
  Hunger,
  Icon,
  IconButton,
  InventorySlot,
  JumpBar,
  LoomPanel,
  LocatorBar,
  LockButton,
  MuteButton,
  NotificationBadge,
  OptionsList,
  OptionsListHeader,
  OptionsListRow,
  PackListEntry,
  PageButton,
  PingIcon,
  PlayerInventoryGrid,
  ProgressBar,
  RecipeBookButton,
  RecipeBookFilterButton,
  RecipeBookSlot,
  RecipeBookTab,
  ReportButton,
  ResponseButton,
  ScrollArea,
  SelectionList,
  SelectionListGroup,
  SelectionListItem,
  ServerListEntry,
  Slider,
  SlotGrid,
  SocialPlayerEntry,
  SpectatorMenu,
  StatisticsHeaderButton,
  StonecutterPanel,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextArea,
  TextField,
  Toast,
  ToggleButton,
  VehicleHearts,
  VillagerScroller,
  VillagerTradePanel,
  VillagerXpBar,
  WorldListEntry,
  AnimatedSprite,
  AnvilTextField,
  BeaconButton,
  BrewArrow,
  BrewBubbles,
  BundleProgressBar,
  BundleSlot,
  CartographyMap,
  CrafterRedstone,
  CrafterSlot,
  CreativeTab,
  DispenserPanel,
  Dialog,
  DialogClose,
  EnchantmentSlot,
  FrameLayout,
  FriendsButton,
  FuelBar,
  GridLayout,
  GridLayoutCell,
  HopperPanel,
  HorseChestSlots,
  LinearLayout,
  LoomPatternButton,
  LoomScroller,
  EffectIcon,
  ItemIcon,
  PlayerHead,
  PlayerRenderer,
  ThreeViewport,
  BlockModel,
  PlayerInventory,
  ChestPanel,
  HotbarWithStats,
  Panel,
  PlayerActionButton,
  PlayerPingIcon,
  RealmStatusIcon,
  RealmsButton,
  RecipeBookPageButton,
  RecipeOverlayButton,
  Separator,
  StatusEffectEntry,
  StonecutterRecipeButton,
  StonecutterScroller,
  TradeArrow,
  WarningButton,
  ContainerError,
  ArmorStand,
  SmithingTablePanel,
  GrindstonePanel,
  Text,
  FormattedText,
} from './index.ts';

async function violations(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    // jsdom has no layout or paint, so these cannot be judged; the rest of the rules can.
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
      'scrollable-region-focusable': { enabled: false },
    },
  });
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? '?'}): ${violation.nodes
        .slice(0, 2)
        .map((node) => node.target.join(' '))
        .join(' | ')} -- ${violation.help}`,
  );
}

const CASES: readonly (readonly [string, ReactElement])[] = [
  ['Button', <Button key="a">Play</Button>],
  ['IconButton', <IconButton key="a" icon="icon/language" label="Language" />],
  [
    'CycleButton',
    <CycleButton
      key="a"
      label="Graphics"
      values={['Fast', 'Fancy'] as const}
      defaultValue="Fast"
    />,
  ],
  ['ToggleButton', <ToggleButton key="a" label="Sounds" defaultChecked />],
  ['LockButton', <LockButton key="a" />],
  ['RecipeBookButton', <RecipeBookButton key="a" />],
  ['CrossButton', <CrossButton key="a" />],
  ['PageButton', <PageButton key="a" direction="forward" />],
  ['MuteButton', <MuteButton key="a" />],
  ['ReportButton', <ReportButton key="a" />],
  ['ResponseButton', <ResponseButton key="a" kind="accept" />],
  [
    'StatisticsHeaderButton',
    <StatisticsHeaderButton key="a" column="item_used" label="Items Used" sort="ascending" />,
  ],
  ['Checkbox', <Checkbox key="a">Show Cheats</Checkbox>],
  ['Slider', <Slider key="a" label="FOV" min={30} max={110} defaultValue={70} />],
  ['TextField', <TextField key="a" aria-label="Name" />],
  ['TextArea', <TextArea key="a" aria-label="Notes" />],
  [
    'Tabs',
    <Tabs key="a" defaultValue="one">
      <TabList>
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
      </TabList>
      <TabPanel value="one">First</TabPanel>
      <TabPanel value="two">Second</TabPanel>
    </Tabs>,
  ],
  [
    'SelectionList',
    <SelectionList key="a" aria-label="Worlds" defaultValue="a">
      <SelectionListItem value="a">A</SelectionListItem>
      <SelectionListItem value="b">B</SelectionListItem>
    </SelectionList>,
  ],
  [
    'SelectionListGroup',
    <SelectionList key="a" aria-label="Pages">
      <SelectionListGroup label="Buttons">
        <SelectionListItem value="a">A</SelectionListItem>
      </SelectionListGroup>
    </SelectionList>,
  ],
  [
    'ScrollArea',
    <ScrollArea key="a" aria-label="Scrollable">
      content
    </ScrollArea>,
  ],
  [
    'OptionsList',
    <OptionsList key="a" aria-label="Options">
      <OptionsListHeader>Video</OptionsListHeader>
      <OptionsListRow>
        <Button width={310}>Done</Button>
      </OptionsListRow>
    </OptionsList>,
  ],
  ['ServerListEntry', <ServerListEntry key="a" name="Server" latency={20} status="1/20" />],
  ['WorldListEntry', <WorldListEntry key="a" name="World" />],
  ['PackListEntry', <PackListEntry key="a" name="Pack" canSelect canMoveUp />],
  ['SocialPlayerEntry', <SocialPlayerEntry key="a" name="Steve" onReport={() => undefined} />],
  ['PingIcon', <PingIcon key="a" latency={20} />],
  ['Hotbar', <Hotbar key="a" slots={['a', 'b']} />],
  ['SpectatorMenu', <SpectatorMenu key="a" icons={['close']} />],
  ['Hearts', <Hearts key="a" value={15} absorption={4} />],
  ['Hunger', <Hunger key="a" value={12} />],
  ['Armor', <Armor key="a" value={8} />],
  ['Air', <Air key="a" value={200} />],
  ['VehicleHearts', <VehicleHearts key="a" value={10} max={20} />],
  [
    'BossBar',
    <BossBar key="a" progress={0.5}>
      Dragon
    </BossBar>,
  ],
  ['ExperienceBar', <ExperienceBar key="a" progress={0.5} level={5} />],
  ['JumpBar', <JumpBar key="a" progress={0.5} />],
  ['LocatorBar', <LocatorBar key="a" waypoints={[{ position: 0 }]} />],
  ['AttackIndicator', <AttackIndicator key="a" strength={0.5} />],
  ['CookingArrow', <CookingArrow key="a" progress={0.5} />],
  ['FuelFlame', <FuelFlame key="a" lit={0.5} />],
  ['ProgressBar', <ProgressBar key="a" progress={0.5} />],
  ['VillagerXpBar', <VillagerXpBar key="a" progress={0.5} />],
  ['Toast', <Toast key="a" title="Saved" />],
  ['NotificationBadge', <NotificationBadge key="a" count={3} />],
  ['Icon (decorative)', <Icon key="a" name="info" />],
  ['Icon (labelled)', <Icon key="a" name="info" label="Info" />],
  [
    'InventorySlot',
    <InventorySlot key="a" aria-label="Slot" count={3}>
      x
    </InventorySlot>,
  ],
  ['SlotGrid', <SlotGrid key="a" columns={3} rows={2} label="Chest" />],
  ['PlayerInventoryGrid', <PlayerInventoryGrid key="a" />],
  ['CraftingGrid', <CraftingGrid key="a" />],
  ['RecipeBookTab', <RecipeBookTab key="a" label="Building" selected />],
  ['RecipeBookFilterButton', <RecipeBookFilterButton key="a" enabled />],
  ['RecipeBookSlot', <RecipeBookSlot key="a" label="Torch" />],
  ['CreativeScroller', <CreativeScroller key="a" aria-label="Scroll" />],
  ['VillagerScroller', <VillagerScroller key="a" />],
  ['AdvancementFrame', <AdvancementFrame key="a" type="goal" obtained />],
  ['AdvancementTab', <AdvancementTab key="a" label="Story" selected />],
  ['AdvancementWidget', <AdvancementWidget key="a" title="Stone Age" expanded />],
  [
    'GameModeSlot',
    <div key="a" role="radiogroup" aria-label="Game mode">
      <GameModeSlot label="Creative" selected />
      <GameModeSlot label="Survival" />
    </div>,
  ],
  ['AnvilPanel', <AnvilPanel key="a" left={{ content: 'x', label: 'Sword' }} />],
  ['BeaconPanel', <BeaconPanel key="a" tiers={[[{ label: 'Speed' }]]} />],
  ['CartographyPanel', <CartographyPanel key="a" preview="map" />],
  ['CrafterPanel', <CrafterPanel key="a" powered />],
  ['EnchantingTablePanel', <EnchantingTablePanel key="a" />],
  ['LoomPanel', <LoomPanel key="a" patterns={[{ label: 'Border' }]} />],
  ['StonecutterPanel', <StonecutterPanel key="a" recipes={[{ content: 'x', label: 'Stairs' }]} />],
  [
    'VillagerTradePanel',
    <VillagerTradePanel key="a" offers={[{ label: 'Trade', buy: 'a', sell: 'b' }]} />,
  ],
  ['CreativeInventoryPanel', <CreativeInventoryPanel key="a" tabs={[{ label: 'Blocks' }]} />],
  ['ChatLog', <ChatLog key="a" now={0} messages={[{ id: 1, content: 'hi', timestamp: 0 }]} />],
  ['ChatInput', <ChatInput key="a" onSubmit={() => undefined} />],
  [
    'AnimatedSprite',
    <AnimatedSprite key="a" sprite="realm_status/open" frameWidth={10} frameHeight={28} />,
  ],
  ['AnvilTextField', <AnvilTextField key="a" aria-label="Item name" />],
  ['BeaconButton', <BeaconButton key="a" label="Speed" selected />],
  ['BeaconButton (confirm)', <BeaconButton key="a" label="Confirm" kind="confirm" />],
  ['BrewArrow', <BrewArrow key="a" progress={0.5} />],
  ['BrewBubbles', <BrewBubbles key="a" brewTime={9} />],
  ['BundleProgressBar', <BundleProgressBar key="a" progress={0.5} />],
  [
    'BundleSlot',
    <BundleSlot key="a" highlighted>
      x
    </BundleSlot>,
  ],
  ['CartographyMap', <CartographyMap key="a" kind="map" />],
  ['CrafterRedstone', <CrafterRedstone key="a" powered />],
  ['CrafterSlot', <CrafterSlot key="a" label="Slot" slotDisabled />],
  ['CreativeTab', <CreativeTab key="a" label="Blocks" selected />],
  ['DispenserPanel', <DispenserPanel key="a" />],
  [
    'Dialog',
    <Dialog key="a" defaultOpen title="Sure?">
      <DialogClose>Cancel</DialogClose>
    </Dialog>,
  ],
  [
    'EnchantmentSlot',
    <EnchantmentSlot key="a" option={1} label="Option 1" cost={1}>
      clue
    </EnchantmentSlot>,
  ],
  [
    'FrameLayout',
    <FrameLayout key="a">
      <Button>x</Button>
    </FrameLayout>,
  ],
  ['FriendsButton', <FriendsButton key="a">Add</FriendsButton>],
  ['FuelBar', <FuelBar key="a" fuel={10} />],
  [
    'GridLayout',
    <GridLayout key="a" columns={2}>
      <GridLayoutCell>
        <Button>x</Button>
      </GridLayoutCell>
    </GridLayout>,
  ],
  ['HopperPanel', <HopperPanel key="a" />],
  ['HorseChestSlots', <HorseChestSlots key="a" columns={3} />],
  [
    'LinearLayout',
    <LinearLayout key="a">
      <Button>x</Button>
    </LinearLayout>,
  ],
  ['LoomPatternButton', <LoomPatternButton key="a" label="Border" selected />],
  ['LoomScroller', <LoomScroller key="a" />],
  ['ItemIcon', <ItemIcon key="a" name="apple" />],
  ['EffectIcon', <EffectIcon key="a" name="speed" />],
  ['PlayerHead', <PlayerHead key="a" />],
  ['PlayerHead (player)', <PlayerHead key="a" player="Steve" />],
  ['PlayerRenderer', <PlayerRenderer key="a" player="Steve" />],
  ['ThreeViewport', <ThreeViewport key="a" aria-label="Cube" fallback={<span>Loading</span>} />],
  ['BlockModel', <BlockModel key="a" name="stone" />],
  ['ThreeViewport (rotatable)', <ThreeViewport key="a" aria-label="Cube" rotatable />],
  ['PlayerInventory', <PlayerInventory key="a" player="Steve" />],
  ['ChestPanel', <ChestPanel key="a" title="Chest" />],
  ['HotbarWithStats', <HotbarWithStats key="a" armor={4} air={100} level={3} />],
  [
    'Panel',
    <Panel key="a" width={100} height={40}>
      x
    </Panel>,
  ],
  ['PlayerActionButton', <PlayerActionButton key="a" action="remove_player" />],
  ['PlayerPingIcon', <PlayerPingIcon key="a" latency={30} />],
  ['RealmStatusIcon', <RealmStatusIcon key="a" status="expires_soon" />],
  ['RealmsButton', <RealmsButton key="a">Play</RealmsButton>],
  ['RecipeBookPageButton', <RecipeBookPageButton key="a" direction="backward" />],
  ['RecipeOverlayButton', <RecipeOverlayButton key="a" label="Planks" craftable={false} />],
  ['Separator', <Separator key="a" />],
  [
    'StatusEffectEntry',
    <StatusEffectEntry key="a" name="Speed II" duration="0:42">
      i
    </StatusEffectEntry>,
  ],
  ['StonecutterRecipeButton', <StonecutterRecipeButton key="a" label="Stairs" selected />],
  ['StonecutterScroller', <StonecutterScroller key="a" />],
  ['TradeArrow', <TradeArrow key="a" outOfStock />],
  ['WarningButton', <WarningButton key="a" />],
  ['ContainerError (labelled)', <ContainerError key="a" kind="anvil" />],
  ['SmithingTablePanel', <SmithingTablePanel key="a" error />],
  ['ArmorStand', <ArmorStand key="a" />],
  ['GrindstonePanel', <GrindstonePanel key="a" error />],
  ['Text', <Text key="a">Hello</Text>],
  ['FormattedText', <FormattedText key="a" value="§eYellow §lBold" />],
];

describe('accessibility (axe-core)', () => {
  it.each(CASES)('%s has no detectable violations', async (_name, element) => {
    const { container } = renderWithProvider(element);
    expect(await violations(container)).toEqual([]);
  });
});
