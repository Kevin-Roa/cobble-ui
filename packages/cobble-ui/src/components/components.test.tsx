import {
  act,
  fireEvent,
  render as renderPlain,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { asSpriteId } from '../assets/sprite-id.ts';
import { png, renderWithProvider, testAssets } from '../../test/utils.tsx';
import type { AssetBundle, AssetSource } from '../index.ts';
import {
  BlockModel,
  ChestPanel,
  HotbarWithStats,
  PlayerHead,
  PlayerInventory,
  PlayerRenderer,
  ThreeViewport,
  mcHeadsUrl,
} from '../index.ts';
import {
  ASSET_PHASE_LABELS,
  Air,
  Panorama,
  usePrefersReducedMotion,
  CHAT_MAX_LENGTH,
  ChatInput,
  ChatLog,
  chatMessageOpacity,
  Screen,
  AssetLoadingOverlay,
  ProgressBar,
  assetProgressFraction,
  formatMegabytes,
  progressBarFill,
  TOAST_SLIDE_MS,
  ToastProvider,
  useToasts,
  OPTIONS_LIST_ROW_WIDTH,
  OptionsList,
  OptionsListHeader,
  OptionsListRow,
  FrameLayout,
  GridLayout,
  GridLayoutCell,
  LinearLayout,
  CreativeInventoryPanel,
  DispenserPanel,
  HopperPanel,
  VillagerTradePanel,
  tradeStartIndex,
  BeaconPanel,
  CartographyPanel,
  CrafterPanel,
  GrindstonePanel,
  LoomPanel,
  SmithingTablePanel,
  beaconEffectX,
  loomStartIndex,
  AnvilPanel,
  BrewingStandPanel,
  FurnacePanel,
  StonecutterPanel,
  brewProgress,
  stonecutterStartIndex,
  ENCHANTING_LAYOUT,
  EnchantingTablePanel,
  CRAFTING_RESULT_OFFSET,
  CraftingGrid,
  SocialPlayerEntry,
  INVENTORY_HOTBAR_GAP,
  PlayerInventoryGrid,
  SlotGrid,
  slotGridWidth,
  ICON_NAMES,
  Icon,
  PlayerPingIcon,
  RealmsButton,
  iconInfo,
  playerPingSprite,
  ANVIL_TEXT_FIELD_SPRITES,
  AnvilTextField,
  BrewBubbles,
  CartographyMap,
  CrafterRedstone,
  CrafterSlot,
  HorseChestSlots,
  RecipeOverlayButton,
  brewBubbleLength,
  cartographyMapSize,
  crafterSlotSprite,
  horseChestWidth,
  recipeOverlaySprite,
  textFieldSprite,
  ContainerError,
  LoomPatternButton,
  LoomScroller,
  RecipeBookFilterButton,
  RecipeBookPageButton,
  RecipeBookSlot,
  RecipeBookTab,
  StonecutterRecipeButton,
  StonecutterScroller,
  containerErrorSize,
  recipeBookFilterSprites,
  recipeBookSlotSprite,
  BeaconButton,
  BrewArrow,
  CookingArrow,
  EnchantmentSlot,
  FuelBar,
  FuelFlame,
  Panel,
  beaconButtonSprite,
  brewArrowFill,
  cookingArrowFill,
  enchantmentLevelSprite,
  enchantmentSlotSprite,
  fuelBarFill,
  fuelFlameFill,
  AttackIndicator,
  GameModeSlot,
  PlayerActionButton,
  StatusEffectEntry,
  VehicleHearts,
  WarningButton,
  attackIndicatorFill,
  vehicleHeartLayers,
  statusRowHeight,
  AdvancementWidget,
  PackListEntry,
  packOverlaySprites,
  packRegions,
  SpectatorMenu,
  BundleSlot,
  FriendsButton,
  ResponseButton,
  responseButtonSprites,
  BundleProgressBar,
  StatisticsHeaderButton,
  bundleBarFill,
  statisticsHeaderLayers,
  VillagerScroller,
  AnimatedSprite,
  RealmStatusIcon,
  animationFrames,
  memoryAssets,
  MuteButton,
  ReportButton,
  TradeArrow,
  VillagerXpBar,
  muteButtonSprites,
  villagerXpFill,
  CreativeScroller,
  CreativeTab,
  creativeScrollerOffset,
  creativeScrollerValue,
  creativeTabSprite,
  InventorySlot,
  WorldListEntry,
  worldListSprite,
  CrossButton,
  NotificationBadge,
  PageButton,
  notificationSprite,
  AdvancementBox,
  advancementBoxSprite,
  AdvancementTab,
  advancementTabSize,
  advancementTabSprite,
  LocatorBar,
  locatorDotX,
  RecipeBookButton,
  Separator,
  LockButton,
  JumpBar,
  TextArea,
  AdvancementFrame,
  advancementFrameSprite,
  ServerListEntry,
  Dialog,
  DialogClose,
  Armor,
  BossBar,
  Hearts,
  Hunger,
  airBubbles,
  halfPointIcon,
  heartLayers,
  Button,
  ExperienceBar,
  Hotbar,
  LoadingDots,
  PingIcon,
  Toast,
  bossBarLayers,
  loadingDotsText,
  pingSprite,
  pingingSprite,
  scrollHotbar,
  statBarFill,
  toastHeight,
  CobbleProvider,
  Checkbox,
  CycleButton,
  FormattedText,
  IconButton,
  SelectionList,
  SelectionListGroup,
  SelectionListItem,
  Slider,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  ToggleButton,
} from '../index.ts';

describe('CobbleProvider', () => {
  it('throws a helpful error without a provider', async () => {
    const { render } = await import('@testing-library/react');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Button>Oops</Button>)).toThrow(/CobbleProvider/);
    spy.mockRestore();
  });

  it('exposes the GUI scale as a CSS variable', () => {
    const { container } = renderWithProvider(<span />);
    const root = container.querySelector('.cobble-root');
    expect(root).toHaveStyle({ '--cobble-scale': '2' });
    expect(root).toHaveAttribute('data-gui-scale', '2');
  });
});

describe('Button', () => {
  it('renders a native button with its label and handles clicks', async () => {
    const onClick = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(<Button onClick={onClick}>Singleplayer</Button>);
    const button = screen.getByRole('button', { name: 'Singleplayer' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass('cobble-button');
  });

  it('highlights on hover and focus', async () => {
    renderWithProvider(<Button>Options</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('data-highlighted');
    await userEvent.hover(button);
    expect(button).toHaveAttribute('data-highlighted');
    await userEvent.unhover(button);
    expect(button).not.toHaveAttribute('data-highlighted');
    act(() => button.focus());
    expect(button).toHaveAttribute('data-highlighted');
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(
      <Button disabled onClick={onClick}>
        Realms
      </Button>,
    );
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('data-disabled');
  });

  it('supports the "as" prop', () => {
    renderWithProvider(
      <Button as="a" href="/play">
        Play
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Play' });
    expect(link).toHaveAttribute('href', '/play');
    expect(link).toHaveClass('cobble-button');
  });

  it('passes slotProps to inner elements', () => {
    renderWithProvider(<Button slotProps={{ label: { className: 'my-label' } }}>Done</Button>);
    expect(document.querySelector('.my-label')).toHaveTextContent('Done');
  });

  it('sets its size in GUI units through CSS variables', () => {
    renderWithProvider(<Button width={200}>Wide</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      '--cobble-width': '200',
      '--cobble-height': '20',
    });
  });

  it('plays the click sound when pressed', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    renderWithProvider(<Button>Click</Button>, { sound: true });
    // Assets load asynchronously.
    await waitFor(() => expect(document.querySelector('.cobble-root')).toBeInTheDocument());
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.pointerDown(screen.getByRole('button'), { button: 0 });
    expect(play).toHaveBeenCalledTimes(1);
    play.mockRestore();
  });
});

describe('IconButton', () => {
  it('uses the label as its accessible name', () => {
    renderWithProvider(<IconButton icon="icon/language" label="Language" />);
    expect(screen.getByRole('button', { name: 'Language' })).toHaveStyle({
      '--cobble-width': '20',
    });
  });
});

describe('CycleButton', () => {
  it('cycles forwards and backwards with shift', async () => {
    const onValueChange = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(
      <CycleButton
        label="Difficulty"
        values={['Peaceful', 'Easy', 'Normal', 'Hard']}
        defaultValue="Normal"
        onValueChange={onValueChange}
      />,
    );
    const user = userEvent.setup();
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Difficulty: Normal');
    await user.click(button);
    expect(button).toHaveTextContent('Difficulty: Hard');
    await user.click(button);
    expect(button).toHaveTextContent('Difficulty: Peaceful');
    await user.keyboard('{Shift>}');
    await user.click(button);
    await user.keyboard('{/Shift}');
    expect(button).toHaveTextContent('Difficulty: Hard');
    expect(onValueChange).toHaveBeenLastCalledWith('Hard');
  });

  it('toggles ON/OFF', async () => {
    const onCheckedChange = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(<ToggleButton label="Subtitles" onCheckedChange={onCheckedChange} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Subtitles: OFF');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(button).toHaveTextContent('Subtitles: ON');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe('Checkbox', () => {
  it('toggles when clicked', async () => {
    const onCheckedChange = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(<Checkbox onCheckedChange={onCheckedChange}>Show Cheats</Checkbox>);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByText('Show Cheats'));
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('is highlighted only when focused', async () => {
    renderWithProvider(<Checkbox>Fullscreen</Checkbox>);
    const root = document.querySelector('.cobble-checkbox');
    await userEvent.hover(screen.getByText('Fullscreen'));
    expect(root).not.toHaveAttribute('data-focused');
    act(() => screen.getByRole('checkbox').focus());
    expect(root).toHaveAttribute('data-focused');
  });
});

describe('Slider', () => {
  it('exposes slider semantics', () => {
    renderWithProvider(<Slider label="FOV" min={30} max={110} defaultValue={70} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '70');
    expect(slider).toHaveTextContent('FOV: 70');
  });

  it('changes with the arrow keys after focus, and Enter toggles editing', async () => {
    const onValueChange = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(<Slider label="Volume" defaultValue={50} onValueChange={onValueChange} />);
    const slider = screen.getByRole('slider');
    act(() => slider.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '51');
    await userEvent.keyboard('{Enter}');
    expect(slider).not.toHaveAttribute('data-editing');
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '51');
    await userEvent.keyboard('{Enter}{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '49');
    expect(onValueChange).toHaveBeenLastCalledWith(49);
  });

  it('formats the label', () => {
    renderWithProvider(<Slider defaultValue={100} formatLabel={(v) => `Music: ${String(v)}%`} />);
    expect(screen.getByRole('slider')).toHaveTextContent('Music: 100%');
  });
});

describe('TextField', () => {
  it('accepts input up to its max length', async () => {
    const onValueChange = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(
      <TextField aria-label="World name" maxLength={5} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'World name' });
    await userEvent.type(input, 'New World');
    expect(input).toHaveValue('New W');
    expect(onValueChange).toHaveBeenLastCalledWith('New W');
    expect(document.querySelector('.cobble-text-field-display')).toHaveTextContent('New W');
  });

  it('shows the hint only while empty and unfocused', () => {
    renderWithProvider(<TextField aria-label="Search" placeholder="Search..." />);
    expect(document.querySelector('.cobble-text-field-hint')).toHaveTextContent('Search...');
    act(() => screen.getByRole('textbox').focus());
    expect(document.querySelector('.cobble-text-field-hint')).toBeNull();
  });

  it('follows a controlled value', () => {
    const { rerender } = renderWithProvider(<TextField aria-label="Seed" value="123" />);
    expect(screen.getByRole('textbox')).toHaveValue('123');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2}>
        <TextField aria-label="Seed" value="456" />
      </CobbleProvider>,
    );
    expect(screen.getByRole('textbox')).toHaveValue('456');
    expect(document.querySelector('.cobble-text-field-display')).toHaveTextContent('456');
  });
});

describe('Tabs', () => {
  it('switches panels', async () => {
    renderWithProvider(
      <Tabs defaultValue="game">
        <TabList width={400}>
          <Tab value="game">Game</Tab>
          <Tab value="world">World</Tab>
          <Tab value="more">More</Tab>
        </TabList>
        <TabPanel value="game">Game settings</TabPanel>
        <TabPanel value="world">World settings</TabPanel>
        <TabPanel value="more">More settings</TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('Game settings')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'World' }));
    expect(screen.getByRole('tab', { name: 'World' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('World settings')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'World' })).toHaveStyle({ '--cobble-width': '124' });
  });
});

describe('SelectionList', () => {
  it('selects with the mouse and keyboard and activates on Enter', async () => {
    const onItemActivate = vi.fn<(...args: unknown[]) => void>();
    renderWithProvider(
      <SelectionList aria-label="Worlds" defaultValue="a" onItemActivate={onItemActivate}>
        <SelectionListItem value="a">World A</SelectionListItem>
        <SelectionListItem value="b">World B</SelectionListItem>
        <SelectionListItem value="c">
          {({ selected }) => (selected ? 'C!' : 'World C')}
        </SelectionListItem>
      </SelectionList>,
    );
    const list = screen.getByRole('listbox', { name: 'Worlds' });
    expect(screen.getByRole('option', { name: 'World A' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(screen.getByText('World B'));
    expect(screen.getByRole('option', { name: 'World B' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    act(() => list.focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'C!' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    expect(onItemActivate).toHaveBeenCalledWith('c');
    expect(list).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'C!' }).id,
    );
  });
});

describe('FormattedText', () => {
  it('renders § codes as styled spans', () => {
    renderWithProvider(<FormattedText value="§eYellow §lBold" />);
    const bold = screen.getByText('Bold');
    expect(bold).toHaveAttribute('data-bold');
    expect(bold).toHaveStyle({ '--cobble-text-color': '#ffff55' });
  });
});

describe('BossBar and ExperienceBar', () => {
  it('fills (int)(progress * 183) units, capped at 182', () => {
    expect(statBarFill(0)).toBe(0);
    expect(statBarFill(0.5)).toBe(91);
    expect(statBarFill(0.999)).toBe(182);
    expect(statBarFill(1)).toBe(182);
    expect(statBarFill(2)).toBe(182);
    expect(statBarFill(Number.NaN)).toBe(0);
  });

  it('layers the notch overlay over the colored bar', () => {
    expect(bossBarLayers('red', 'progress')).toEqual({
      background: ['boss_bar/red_background'],
      progress: ['boss_bar/red_progress'],
    });
    expect(bossBarLayers('blue', 'notched_10').progress).toEqual([
      'boss_bar/blue_progress',
      'boss_bar/notched_10_progress',
    ]);
  });

  it('renders the name, clip and progressbar semantics', () => {
    const { container } = renderWithProvider(
      <BossBar progress={0.5} color="green" overlay="notched_6">
        Ender Dragon
      </BossBar>,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('Ender Dragon')).toBeInTheDocument();
    expect(container.querySelector('.cobble-stat-bar-clip')).toHaveStyle({
      '--cobble-clip-width': '91',
    });
    expect(container.querySelectorAll('canvas')).toHaveLength(4);
  });

  it('shows the experience level only when positive', () => {
    const { rerender } = renderWithProvider(<ExperienceBar progress={0.25} level={30} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <ExperienceBar progress={0.25} level={0} />
      </CobbleProvider>,
    );
    expect(screen.queryByText('0')).toBeNull();
  });
});

describe('Hotbar', () => {
  it('wraps scrolling like Inventory#swapPaint', () => {
    expect(scrollHotbar(0, 1)).toBe(8);
    expect(scrollHotbar(8, -1)).toBe(0);
    expect(scrollHotbar(4, 120)).toBe(3);
    expect(scrollHotbar(4, 0)).toBe(4);
  });

  it('selects with number keys, arrows and clicks', async () => {
    const onSelectedChange = vi.fn<(selected: number) => void>();
    const user = userEvent.setup();
    renderWithProvider(<Hotbar slots={['a', 'b']} onSelectedChange={onSelectedChange} />);
    const slots = screen.getAllByRole('radio');
    expect(slots).toHaveLength(9);
    expect(slots[0]).toHaveAttribute('aria-checked', 'true');
    slots[0]?.focus();
    await user.keyboard('3');
    expect(onSelectedChange).toHaveBeenLastCalledWith(2);
    await user.keyboard('{ArrowRight}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(3);
    const seventh = screen.getByRole('radio', { name: 'Slot 7' });
    await user.click(seventh);
    expect(onSelectedChange).toHaveBeenLastCalledWith(6);
    expect(seventh).toHaveAttribute('aria-checked', 'true');
  });

  it('only reacts to the wheel when asked to', () => {
    const onSelectedChange = vi.fn<(selected: number) => void>();
    const { rerender } = renderWithProvider(
      <Hotbar defaultSelected={2} onSelectedChange={onSelectedChange} />,
    );
    fireEvent.wheel(screen.getByRole('radiogroup'), { deltaY: 100 });
    expect(onSelectedChange).not.toHaveBeenCalled();
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <Hotbar defaultSelected={2} wheel onSelectedChange={onSelectedChange} />
      </CobbleProvider>,
    );
    fireEvent.wheel(screen.getByRole('radiogroup'), { deltaY: 100 });
    expect(onSelectedChange).toHaveBeenCalledWith(3);
  });
});

describe('Toast', () => {
  it('sizes like SystemToast', () => {
    expect(toastHeight(0)).toBe(32);
    expect(toastHeight(1)).toBe(32);
    expect(toastHeight(3)).toBe(56);
  });

  it('renders the title and message lines', () => {
    renderWithProvider(<Toast title="Saved" messages={['World backed up', 'Done']} />);
    expect(screen.getByRole('status')).toHaveStyle({ '--cobble-height': '44' });
    expect(screen.getByText('Saved')).toHaveStyle({ '--cobble-y': '7' });
    expect(screen.getByText('Done')).toHaveStyle({ '--cobble-y': '30' });
  });
});

describe('PingIcon and LoadingDots', () => {
  it('maps latency to sprites', () => {
    expect(pingSprite(-1)).toBe('server_list/unreachable');
    expect(pingSprite(149)).toBe('server_list/ping_5');
    expect(pingSprite(150)).toBe('server_list/ping_4');
    expect(pingSprite(599)).toBe('server_list/ping_3');
    expect(pingSprite(999)).toBe('server_list/ping_2');
    expect(pingSprite(1000)).toBe('server_list/ping_1');
  });

  it('bounces the pinging animation through five frames', () => {
    const frames = Array.from({ length: 8 }, (_, i) => pingingSprite(i * 100));
    expect(frames).toEqual([1, 2, 3, 4, 5, 4, 3, 2].map((n) => `server_list/pinging_${String(n)}`));
    expect(pingingSprite(0, 1)).toBe('server_list/pinging_3');
  });

  it('draws the chosen sprite', () => {
    const { container } = renderWithProvider(<PingIcon latency="incompatible" />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'server_list/incompatible',
    );
  });

  it('cycles the loading dots every 300 ms', () => {
    renderWithProvider(<LoadingDots />);
    expect(document.querySelector('.cobble-loading-dots')).toHaveTextContent('O o o');
    expect([0, 300, 600, 900, 1200].map(loadingDotsText)).toEqual([
      'O o o',
      'o O o',
      'o o O',
      'o O o',
      'O o o',
    ]);
  });
});

describe('status icons', () => {
  it('picks heart sprites like Gui.HeartType', () => {
    expect(heartLayers(0, 20, 'normal', false)).toEqual(['hud/heart/container', 'hud/heart/full']);
    expect(heartLayers(1, 3, 'poisoned', false)).toEqual([
      'hud/heart/container',
      'hud/heart/poisoned_half',
    ]);
    expect(heartLayers(2, 3, 'normal', true)).toEqual(['hud/heart/container_hardcore']);
    expect(heartLayers(0, 20, 'frozen', true)).toEqual([
      'hud/heart/container_hardcore',
      'hud/heart/frozen_hardcore_full',
    ]);
    expect(heartLayers(0, 20, 'normal', true)[1]).toBe('hud/heart/hardcore_full');
  });

  it('fills half-point meters', () => {
    const icons = [0, 1, 2].map((i) =>
      halfPointIcon(i, 3, 'hud/armor_empty', 'hud/armor_half', 'hud/armor_full'),
    );
    expect(icons).toEqual([
      ['hud/armor_empty', 'hud/armor_full'],
      ['hud/armor_empty', 'hud/armor_half'],
      ['hud/armor_empty'],
    ]);
  });

  it('computes air bubbles and the popping one', () => {
    expect(airBubbles(300)).toEqual({ full: 10, popping: 0 });
    expect(airBubbles(150)).toEqual({ full: 5, popping: 0 });
    expect(airBubbles(20)).toEqual({ full: 1, popping: 0 });
    expect(airBubbles(2)).toEqual({ full: 0, popping: 1 });
    expect(airBubbles(40)).toEqual({ full: 2, popping: 0 });
    expect(airBubbles(0)).toEqual({ full: 0, popping: 0 });
  });

  it('renders meters with semantics and one canvas per layer', () => {
    const { container } = renderWithProvider(
      <>
        <Hearts value={5} absorption={2} />
        <Hunger value={20} />
        <Armor value={0} />
        <Air value={300} />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'Health' })).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByRole('meter', { name: 'Armor' })).toHaveAttribute('aria-valuemax', '20');
    // hearts: 10 containers + 3 fills (2 full, 1 half) + 1 absorbing = 14; food: 20; armor: 10; air: 10
    expect(container.querySelectorAll('canvas')).toHaveLength(14 + 20 + 10 + 10);
  });
});

describe('Dialog', () => {
  it('opens, renders its title and body, and closes through DialogClose', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <Dialog defaultOpen title="Delete world?" onOpenChange={onOpenChange}>
        This cannot be undone.
        <DialogClose>Cancel</DialogClose>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete world?')).toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('ignores backdrop clicks unless asked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Dialog defaultOpen title="Hi" />);
    const backdrop = document.querySelector('.cobble-dialog-backdrop');
    expect(backdrop).not.toBeNull();
    if (backdrop) await user.click(backdrop);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('ServerListEntry', () => {
  it('lays out the name, two MOTD lines and the status', () => {
    renderWithProvider(
      <ServerListEntry
        name="My Server"
        motd={['line one', 'line two', 'ignored']}
        status="3/20"
        latency={42}
      />,
    );
    expect(screen.getByText('My Server')).toHaveStyle({ '--cobble-x': '35', '--cobble-y': '1' });
    expect(screen.getByText('line one')).toHaveStyle({ '--cobble-y': '12' });
    expect(screen.getByText('line two')).toHaveStyle({ '--cobble-y': '21' });
    expect(screen.queryByText('ignored')).toBeNull();
    expect(screen.getByText('3/20')).toBeInTheDocument();
  });

  it('shows the join arrow on hover and joins when clicked', () => {
    const onJoin = vi.fn<() => void>();
    renderWithProvider(<ServerListEntry name="A" latency="pinging" onJoin={onJoin} />);
    expect(screen.queryByRole('button', { name: 'Join server' })).toBeNull();
    fireEvent.pointerEnter(screen.getByText('A').parentElement as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Join server' }));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });
});

describe('AdvancementFrame', () => {
  it('maps type and state to sprites', () => {
    expect(advancementFrameSprite('task', false)).toBe('advancements/task_frame_unobtained');
    expect(advancementFrameSprite('challenge', true)).toBe('advancements/challenge_frame_obtained');
  });

  it('centres the icon in the frame', () => {
    const { container } = renderWithProvider(
      <AdvancementFrame type="goal" obtained>
        <span>icon</span>
      </AdvancementFrame>,
    );
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'advancements/goal_frame_obtained',
    );
    expect(screen.getByText('icon').parentElement).toHaveStyle({
      '--cobble-x': '5',
      '--cobble-y': '5',
    });
  });
});

describe('TextArea', () => {
  it('is a multi-line textbox that reports changes', async () => {
    const onValueChange = vi.fn<(value: string) => void>();
    const user = userEvent.setup();
    renderWithProvider(<TextArea aria-label="Notes" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(box.tagName).toBe('TEXTAREA');
    await user.type(box, 'a{Enter}b');
    expect(onValueChange).toHaveBeenLastCalledWith('a\nb');
    expect(box).toHaveValue('a\nb');
  });

  it('shows a length counter and enforces the limit', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TextArea aria-label="Bio" maxLength={5} defaultValue="ab" />);
    expect(screen.getByText('2/5')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'cdefg');
    expect(screen.getByRole('textbox')).toHaveValue('abcde');
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('highlights while focused', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<TextArea aria-label="x" />);
    await user.click(screen.getByRole('textbox'));
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/text_field_highlighted',
    );
  });
});

describe('JumpBar', () => {
  it('fills with the charge', () => {
    const { container } = renderWithProvider(<JumpBar progress={0.5} />);
    expect(screen.getByRole('progressbar', { name: 'Jump' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(container.querySelector('.cobble-stat-bar-clip')).toHaveStyle({
      '--cobble-clip-width': '91',
    });
  });

  it('covers the bar with the cooldown sprite', () => {
    const { container } = renderWithProvider(<JumpBar progress={0.9} cooldown />);
    expect(container.querySelector('.cobble-stat-bar-clip')).toBeNull();
    expect(
      [...container.querySelectorAll('canvas')].map((canvas) => canvas.dataset['sprite']),
    ).toEqual(['hud/jump_bar_background', 'hud/jump_bar_cooldown']);
  });
});

describe('LockButton', () => {
  it('toggles between locked and unlocked sprites', async () => {
    const onLockedChange = vi.fn<(locked: boolean) => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(<LockButton onLockedChange={onLockedChange} />);
    const button = screen.getByRole('button', { name: 'Lock' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/unlocked_button',
    );
    await user.click(button);
    expect(onLockedChange).toHaveBeenLastCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/locked_button_highlighted',
    );
  });

  it('does not toggle while disabled', async () => {
    const onLockedChange = vi.fn<(locked: boolean) => void>();
    const user = userEvent.setup();
    renderWithProvider(<LockButton disabled onLockedChange={onLockedChange} />);
    await user.click(screen.getByRole('button', { name: 'Lock' }));
    expect(onLockedChange).not.toHaveBeenCalled();
  });
});

describe('Separator', () => {
  it('picks the texture for the kind and world state', () => {
    const { container, rerender } = renderWithProvider(<Separator />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-texture', 'gui/header_separator');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <Separator kind="footer" inWorld />
      </CobbleProvider>,
    );
    expect(container.querySelector('[data-texture]')).toHaveAttribute(
      'data-texture',
      'gui/inworld_footer_separator',
    );
  });
});

describe('RecipeBookButton', () => {
  it('is a 20x18 button with the recipe book sprites', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(<RecipeBookButton onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Recipe Book' });
    expect(button).toHaveStyle({ '--cobble-width': '20', '--cobble-height': '18' });
    expect(container.querySelector('canvas')).toHaveAttribute('data-sprite', 'recipe_book/button');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('LocatorBar', () => {
  it('places dots across the bar and clamps', () => {
    expect(locatorDotX(0)).toBe(87);
    expect(locatorDotX(-1)).toBe(0);
    expect(locatorDotX(1)).toBe(173);
    expect(locatorDotX(5)).toBe(173);
  });

  it('draws the background and one sprite per waypoint', () => {
    const { container } = renderWithProvider(
      <LocatorBar waypoints={[{ position: 0 }, { position: -0.5, dot: 'bowtie' }]} />,
    );
    expect(
      [...container.querySelectorAll('canvas')].map((canvas) => canvas.dataset['sprite']),
    ).toEqual([
      'hud/locator_bar_background',
      'hud/locator_bar_dot/default_0',
      'hud/locator_bar_dot/bowtie',
    ]);
  });
});

describe('AdvancementTab', () => {
  it('names sprites after the edge, position and selection', () => {
    expect(advancementTabSprite('above', 'first', false)).toBe('advancements/tab_above_left');
    expect(advancementTabSprite('below', 'last', true)).toBe(
      'advancements/tab_below_right_selected',
    );
    expect(advancementTabSprite('left', 'first', false)).toBe('advancements/tab_left_top');
    expect(advancementTabSprite('right', 'last', true)).toBe(
      'advancements/tab_right_bottom_selected',
    );
    expect(advancementTabSprite('left', 'middle', false)).toBe('advancements/tab_left_middle');
  });

  it('sizes tabs by edge', () => {
    expect(advancementTabSize('above')).toEqual({ width: 28, height: 32 });
    expect(advancementTabSize('right')).toEqual({ width: 32, height: 28 });
  });

  it('is a selectable tab with a centred icon', () => {
    renderWithProvider(
      <AdvancementTab label="Adventure" selected side="left">
        <span>i</span>
      </AdvancementTab>,
    );
    const tab = screen.getByRole('button', { name: 'Adventure' });
    expect(tab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('i').parentElement).toHaveStyle({
      '--cobble-x': '8',
      '--cobble-y': '6',
    });
  });
});

describe('AdvancementBox', () => {
  it('maps kind to sprite', () => {
    expect(advancementBoxSprite('title')).toBe('advancements/title_box');
    expect(advancementBoxSprite('obtained')).toBe('advancements/box_obtained');
    expect(advancementBoxSprite('unobtained')).toBe('advancements/box_unobtained');
  });

  it('stretches to the requested width', () => {
    const { container } = renderWithProvider(<AdvancementBox width={150}>Hello</AdvancementBox>);
    expect(screen.getByText('Hello')).toHaveStyle({ '--cobble-width': '150' });
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'advancements/title_box',
    );
  });
});

describe('CrossButton, PageButton and NotificationBadge', () => {
  it('draws the cross button at 14x14', () => {
    const { container } = renderWithProvider(<CrossButton />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveStyle({
      '--cobble-width': '14',
      '--cobble-height': '14',
    });
    expect(container.querySelector('canvas')).toHaveAttribute('data-sprite', 'widget/cross_button');
  });

  it('turns pages with the matching sprite and name', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(<PageButton direction="backward" onClick={onClick} />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/page_backward',
    );
    await user.click(screen.getByRole('button', { name: 'Previous Page' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('maps counts to badge sprites', () => {
    expect(notificationSprite(0)).toBeUndefined();
    expect(notificationSprite(-2)).toBeUndefined();
    expect(notificationSprite(3)).toBe('notification/3');
    expect(notificationSprite(5)).toBe('notification/5');
    expect(notificationSprite(6)).toBe('notification/more');
    const { container, rerender } = renderWithProvider(<NotificationBadge count={0} />);
    expect(container.querySelector('canvas')).toBeNull();
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <NotificationBadge count={7} />
      </CobbleProvider>,
    );
    expect(screen.getByRole('img', { name: '7 notifications' })).toHaveAttribute(
      'data-sprite',
      'notification/more',
    );
  });
});

describe('WorldListEntry', () => {
  it('maps status and hover to overlay sprites', () => {
    expect(worldListSprite('normal', false)).toBe('world_list/join');
    expect(worldListSprite('normal', true)).toBe('world_list/join_highlighted');
    expect(worldListSprite('marked', false)).toBe('world_list/marked_join');
    expect(worldListSprite('warning', true)).toBe('world_list/warning_highlighted');
    expect(worldListSprite('error', false)).toBe('world_list/error');
  });

  it('lays out the name and two detail lines, and plays on click', () => {
    const onJoin = vi.fn<() => void>();
    renderWithProvider(
      <WorldListEntry
        name="New World"
        details={['New World (10/22/26)', 'Survival Mode, Cheats, Version: 26.3', 'ignored']}
        onJoin={onJoin}
      />,
    );
    expect(screen.getByText('New World')).toHaveStyle({ '--cobble-x': '35', '--cobble-y': '1' });
    expect(screen.getByText('New World (10/22/26)')).toHaveStyle({ '--cobble-y': '12' });
    expect(screen.getByText(/Survival/)).toHaveStyle({ '--cobble-y': '21' });
    expect(screen.queryByText('ignored')).toBeNull();
    fireEvent.pointerEnter(screen.getByText('New World').parentElement as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Play world' }));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('offers to open worlds with a warning', () => {
    renderWithProvider(<WorldListEntry name="Old" status="warning" />);
    fireEvent.pointerEnter(screen.getByText('Old').parentElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'Open world' })).toBeInTheDocument();
  });
});

const slotSprites = (container: HTMLElement): (string | undefined)[] =>
  [...container.querySelectorAll('canvas')].map((canvas) => canvas.dataset['sprite']);

describe('InventorySlot', () => {
  const sprites = slotSprites;
  it('shows the empty icon only while empty', () => {
    const { container, rerender } = renderWithProvider(<InventorySlot emptyIcon="helmet" />);
    expect(sprites(container)).toEqual(['container/slot', 'container/slot/helmet']);
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <InventorySlot emptyIcon="helmet">
          <span>item</span>
        </InventorySlot>
      </CobbleProvider>,
    );
    expect(sprites(container)).toEqual(['container/slot']);
    expect(screen.getByText('item').parentElement).toHaveStyle({
      '--cobble-x': '1',
      '--cobble-y': '1',
    });
  });

  it('draws the highlight behind and in front of the item while focused', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <InventorySlot>
        <span>item</span>
      </InventorySlot>,
    );
    await user.tab();
    expect(sprites(container)).toEqual([
      'container/slot',
      'container/slot_highlight_back',
      'container/slot_highlight_front',
    ]);
  });
});

describe('CreativeTab and CreativeScroller', () => {
  it('names tab sprites by row, state and column', () => {
    expect(creativeTabSprite('top', 1, false)).toBe(
      'container/creative_inventory/tab_top_unselected_1',
    );
    expect(creativeTabSprite('bottom', 7, true)).toBe(
      'container/creative_inventory/tab_bottom_selected_7',
    );
  });

  it('renders a selectable tab', () => {
    const { container } = renderWithProvider(
      <CreativeTab label="Building Blocks" row="bottom" column={3} selected />,
    );
    expect(screen.getByRole('button', { name: 'Building Blocks' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/creative_inventory/tab_bottom_selected_3',
    );
  });

  it('maps values to thumb offsets and back', () => {
    expect(creativeScrollerOffset(0, 112)).toBe(0);
    expect(creativeScrollerOffset(1, 112)).toBe(97);
    expect(creativeScrollerOffset(0.5, 112)).toBe(48);
    expect(creativeScrollerValue(7.5, 112)).toBe(0);
    expect(creativeScrollerValue(104.5, 112)).toBe(1);
    expect(creativeScrollerValue(500, 112)).toBe(1);
    expect(creativeScrollerValue(-5, 112)).toBe(0);
  });

  it('moves with the keyboard and greys out when disabled', async () => {
    const onValueChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();
    const { container, rerender } = renderWithProvider(
      <CreativeScroller onValueChange={onValueChange} step={0.25} />,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith(0.25);
    await user.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('scrollbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <CreativeScroller disabled onValueChange={onValueChange} />
      </CobbleProvider>,
    );
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/creative_inventory/scroller_disabled',
    );
  });
});

describe('MuteButton, ReportButton and trade widgets', () => {
  it('shows the action the mute button will perform', async () => {
    const onMutedChange = vi.fn<(muted: boolean) => void>();
    const user = userEvent.setup();
    expect(muteButtonSprites(false).enabled).toBe('social_interactions/mute_button');
    expect(muteButtonSprites(true).enabled).toBe('social_interactions/unmute_button');
    expect(muteButtonSprites(true).enabledFocused).toBe(
      'social_interactions/unmute_button_highlighted',
    );
    renderWithProvider(<MuteButton onMutedChange={onMutedChange} />);
    await user.click(screen.getByRole('button', { name: 'Mute' }));
    expect(onMutedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables the report button', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(<ReportButton disabled onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Report' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'social_interactions/report_button_disabled',
    );
  });

  it('fills the villager bar by floor(progress * 102)', () => {
    expect(villagerXpFill(0)).toBe(0);
    expect(villagerXpFill(0.5)).toBe(51);
    expect(villagerXpFill(1)).toBe(102);
    expect(villagerXpFill(2)).toBe(102);
    const { container } = renderWithProvider(<VillagerXpBar progress={0.25} gain={0.25} />);
    const widths = [...container.querySelectorAll<HTMLElement>('.cobble-stat-bar-clip')].map(
      (clip) => clip.style.getPropertyValue('--cobble-clip-width'),
    );
    expect(widths).toEqual(['51', '25']);
  });

  it('crosses out the trade arrow when out of stock', () => {
    const { container } = renderWithProvider(<TradeArrow outOfStock />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/villager/trade_arrow_out_of_stock',
    );
  });
});

describe('AnimatedSprite and RealmStatusIcon', () => {
  it('plays every frame of the sheet unless frames are given', () => {
    expect(animationFrames(3, 6)).toEqual([
      { index: 0, time: 6 },
      { index: 1, time: 6 },
      { index: 2, time: 6 },
    ]);
    expect(animationFrames(0)).toEqual([{ index: 0, time: 1 }]);
    const explicit = [
      { index: 0, time: 10 },
      { index: 1, time: 4 },
    ];
    expect(animationFrames(2, 1, explicit)).toBe(explicit);
  });

  it('steps through the frames of a loaded sheet', async () => {
    const assets = memoryAssets({
      files: {
        'assets/minecraft/textures/gui/sprites/test/sheet.png': png(4, 12, () => [
          255, 255, 255, 255,
        ]),
      },
    });
    const { container } = renderPlain(
      <CobbleProvider assets={assets} guiScale={2} sound={{ enabled: false }}>
        <AnimatedSprite
          sprite={asSpriteId('test/sheet')}
          frameWidth={4}
          frameHeight={4}
          frametime={1}
        />
      </CobbleProvider>,
    );
    const root = container.querySelector('.cobble-animated-sprite');
    expect(root).toHaveStyle({ '--cobble-width': '4', '--cobble-height': '4' });
    await waitFor(() => expect(root).toHaveAttribute('data-frame', '2'), { timeout: 1500 });
    await waitFor(() => expect(root).toHaveAttribute('data-frame', '0'), { timeout: 1500 });
  });

  it('draws a realm status light from its own sheet', async () => {
    const { container } = renderAnimated(<RealmStatusIcon status="expires_soon" />);
    await waitFor(() =>
      expect(container.querySelector('.cobble-animated-sprite')).toHaveStyle({
        '--cobble-width': '10',
      }),
    );
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'realm_status/expires_soon',
    );
    expect(container.querySelector('.cobble-animated-sprite')).toHaveStyle({
      '--cobble-width': '10',
      '--cobble-height': '28',
    });
  });
});

describe('VillagerScroller', () => {
  it('uses the trading screen thumb and its size for offsets', () => {
    expect(creativeScrollerOffset(1, 139, 27)).toBe(112);
    expect(creativeScrollerValue(13.5, 139, 27)).toBe(0);
    expect(creativeScrollerValue(125.5, 139, 27)).toBe(1);
    const { container } = renderWithProvider(<VillagerScroller defaultValue={1} />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/villager/scroller',
    );
    expect(screen.getByRole('scrollbar', { name: 'Trades' })).toHaveStyle({
      '--cobble-width': '6',
      '--cobble-height': '139',
    });
    expect(container.querySelector('canvas')).toHaveStyle({ '--cobble-y': '112' });
  });

  it('shows the disabled thumb when everything fits', () => {
    const { container } = renderWithProvider(<VillagerScroller disabled />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/villager/scroller_disabled',
    );
  });
});

describe('BundleProgressBar and StatisticsHeaderButton', () => {
  it('fills inside the border and switches to the full sprite', () => {
    expect(bundleBarFill(0)).toBe(0);
    expect(bundleBarFill(0.5)).toBe(46);
    expect(bundleBarFill(1)).toBe(92);
    expect(bundleBarFill(3)).toBe(92);
    const { container, rerender } = renderWithProvider(<BundleProgressBar progress={0.5} />);
    expect(slotSprites(container)).toEqual([
      'container/bundle/bundle_progressbar_border',
      'container/bundle/bundle_progressbar_fill',
    ]);
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <BundleProgressBar progress={1} />
      </CobbleProvider>,
    );
    expect(slotSprites(container)[1]).toBe('container/bundle/bundle_progressbar_full');
    expect(screen.getByRole('progressbar', { name: 'Bundle fullness' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('stacks the header frame, column icon and sort arrow', async () => {
    expect(statisticsHeaderLayers('item_used', undefined)).toEqual([
      'statistics/header',
      'statistics/item_used',
    ]);
    expect(statisticsHeaderLayers('block_mined', 'descending')).toEqual([
      'statistics/header',
      'statistics/block_mined',
      'statistics/sort_down',
    ]);
    expect(statisticsHeaderLayers('item_broken', 'ascending')[2]).toBe('statistics/sort_up');
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <StatisticsHeaderButton column="item_crafted" label="Items Crafted" onClick={onClick} />,
    );
    await user.click(screen.getByRole('button', { name: 'Items Crafted' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ResponseButton and FriendsButton', () => {
  it('picks artwork by kind and context', () => {
    expect(responseButtonSprites('accept', 'friends')).toEqual({
      enabled: 'friends/accept',
      enabledFocused: 'friends/accept_highlighted',
    });
    expect(responseButtonSprites('reject', 'invite').enabled).toBe('pending_invite/reject');
  });

  it('is an 18x18 named button', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <ResponseButton kind="reject" context="invite" onClick={onClick} />,
    );
    const button = screen.getByRole('button', { name: 'Reject' });
    expect(button).toHaveStyle({ '--cobble-width': '18', '--cobble-height': '18' });
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'pending_invite/reject',
    );
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('draws the friends screen button sprites', () => {
    const { container } = renderWithProvider(<FriendsButton width={100}>Add Friend</FriendsButton>);
    expect(screen.getByRole('button', { name: 'Add Friend' })).toBeInTheDocument();
    expect(container.querySelector('canvas')).toHaveAttribute('data-sprite', 'friends/button');
  });
});

describe('BundleSlot', () => {
  it('draws the 24x24 background with the item inset by 4', () => {
    const { container } = renderWithProvider(
      <BundleSlot>
        <span>item</span>
      </BundleSlot>,
    );
    expect(slotSprites(container)).toEqual(['container/bundle/slot_background']);
    expect(screen.getByText('item').parentElement).toHaveStyle({
      '--cobble-x': '4',
      '--cobble-y': '4',
    });
  });

  it('draws highlight frames behind and in front when highlighted', () => {
    const { container } = renderWithProvider(<BundleSlot highlighted>x</BundleSlot>);
    expect(slotSprites(container)).toEqual([
      'container/bundle/slot_background',
      'container/bundle/slot_highlight_back',
      'container/bundle/slot_highlight_front',
    ]);
  });

  it('highlights on focus', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<BundleSlot tabIndex={0}>x</BundleSlot>);
    await user.tab();
    expect(slotSprites(container)).toHaveLength(3);
  });
});

describe('SpectatorMenu', () => {
  it('puts the given icons in their slots on the hotbar frame', () => {
    const { container } = renderWithProvider(
      <SpectatorMenu icons={['scroll_left', undefined, 'teleport_to_player', 'close']} />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Spectator menu' })).toBeInTheDocument();
    expect(slotSprites(container)).toEqual([
      'hud/hotbar',
      'hud/hotbar_selection',
      'spectator/scroll_left',
      'spectator/teleport_to_player',
      'spectator/close',
    ]);
    const slots = screen.getAllByRole('radio');
    expect(slots).toHaveLength(9);
    expect(slots[0]?.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'spectator/scroll_left',
    );
    expect(slots[1]?.querySelector('canvas')).toBeNull();
  });
});

/** Sprite sheets with the `animation` metadata the 26.3 jar ships for them. */
function animatedAssets(): AssetSource {
  const files: Record<string, Uint8Array> = {};
  const add = (id: string, width: number, height: number, animation: object): void => {
    const path = `assets/minecraft/textures/gui/sprites/${id}.png`;
    files[path] = png(width, height, () => [255, 255, 255, 255]);
    files[`${path}.mcmeta`] = new TextEncoder().encode(JSON.stringify({ animation }));
  };
  add('icon/music_notes', 16, 128, { width: 16, height: 16, frametime: 2 });
  add('icon/trial_available', 8, 48, {
    width: 8,
    height: 8,
    frames: [{ index: 0, time: 10 }, 1, 2, 3, 4, 5],
  });
  add('realm_status/expires_soon', 10, 56, { width: 10, height: 28, frametime: 10 });
  add('hud/locator_bar_arrow_up', 7, 10, {
    width: 7,
    height: 5,
    frames: [
      { index: 0, time: 10 },
      { index: 1, time: 4 },
    ],
  });
  add('hud/locator_bar_arrow_down', 7, 10, { width: 7, height: 5 });
  return memoryAssets({ files });
}

function renderAnimated(ui: ReactElement): ReturnType<typeof renderPlain> {
  return renderPlain(
    <CobbleProvider assets={animatedAssets()} guiScale={2} sound={{ enabled: false }}>
      {ui}
    </CobbleProvider>,
  );
}

describe('LocatorBar arrows', () => {
  it('draws a 7x5 animated arrow above or below its dot', async () => {
    const { container } = renderAnimated(
      <LocatorBar
        waypoints={[
          { position: 0, arrow: 'up' },
          { position: 0.5, arrow: 'down' },
        ]}
      />,
    );
    const arrows = [...container.querySelectorAll<HTMLElement>('.cobble-locator-arrow')];
    expect(arrows).toHaveLength(2);
    await waitFor(() => expect(arrows[0]).toHaveStyle({ '--cobble-width': '7' }));
    expect(arrows[0]).toHaveStyle({
      '--cobble-width': '7',
      '--cobble-height': '5',
      '--cobble-x': '88',
      '--cobble-y': '-7',
    });
    expect(arrows[1]).toHaveStyle({ '--cobble-y': '7' });
    expect(slotSprites(container)).toContain('hud/locator_bar_arrow_up');
    expect(slotSprites(container)).toContain('hud/locator_bar_arrow_down');
  });
});

describe('PackListEntry', () => {
  it('splits the icon into select and move hit areas', () => {
    expect(packRegions({ canSelect: true, canMoveUp: true, canMoveDown: true })).toEqual([
      { action: 'select', x: 0, y: 0, width: 16, height: 32 },
      { action: 'move_up', x: 16, y: 0, width: 16, height: 16 },
      { action: 'move_down', x: 16, y: 16, width: 16, height: 16 },
    ]);
    expect(packRegions({ canUnselect: true, canSelect: true })[0]?.action).toBe('unselect');
    expect(packRegions({})).toEqual([]);
  });

  it('layers the overlay sprites and highlights the one under the pointer', () => {
    const actions = { canUnselect: true, canMoveUp: true };
    expect(packOverlaySprites(actions, undefined)).toEqual([
      'transferable_list/unselect',
      'transferable_list/move_up',
    ]);
    expect(packOverlaySprites(actions, 'move_up')).toEqual([
      'transferable_list/unselect',
      'transferable_list/move_up_highlighted',
    ]);
  });

  it('shows labelled action buttons on hover and reports clicks', () => {
    const onAction = vi.fn<(action: string) => void>();
    renderWithProvider(
      <PackListEntry
        name="Programmer Art"
        description={['The classic look', 'ignored', 'also ignored']}
        canSelect
        canMoveDown
        onAction={onAction}
      />,
    );
    expect(screen.getByText('Programmer Art')).toHaveStyle({
      '--cobble-x': '35',
      '--cobble-y': '1',
    });
    expect(screen.queryByRole('button', { name: 'Enable pack' })).toBeNull();
    fireEvent.pointerEnter(screen.getByText('Programmer Art').parentElement as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Enable pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move down' }));
    expect(onAction).toHaveBeenNthCalledWith(1, 'select');
    expect(onAction).toHaveBeenNthCalledWith(2, 'move_down');
    expect(screen.queryByRole('button', { name: 'Move up' })).toBeNull();
  });

  it('shows no overlay when no action is available', () => {
    renderWithProvider(<PackListEntry name="Locked" />);
    fireEvent.pointerEnter(screen.getByText('Locked').parentElement as HTMLElement);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('AdvancementWidget', () => {
  it('shows only the frame until expanded', () => {
    const { container } = renderWithProvider(
      <AdvancementWidget title="Stone Age" type="task">
        <span>pick</span>
      </AdvancementWidget>,
    );
    expect(slotSprites(container)).toEqual(['advancements/task_frame_unobtained']);
    expect(screen.queryByText('Stone Age')).toBeNull();
    expect(screen.getByLabelText('Stone Age')).toBeInTheDocument();
  });

  it('expands to the box with the title and description', () => {
    const { container } = renderWithProvider(
      <AdvancementWidget
        title="Diamonds!"
        description={['Acquire diamonds']}
        type="goal"
        obtained
        expanded
      />,
    );
    expect(slotSprites(container)).toEqual([
      'advancements/box_obtained',
      'advancements/goal_frame_obtained',
    ]);
    expect(screen.getByText('Diamonds!')).toBeInTheDocument();
    expect(screen.getByText('Acquire diamonds')).toBeInTheDocument();
    expect(container.querySelector('.cobble-advancement-widget-content')).toHaveAttribute(
      'data-lines',
      '1',
    );
  });

  it('uses the unobtained box while locked', () => {
    const { container } = renderWithProvider(<AdvancementWidget title="Locked" expanded />);
    expect(slotSprites(container)[0]).toBe('advancements/box_unobtained');
  });
});

describe('status icon rows', () => {
  it('spaces wrapped rows like Gui#extractHearts', () => {
    expect(statusRowHeight(2)).toBe(10);
    expect(statusRowHeight(3)).toBe(9);
    expect(statusRowHeight(4)).toBe(8);
    expect(statusRowHeight(20)).toBe(3);
  });

  it('stacks extra hearts upwards, first row at the bottom, overlapping from three rows', () => {
    const { container } = renderWithProvider(<Hearts value={20} max={60} />);
    const row = screen.getByRole('meter', { name: 'Health' });
    // 30 hearts = 3 rows 9 apart; the box is 2 * 9 + 9 tall.
    expect(row).toHaveStyle({ '--cobble-height': '27', '--cobble-width': '81' });
    const ys = new Set(
      [...container.querySelectorAll<HTMLElement>('canvas')].map((c) =>
        c.style.getPropertyValue('--cobble-y'),
      ),
    );
    expect([...ys].toSorted()).toEqual(['0', '18', '9']);
  });
});

describe('SelectionListGroup', () => {
  it('labels a run of rows without making the heading selectable', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <SelectionList aria-label="Pages" defaultValue="a">
        <SelectionListGroup label="Buttons">
          <SelectionListItem value="a">A</SelectionListItem>
          <SelectionListItem value="b">B</SelectionListItem>
        </SelectionListGroup>
      </SelectionList>,
    );
    const group = screen.getByRole('group', { name: 'Buttons' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await user.click(screen.getByText('Buttons'));
    expect(screen.getByRole('option', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    screen.getByRole('listbox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('InventorySlot count', () => {
  it('draws the stack size only above one and only with an item', () => {
    const { container, rerender } = renderWithProvider(
      <InventorySlot count={64}>
        <span>item</span>
      </InventorySlot>,
    );
    expect(container.querySelector('.cobble-inventory-slot-count')).toHaveTextContent('64');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <InventorySlot count={1}>
          <span>item</span>
        </InventorySlot>
      </CobbleProvider>,
    );
    expect(container.querySelector('.cobble-inventory-slot-count')).toBeNull();
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <InventorySlot count={5} />
      </CobbleProvider>,
    );
    expect(container.querySelector('.cobble-inventory-slot-count')).toBeNull();
  });
});

describe('Hotbar offhand and selection', () => {
  it('draws the 24x23 selection frame and an offhand slot outside the bar', () => {
    const { container } = renderWithProvider(
      <Hotbar offhand={{ side: 'left', content: <span>shield</span> }} />,
    );
    const canvases = [...container.querySelectorAll<HTMLElement>('canvas')];
    const selection = canvases.find((c) => c.dataset['sprite'] === 'hud/hotbar_selection');
    expect(selection).toHaveStyle({
      '--cobble-sprite-width': '24',
      '--cobble-sprite-height': '23',
    });
    const offhand = canvases.find((c) => c.dataset['sprite'] === 'hud/hotbar_offhand_left');
    expect(offhand).toHaveStyle({ '--cobble-x': '-29', '--cobble-y': '-1' });
    expect(screen.getByText('shield')).toHaveStyle({ '--cobble-x': '-26', '--cobble-y': '3' });
  });

  it('puts a right-hand offhand slot past the bar', () => {
    const { container } = renderWithProvider(<Hotbar offhand={{ side: 'right' }} />);
    const offhand = [...container.querySelectorAll<HTMLElement>('canvas')].find(
      (c) => c.dataset['sprite'] === 'hud/hotbar_offhand_right',
    );
    expect(offhand).toHaveStyle({ '--cobble-x': '182' });
  });
});

describe('VehicleHearts', () => {
  it('names the mount heart sprites', () => {
    expect(vehicleHeartLayers(0, 20)).toEqual([
      'hud/heart/vehicle_container',
      'hud/heart/vehicle_full',
    ]);
    expect(vehicleHeartLayers(1, 3)).toEqual([
      'hud/heart/vehicle_container',
      'hud/heart/vehicle_half',
    ]);
    expect(vehicleHeartLayers(2, 3)).toEqual(['hud/heart/vehicle_container']);
  });

  it('is a meter filled from the right', () => {
    renderWithProvider(<VehicleHearts value={4} max={10} />);
    const meter = screen.getByRole('meter', { name: 'Mount health' });
    expect(meter).toHaveAttribute('aria-valuenow', '4');
    expect(meter).toHaveAttribute('aria-valuemax', '10');
    const xs = [...meter.querySelectorAll<HTMLElement>('canvas')]
      .filter((c) => c.dataset['sprite'] === 'hud/heart/vehicle_full')
      .map((c) => c.style.getPropertyValue('--cobble-x'));
    expect(xs.toSorted()).toEqual(['24', '32']);
  });
});

describe('StatusEffectEntry', () => {
  it('shows the name and duration beside the icon', () => {
    const { container } = renderWithProvider(
      <StatusEffectEntry name="Speed II" duration="0:42" ambient>
        <span>icon</span>
      </StatusEffectEntry>,
    );
    expect(slotSprites(container)).toEqual(['container/inventory/effect_background_ambient']);
    expect(screen.getByText('Speed II')).toBeInTheDocument();
    expect(screen.getByText('0:42')).toBeInTheDocument();
    expect(container.querySelector('.cobble-effect-entry')).toHaveStyle({
      '--cobble-width': '120',
      '--cobble-height': '32',
    });
  });

  it('shows only the icon when compact', () => {
    const { container } = renderWithProvider(
      <StatusEffectEntry compact name="Speed II" duration="0:42">
        <span>icon</span>
      </StatusEffectEntry>,
    );
    expect(screen.queryByText('Speed II')).toBeNull();
    expect(container.querySelector('.cobble-effect-entry')).toHaveStyle({
      '--cobble-width': '32',
    });
    expect(slotSprites(container)).toEqual(['container/inventory/effect_background']);
  });
});

describe('AttackIndicator', () => {
  it('fills from the bottom by (int)(strength * 19)', () => {
    expect(attackIndicatorFill(0)).toBe(0);
    expect(attackIndicatorFill(0.5)).toBe(9);
    expect(attackIndicatorFill(1)).toBe(18);
    expect(attackIndicatorFill(7)).toBe(18);
    const { container } = renderWithProvider(<AttackIndicator strength={0.5} />);
    expect(slotSprites(container)).toEqual([
      'hud/hotbar_attack_indicator_background',
      'hud/hotbar_attack_indicator_progress',
    ]);
    expect(container.querySelector('.cobble-attack-indicator')).toHaveStyle({
      '--cobble-clip-height': '9',
    });
    expect(screen.getByRole('progressbar', { name: 'Attack strength' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });

  it('draws only the background while charging has not started', () => {
    const { container } = renderWithProvider(<AttackIndicator strength={0} />);
    expect(slotSprites(container)).toEqual(['hud/hotbar_attack_indicator_background']);
  });
});

describe('GameModeSlot, PlayerActionButton and WarningButton', () => {
  it('draws the selection frame over a selected slot', () => {
    const { container } = renderWithProvider(
      <GameModeSlot label="Creative Mode" selected>
        <span>icon</span>
      </GameModeSlot>,
    );
    expect(screen.getByRole('radio', { name: 'Creative Mode' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(slotSprites(container)).toEqual([
      'gamemode_switcher/slot',
      'gamemode_switcher/selection',
    ]);
    expect(screen.getByText('icon').parentElement).toHaveStyle({
      '--cobble-x': '5',
      '--cobble-y': '5',
    });
  });

  it('is an 8x7 button for each player action', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <PlayerActionButton action="make_operator" onClick={onClick} />,
    );
    const button = screen.getByRole('button', { name: 'Make operator' });
    expect(button).toHaveStyle({ '--cobble-width': '8', '--cobble-height': '7' });
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'player_list/make_operator',
    );
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('draws the dialog warning button and greys it when disabled', () => {
    const { container } = renderWithProvider(<WarningButton disabled />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'dialog/warning_button_disabled',
    );
  });
});

describe('Panel and Toast variants', () => {
  it('stretches its nine-slice background to fixed or measured size', () => {
    const { container } = renderWithProvider(
      <Panel background="friends/background" width={236} height={34}>
        <span>entry</span>
      </Panel>,
    );
    expect(screen.getByText('entry')).toBeInTheDocument();
    const sprite = container.querySelector<HTMLElement>('canvas');
    expect(sprite).toHaveAttribute('data-sprite', 'friends/background');
    expect(sprite).toHaveStyle({ '--cobble-sprite-width': '236', '--cobble-sprite-height': '34' });
  });

  it('defaults to the popup background', () => {
    const { container } = renderWithProvider(<Panel width={50} height={20} />);
    expect(container.querySelector('canvas')).toHaveAttribute('data-sprite', 'popup/background');
  });

  it('draws the chosen toast background', () => {
    const { container } = renderWithProvider(<Toast title="Hi" variant="friends" />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'friends/toast_background',
    );
  });
});

describe('furnace, brewing and fuel progress', () => {
  it('fills the cooking arrow by ceil(progress * 24) and the flame by ceil(lit * 13) + 1', () => {
    expect(cookingArrowFill(0)).toBe(0);
    expect(cookingArrowFill(0.01)).toBe(1);
    expect(cookingArrowFill(0.5)).toBe(12);
    expect(cookingArrowFill(1)).toBe(24);
    expect(fuelFlameFill(0)).toBe(0);
    expect(fuelFlameFill(0.01)).toBe(2);
    expect(fuelFlameFill(1)).toBe(14);
  });

  it('draws the arrow and flame of the chosen station only when there is progress', () => {
    const { container } = renderWithProvider(
      <>
        <CookingArrow progress={0.5} station="smoker" />
        <FuelFlame lit={0.5} station="blast_furnace" />
        <CookingArrow progress={0} />
      </>,
    );
    expect(slotSprites(container)).toEqual([
      'container/smoker/burn_progress',
      'container/blast_furnace/lit_progress',
    ]);
    expect(screen.getAllByRole('progressbar', { name: 'Cooking progress' })[0]).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(container.querySelector('.cobble-cooking-arrow')).toHaveStyle({
      '--cobble-clip-width': '12',
    });
  });

  it('sizes the brewing arrow and fuel bar', () => {
    expect(brewArrowFill(0)).toBe(0);
    expect(brewArrowFill(0.5)).toBe(14);
    expect(brewArrowFill(1)).toBe(28);
    expect(fuelBarFill(0)).toBe(0);
    expect(fuelBarFill(1)).toBe(1);
    expect(fuelBarFill(10)).toBe(9);
    expect(fuelBarFill(20)).toBe(18);
    expect(fuelBarFill(99)).toBe(18);
    const { container } = renderWithProvider(
      <>
        <BrewArrow progress={0.5} />
        <FuelBar fuel={20} />
      </>,
    );
    expect(slotSprites(container)).toEqual([
      'container/brewing_stand/brew_progress',
      'container/brewing_stand/fuel_length',
    ]);
    expect(screen.getByRole('meter', { name: 'Blaze powder' })).toHaveAttribute(
      'aria-valuenow',
      '20',
    );
  });
});

describe('BeaconButton and EnchantmentSlot', () => {
  it('picks the beacon background for each state, disabled first', () => {
    const base = { disabled: false, selected: false, highlighted: false };
    expect(beaconButtonSprite(base)).toBe('container/beacon/button');
    expect(beaconButtonSprite({ ...base, highlighted: true })).toBe(
      'container/beacon/button_highlighted',
    );
    expect(beaconButtonSprite({ ...base, selected: true, highlighted: true })).toBe(
      'container/beacon/button_selected',
    );
    expect(beaconButtonSprite({ ...base, disabled: true, selected: true })).toBe(
      'container/beacon/button_disabled',
    );
  });

  it('is a 22x22 toggle for effects and has built-in confirm and cancel icons', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <>
        <BeaconButton label="Speed" selected onClick={onClick}>
          <span>fast</span>
        </BeaconButton>
        <BeaconButton label="Confirm" kind="confirm" />
        <BeaconButton label="Cancel" kind="cancel" disabled />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Speed' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toHaveAttribute('aria-pressed');
    expect(slotSprites(container)).toEqual([
      'container/beacon/button_selected',
      'container/beacon/button',
      'container/beacon/confirm',
      'container/beacon/button_disabled',
      'container/beacon/cancel',
    ]);
    expect(screen.getByText('fast').parentElement).toHaveStyle({
      '--cobble-x': '2',
      '--cobble-y': '2',
    });
    await user.click(screen.getByRole('button', { name: 'Speed' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('names the enchanting row and level sprites', () => {
    expect(enchantmentSlotSprite(false, false)).toBe('container/enchanting_table/enchantment_slot');
    expect(enchantmentSlotSprite(false, true)).toBe(
      'container/enchanting_table/enchantment_slot_highlighted',
    );
    expect(enchantmentSlotSprite(true, true)).toBe(
      'container/enchanting_table/enchantment_slot_disabled',
    );
    expect(enchantmentLevelSprite(2, false)).toBe('container/enchanting_table/level_2');
    expect(enchantmentLevelSprite(3, true)).toBe('container/enchanting_table/level_3_disabled');
  });

  it('draws the row with its level icon, clue and cost', () => {
    const { container } = renderWithProvider(
      <EnchantmentSlot option={1} label="Enchantment option 1, 1 level" cost={1}>
        clue
      </EnchantmentSlot>,
    );
    expect(slotSprites(container)).toEqual([
      'container/enchanting_table/enchantment_slot',
      'container/enchanting_table/level_1',
    ]);
    expect(screen.getByText('clue')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enchantment option 1, 1 level' })).toBeEnabled();
  });
});

describe('stonecutter, loom and recipe book controls', () => {
  it('lights, darkens and toggles a stonecutter recipe cell', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container, rerender } = renderWithProvider(
      <StonecutterRecipeButton label="Stone Stairs" onClick={onClick}>
        <span>stairs</span>
      </StonecutterRecipeButton>,
    );
    const button = screen.getByRole('button', { name: 'Stone Stairs' });
    expect(button).toHaveStyle({ '--cobble-width': '16', '--cobble-height': '18' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    const content = screen.getByText('stairs').parentElement;
    expect(content).toHaveClass('cobble-fit-content');
    expect(content?.style.width).toBe('calc(12 * var(--cobble-px))');
    expect(content?.style.height).toBe('calc(14 * var(--cobble-px))');
    expect(content?.style.left).toBe('calc(2 * var(--cobble-px))');
    expect(slotSprites(container)).toEqual(['container/stonecutter/recipe']);
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(slotSprites(container)).toEqual(['container/stonecutter/recipe_highlighted']);
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <StonecutterRecipeButton label="Stone Stairs" selected />
      </CobbleProvider>,
    );
    expect(slotSprites(container)).toEqual(['container/stonecutter/recipe_selected']);
  });

  it('fits loom pattern content inside the cell with padding', () => {
    renderWithProvider(
      <LoomPatternButton label="Border">
        <span>preview</span>
      </LoomPatternButton>,
    );
    const content = screen.getByText('preview').parentElement;
    expect(content?.style.width).toBe('calc(10 * var(--cobble-px))');
    expect(content?.style.height).toBe('calc(10 * var(--cobble-px))');
  });

  it('draws loom patterns at 14x14', () => {
    const { container } = renderWithProvider(<LoomPatternButton selected />);
    expect(container.querySelector('.cobble-loom-button')).toHaveStyle({
      '--cobble-width': '14',
      '--cobble-height': '14',
    });
    expect(slotSprites(container)).toEqual(['container/loom/pattern_selected']);
  });

  it('gives each container scroller its own thumb and a 56-unit track', () => {
    const { container } = renderWithProvider(
      <>
        <StonecutterScroller defaultValue={1} />
        <LoomScroller disabled />
      </>,
    );
    expect(slotSprites(container)).toEqual([
      'container/stonecutter/scroller',
      'container/loom/scroller_disabled',
    ]);
    expect(screen.getByRole('scrollbar', { name: 'Recipes' })).toHaveStyle({
      '--cobble-width': '12',
      '--cobble-height': '56',
    });
    expect(container.querySelector('canvas')).toHaveStyle({ '--cobble-y': '41' });
  });

  it('picks recipe book sprites for tabs, filters, pages and slots', () => {
    expect(recipeBookFilterSprites(true, false).normal).toBe('recipe_book/filter_enabled');
    expect(recipeBookFilterSprites(false, false).highlighted).toBe(
      'recipe_book/filter_disabled_highlighted',
    );
    expect(recipeBookFilterSprites(true, true).normal).toBe('recipe_book/furnace_filter_enabled');
    expect(recipeBookSlotSprite(true, false)).toBe('recipe_book/slot_craftable');
    expect(recipeBookSlotSprite(true, true)).toBe('recipe_book/slot_many_craftable');
    expect(recipeBookSlotSprite(false, false)).toBe('recipe_book/slot_uncraftable');
    expect(recipeBookSlotSprite(false, true)).toBe('recipe_book/slot_many_uncraftable');
    const { container } = renderWithProvider(
      <>
        <RecipeBookTab label="Building" selected />
        <RecipeBookFilterButton enabled />
        <RecipeBookPageButton direction="backward" />
        <RecipeBookSlot label="Torch" craftable={false} many>
          <span>torch</span>
        </RecipeBookSlot>
      </>,
    );
    expect(slotSprites(container)).toEqual([
      'recipe_book/tab_selected',
      'recipe_book/filter_enabled',
      'recipe_book/page_backward',
      'recipe_book/slot_many_uncraftable',
    ]);
    expect(screen.getByRole('button', { name: 'Building' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Show craftable recipes only' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Previous Page' })).toHaveStyle({
      '--cobble-width': '12',
      '--cobble-height': '17',
    });
    const torch = screen.getByText('torch').parentElement;
    expect(torch?.style.left).toBe('calc(4 * var(--cobble-px))');
    expect(torch?.style.width).toBe('calc(17 * var(--cobble-px))');
  });

  it('draws the right red mark and size for each screen', () => {
    expect(containerErrorSize('anvil')).toEqual({ width: 28, height: 21 });
    expect(containerErrorSize('loom')).toEqual({ width: 26, height: 26 });
    const { container } = renderWithProvider(<ContainerError kind="smithing" />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/smithing/error',
    );
    expect(screen.getByRole('img', { name: 'Error' })).toBeInTheDocument();
  });
});

describe('anvil field, brewing bubbles and container parts', () => {
  it('draws the anvil name field with its own box that does not change on focus', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<AnvilTextField aria-label="Item name" />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/anvil/text_field',
    );
    await user.click(screen.getByRole('textbox', { name: 'Item name' }));
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/anvil/text_field',
    );
    expect(container.querySelector('.cobble-text-field')).toHaveStyle({
      '--cobble-width': '110',
      '--cobble-height': '16',
    });
  });

  it('dims the anvil field when disabled and keeps vanilla sprites for plain fields', () => {
    expect(textFieldSprite(undefined, true, false)).toBe('widget/text_field_highlighted');
    expect(textFieldSprite(ANVIL_TEXT_FIELD_SPRITES, false, true)).toBe(
      'container/anvil/text_field_disabled',
    );
    const { container } = renderWithProvider(<AnvilTextField aria-label="Name" disabled />);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'container/anvil/text_field_disabled',
    );
  });

  it('cycles the brewing bubble heights every two ticks', () => {
    expect([0, 1, 2, 4, 6, 8, 10, 12, 14].map(brewBubbleLength)).toEqual([
      0, 29, 24, 20, 16, 11, 6, 0, 29,
    ]);
    const { container } = renderWithProvider(<BrewBubbles brewTime={9} />);
    expect(slotSprites(container)).toEqual(['container/brewing_stand/bubbles']);
    expect(container.querySelector('.cobble-brew-bubbles')).toHaveStyle({
      '--cobble-clip-height': '11',
    });
  });

  it('shows nothing for the bubbles while idle', () => {
    const { container } = renderWithProvider(<BrewBubbles brewTime={0} />);
    expect(slotSprites(container)).toEqual([]);
  });

  it('picks recipe overlay sprites for each look', () => {
    expect(recipeOverlaySprite('crafting', true, false)).toBe('recipe_book/crafting_overlay');
    expect(recipeOverlaySprite('crafting', false, true)).toBe(
      'recipe_book/crafting_overlay_disabled_highlighted',
    );
    expect(recipeOverlaySprite('furnace', true, true)).toBe(
      'recipe_book/furnace_overlay_highlighted',
    );
    expect(recipeOverlaySprite('furnace', false, false)).toBe(
      'recipe_book/furnace_overlay_disabled',
    );
  });

  it('keeps an uncraftable overlay cell clickable and highlights it', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <RecipeOverlayButton label="Oak Planks" craftable={false} onClick={onClick}>
        <span>planks</span>
      </RecipeOverlayButton>,
    );
    expect(slotSprites(container)).toEqual(['recipe_book/crafting_overlay_disabled']);
    await user.click(screen.getByRole('button', { name: 'Oak Planks' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(slotSprites(container)).toEqual(['recipe_book/crafting_overlay_disabled_highlighted']);
    expect(screen.getByText('planks').parentElement).toHaveStyle({
      '--cobble-x': '4',
      '--cobble-y': '4',
    });
  });

  it('bars a disabled crafter slot and reports its state as a switch', () => {
    expect(crafterSlotSprite(false)).toBe('container/slot');
    expect(crafterSlotSprite(true)).toBe('container/crafter/disabled_slot');
    const { container } = renderWithProvider(
      <>
        <CrafterSlot label="Slot 1">
          <span>item</span>
        </CrafterSlot>
        <CrafterSlot label="Slot 2" slotDisabled>
          <span>hidden</span>
        </CrafterSlot>
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Slot 1' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Slot 2' })).toHaveAttribute('aria-checked', 'false');
    expect(slotSprites(container)).toEqual(['container/slot', 'container/crafter/disabled_slot']);
    expect(screen.queryByText('hidden')).toBeNull();
  });

  it('labels the crafter redstone indicator by state', () => {
    renderWithProvider(
      <>
        <CrafterRedstone powered />
        <CrafterRedstone powered={false} />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Powered' })).toHaveAttribute(
      'data-sprite',
      'container/crafter/powered_redstone',
    );
    expect(screen.getByRole('img', { name: 'Not powered' })).toHaveAttribute(
      'data-sprite',
      'container/crafter/unpowered_redstone',
    );
  });

  it('sizes cartography frames and the chest grid', () => {
    expect(cartographyMapSize('map')).toEqual({ width: 66, height: 66 });
    expect(cartographyMapSize('duplicated')).toEqual({ width: 50, height: 66 });
    expect(cartographyMapSize('locked')).toEqual({ width: 10, height: 14 });
    expect(horseChestWidth(0)).toBe(0);
    expect(horseChestWidth(3)).toBe(54);
    expect(horseChestWidth(9)).toBe(90);
    const { container } = renderWithProvider(<HorseChestSlots columns={3} />);
    expect(container.querySelector('.cobble-horse-chest')).toHaveStyle({
      '--cobble-width': '54',
      '--cobble-height': '54',
    });
    expect(slotSprites(container)).toEqual(['container/horse/chest_slots']);
  });

  it('reads animated sprite sizes from their sheets', async () => {
    const { container } = renderAnimated(
      <>
        <AnimatedSprite sprite="icon/music_notes" />
        <AnimatedSprite sprite="icon/trial_available" />
      </>,
    );
    expect(slotSprites(container)).toEqual(['icon/music_notes', 'icon/trial_available']);
    const frames = [...container.querySelectorAll<HTMLElement>('.cobble-animated-sprite')];
    await waitFor(() => expect(frames[0]).toHaveStyle({ '--cobble-width': '16' }));
    expect(frames[0]).toHaveStyle({ '--cobble-width': '16', '--cobble-height': '16' });
    expect(frames[1]).toHaveStyle({ '--cobble-width': '8', '--cobble-height': '8' });
  });
});

describe('CartographyMap', () => {
  it('draws the frame for each kind at its own size', () => {
    const { container } = renderWithProvider(<CartographyMap kind="duplicated" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('data-sprite', 'container/cartography_table/duplicated_map');
    expect(canvas).toHaveStyle({ '--cobble-sprite-width': '50', '--cobble-sprite-height': '66' });
  });
});

describe('Icon, PlayerPingIcon and RealmsButton', () => {
  it('draws a named icon at its natural size', () => {
    expect(iconInfo('language')).toEqual({ sprite: 'icon/language', width: 15, height: 15 });
    expect(iconInfo('pause_player_reporting')).toEqual({
      sprite: 'pause_menu/player_reporting',
      width: 15,
      height: 14,
    });
    expect(iconInfo('new_realm')).toEqual({ sprite: 'icon/new_realm', width: 40, height: 20 });
    const { container } = renderWithProvider(<Icon name="search" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('data-sprite', 'icon/search');
    expect(canvas).toHaveStyle({ '--cobble-sprite-width': '12', '--cobble-sprite-height': '12' });
  });

  it('uses the highlighted artwork only where there is some', () => {
    expect(iconInfo('link', true).sprite).toBe('icon/link_highlighted');
    expect(iconInfo('video_link', true).sprite).toBe('icon/video_link_highlighted');
    expect(iconInfo('info', true).sprite).toBe('icon/info');
  });

  it('is hidden from assistive technology unless it has a label', () => {
    renderWithProvider(
      <>
        <Icon name="info" />
        <Icon name="info" label="More information" />
      </>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'More information' })).toHaveAttribute(
      'data-icon',
      'info',
    );
    expect(ICON_NAMES).toContain('tutorial_wooden_planks');
    expect(ICON_NAMES).toHaveLength(24);
  });

  it('maps player list latency to the same five bars as the server list', () => {
    expect(playerPingSprite('unknown')).toBe('icon/ping_unknown');
    expect(playerPingSprite(-1)).toBe('icon/ping_unknown');
    expect(playerPingSprite(149)).toBe('icon/ping_5');
    expect(playerPingSprite(150)).toBe('icon/ping_4');
    expect(playerPingSprite(599)).toBe('icon/ping_3');
    expect(playerPingSprite(999)).toBe('icon/ping_2');
    expect(playerPingSprite(5000)).toBe('icon/ping_1');
    const { container } = renderWithProvider(<PlayerPingIcon latency={42} />);
    expect(container.querySelector('canvas')).toHaveAttribute('data-sprite', 'icon/ping_5');
  });

  it('draws the Realms button sprites', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<RealmsButton width={120}>Realms</RealmsButton>);
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/realms_button',
    );
    await user.hover(screen.getByRole('button', { name: 'Realms' }));
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'widget/realms_button_highlighted',
    );
  });
});

describe('SlotGrid and PlayerInventoryGrid', () => {
  it('lays out columns x rows slots 18 units apart', () => {
    expect(slotGridWidth(9)).toBe(162);
    expect(slotGridWidth(0)).toBe(0);
    const { container } = renderWithProvider(<SlotGrid columns={3} rows={2} label="Chest" />);
    const grid = screen.getByRole('group', { name: 'Chest' });
    expect(grid).toHaveStyle({
      '--cobble-width': '54',
      '--cobble-height': '36',
      '--cobble-columns': '3',
    });
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(slotSprites(container)).toEqual(Array.from({ length: 6 }, () => 'container/slot'));
  });

  it('fills slots in reading order, names them and reports clicks by index', async () => {
    const onSlotClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <SlotGrid
        columns={2}
        rows={2}
        onSlotClick={onSlotClick}
        items={[undefined, { content: <span>pick</span>, count: 3, label: 'Pickaxe' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Slot 1' })).toBeInTheDocument();
    const pickaxe = screen.getByRole('button', { name: 'Pickaxe' });
    expect(pickaxe).toHaveTextContent('pick');
    expect(pickaxe.querySelector('.cobble-inventory-slot-count')).toHaveTextContent('3');
    await user.click(pickaxe);
    await user.click(screen.getByRole('button', { name: 'Slot 4' }));
    expect(onSlotClick.mock.calls).toEqual([[1], [3]]);
  });

  it('shows the empty-slot icon in every empty slot', () => {
    const { container } = renderWithProvider(
      <SlotGrid columns={2} rows={1} emptyIcon="diamond" items={[{ content: <span>x</span> }]} />,
    );
    expect(slotSprites(container)).toEqual([
      'container/slot',
      'container/slot',
      'container/slot/diamond',
    ]);
  });

  it('stacks 3 rows, a 4-unit gap and the hotbar, and tells main from hotbar clicks', async () => {
    expect(INVENTORY_HOTBAR_GAP).toBe(4);
    const onSlotClick = vi.fn<(area: 'main' | 'hotbar', index: number) => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(<PlayerInventoryGrid onSlotClick={onSlotClick} />);
    expect(container.querySelector('.cobble-player-inventory')).toHaveStyle({
      '--cobble-width': '162',
      '--cobble-height': '76',
    });
    expect(screen.getAllByRole('button')).toHaveLength(36);
    const main = screen.getByRole('group', { name: 'Inventory' });
    const hotbar = screen.getByRole('group', { name: 'Hotbar' });
    await user.click(main.querySelectorAll('button')[26] as HTMLElement);
    await user.click(hotbar.querySelectorAll('button')[0] as HTMLElement);
    expect(onSlotClick.mock.calls).toEqual([
      ['main', 26],
      ['hotbar', 0],
    ]);
  });
});

describe('CraftingGrid and SocialPlayerEntry', () => {
  it('lays out a 3x3 grid with the result slot to its right', async () => {
    expect(CRAFTING_RESULT_OFFSET).toEqual({ x: 94, y: 18 });
    const onResultClick = vi.fn<() => void>();
    const onIngredientClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <CraftingGrid
        ingredients={[{ content: <span>plank</span>, label: 'Plank' }]}
        result={{ content: <span>table</span>, count: 4, label: 'Crafting Table' }}
        onResultClick={onResultClick}
        onIngredientClick={onIngredientClick}
      />,
    );
    expect(container.querySelector('.cobble-crafting-grid')).toHaveStyle({
      '--cobble-width': '112',
      '--cobble-height': '54',
    });
    expect(screen.getByRole('group', { name: 'Crafting' })).toBeInTheDocument();
    const result = screen.getByRole('button', { name: 'Crafting Table' });
    expect(result).toHaveStyle({ '--cobble-x': '94', '--cobble-y': '18' });
    expect(result.querySelector('.cobble-inventory-slot-count')).toHaveTextContent('4');
    await user.click(result);
    await user.click(screen.getByRole('button', { name: 'Plank' }));
    expect(onResultClick).toHaveBeenCalledTimes(1);
    expect(onIngredientClick).toHaveBeenCalledWith(0);
  });

  it('draws the 2x2 inventory grid and an empty result', () => {
    renderWithProvider(<CraftingGrid size={2} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Crafting result' })).toHaveStyle({
      '--cobble-x': '76',
      '--cobble-y': '9',
    });
  });

  it('puts the face, name, status and buttons on the player row', async () => {
    const onMutedChange = vi.fn<(muted: boolean) => void>();
    const onReport = vi.fn<() => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <SocialPlayerEntry
        name="Steve"
        status="Hidden"
        muted={false}
        onMutedChange={onMutedChange}
        onReport={onReport}
      >
        <span>face</span>
      </SocialPlayerEntry>,
    );
    expect(container.querySelector('canvas')).toHaveAttribute(
      'data-sprite',
      'social_interactions/background',
    );
    expect(container.querySelector('.cobble-social-entry')).toHaveStyle({
      '--cobble-width': '236',
      '--cobble-height': '34',
    });
    expect(screen.getByText('face').parentElement).toHaveStyle({ '--cobble-x': '6' });
    expect(screen.getByText('Steve')).toHaveStyle({ '--cobble-x': '34', '--cobble-y': '8' });
    expect(screen.getByText('Hidden')).toHaveStyle({ '--cobble-y': '20' });
    expect(screen.getByRole('button', { name: 'Report' })).toHaveStyle({ '--cobble-x': '210' });
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveStyle({ '--cobble-x': '186' });
    await user.click(screen.getByRole('button', { name: 'Mute' }));
    await user.click(screen.getByRole('button', { name: 'Report' }));
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('centres the name and drops the report button when there is nothing to show', () => {
    renderWithProvider(<SocialPlayerEntry name="Alex" />);
    expect(screen.getByText('Alex')).toHaveStyle({ '--cobble-y': '12' });
    expect(screen.queryByRole('button', { name: 'Report' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveStyle({ '--cobble-x': '210' });
  });
});

describe('EnchantingTablePanel', () => {
  it('puts the slots and three rows at the screen coordinates', () => {
    expect(ENCHANTING_LAYOUT.optionsX).toBe(60);
    const { container } = renderWithProvider(<EnchantingTablePanel background={false} />);
    expect(container.querySelector('.cobble-enchanting-panel')).toHaveStyle({
      '--cobble-width': '168',
      '--cobble-height': '71',
    });
    // The 18x18 slots start one unit before the item, which is what the screen coordinates name.
    expect(screen.getByRole('button', { name: 'Item to enchant' })).toHaveStyle({
      '--cobble-x': '14',
      '--cobble-y': '46',
    });
    expect(screen.getByRole('button', { name: 'Lapis Lazuli' })).toHaveStyle({
      '--cobble-x': '34',
      '--cobble-y': '46',
    });
    expect(screen.getByRole('button', { name: 'Enchantment option 3' })).toHaveStyle({
      '--cobble-x': '60',
      '--cobble-y': '52',
    });
    expect(slotSprites(container)).toContain('container/slot/lapis_lazuli');
  });

  it('leaves missing options disabled and reports clicks on the ones on offer', async () => {
    const onOptionClick = vi.fn<(option: number) => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <EnchantingTablePanel
        item={{ content: <span>sword</span>, label: 'Iron Sword' }}
        lapis={{ content: <span>lapis</span>, count: 3 }}
        options={[
          { clue: 'clue', cost: 1, label: 'Enchantment option 1, 1 level' },
          { cost: 30, disabled: true, label: 'Enchantment option 2, 30 levels' },
        ]}
        onOptionClick={onOptionClick}
      />,
    );
    expect(screen.getByRole('button', { name: 'Iron Sword' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enchantment option 2, 30 levels' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enchantment option 3' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Enchantment option 1, 1 level' }));
    await user.click(screen.getByRole('button', { name: 'Enchantment option 2, 30 levels' }));
    expect(onOptionClick.mock.calls).toEqual([[1]]);
  });
});

describe('station panels', () => {
  it('draws creative inventory slots bare over the artwork, and with sprites without it', () => {
    const withArt = renderWithProvider(<CreativeInventoryPanel />);
    expect(withArt.container.querySelectorAll('[data-bare]')).toHaveLength(54);
    withArt.unmount();
    const without = renderWithProvider(<CreativeInventoryPanel background={false} />);
    expect(without.container.querySelectorAll('[data-bare]')).toHaveLength(0);
  });

  it('grows to the screen window and draws its artwork unless turned off', () => {
    const { container } = renderWithProvider(<AnvilPanel />);
    const panel = container.querySelector('.cobble-anvil-panel');
    expect(panel).toHaveAttribute('data-container-background');
    expect(panel).toHaveStyle({ '--cobble-width': '176', '--cobble-height': '166' });
  });

  it('lays out the anvil: three slots, the name field and the error cross', async () => {
    const onSlotClick = vi.fn<(slot: string) => void>();
    const onNameChange = vi.fn<(name: string) => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <AnvilPanel
        background={false}
        left={{ content: <span>sword</span>, label: 'Iron Sword' }}
        name="Blade"
        onNameChange={onNameChange}
        onSlotClick={onSlotClick}
        error
      />,
    );
    expect(container.querySelector('.cobble-anvil-panel')).toHaveStyle({
      '--cobble-width': '169',
      '--cobble-height': '66',
    });
    expect(screen.getByRole('button', { name: 'Iron Sword' })).toHaveStyle({
      '--cobble-x': '26',
      '--cobble-y': '46',
    });
    expect(screen.getByRole('button', { name: 'Anvil result' })).toHaveStyle({
      '--cobble-x': '133',
    });
    expect(slotSprites(container)).toContain('container/anvil/text_field');
    expect(slotSprites(container)).toContain('container/anvil/error');
    expect(screen.getByRole('textbox', { name: 'Item name' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Anvil second input' }));
    expect(onSlotClick).toHaveBeenCalledWith('right');
  });

  it('disables the anvil name field until there is an item and hides the error', () => {
    const { container } = renderWithProvider(<AnvilPanel />);
    expect(screen.getByRole('textbox', { name: 'Item name' })).toBeDisabled();
    expect(slotSprites(container)).not.toContain('container/anvil/error');
  });

  it('computes how far through a brew the stand is', () => {
    expect(brewProgress(0)).toBe(0);
    expect(brewProgress(400)).toBe(0);
    expect(brewProgress(200)).toBe(0.5);
    expect(brewProgress(1)).toBeCloseTo(0.9975);
    expect(brewProgress(9999)).toBe(0);
  });

  it('lays out the brewing stand slots and meters', async () => {
    const onSlotClick = vi.fn<(slot: string) => void>();
    const user = userEvent.setup();
    const { container } = renderWithProvider(
      <BrewingStandPanel brewTime={200} fuelCharges={20} onSlotClick={onSlotClick} />,
    );
    expect(screen.getByRole('button', { name: 'Brewing ingredient' })).toHaveStyle({
      '--cobble-x': '78',
      '--cobble-y': '16',
    });
    expect(screen.getByRole('button', { name: 'Potion bottle 2' })).toHaveStyle({
      '--cobble-x': '78',
      '--cobble-y': '57',
    });
    expect(slotSprites(container)).toEqual(
      expect.arrayContaining([
        'container/brewing_stand/fuel_length',
        'container/brewing_stand/brew_progress',
        'container/slot/brewing_fuel',
        'container/slot/potion',
      ]),
    );
    await user.click(screen.getByRole('button', { name: 'Blaze powder' }));
    await user.click(screen.getByRole('button', { name: 'Potion bottle 3' }));
    expect(onSlotClick.mock.calls).toEqual([['fuel'], ['bottle-3']]);
  });

  it('lays out the furnace and uses the chosen station artwork', () => {
    const { container } = renderWithProvider(
      <FurnacePanel station="smoker" cookProgress={0.5} litProgress={0.5} />,
    );
    expect(screen.getByRole('button', { name: 'Furnace output' })).toHaveStyle({
      '--cobble-x': '115',
      '--cobble-y': '34',
    });
    expect(slotSprites(container)).toEqual(
      expect.arrayContaining(['container/smoker/lit_progress', 'container/smoker/burn_progress']),
    );
  });

  it('scrolls the stonecutter grid by whole rows', () => {
    expect(stonecutterStartIndex(0, 20)).toBe(0);
    expect(stonecutterStartIndex(1, 20)).toBe(8);
    expect(stonecutterStartIndex(0.4, 20)).toBe(4);
    expect(stonecutterStartIndex(0.5, 20)).toBe(4);
    expect(stonecutterStartIndex(0.75, 20)).toBe(8);
    expect(stonecutterStartIndex(1, 8)).toBe(0);
    expect(stonecutterStartIndex(Number.NaN, 20)).toBe(0);
  });

  it('shows the visible stonecutter recipes, selects one and reports clicks', async () => {
    const onRecipeClick = vi.fn<(index: number) => void>();
    const recipes = Array.from({ length: 16 }, (_, i) => ({
      content: <span>{i}</span>,
      label: `Recipe ${String(i)}`,
    }));
    const user = userEvent.setup();
    const { container, rerender } = renderWithProvider(
      <StonecutterPanel recipes={recipes} selectedRecipe={1} onRecipeClick={onRecipeClick} />,
    );
    expect(screen.getAllByRole('button', { name: /^Recipe/ })).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Recipe 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Recipe 5' })).toHaveStyle({
      '--cobble-x': '68',
      '--cobble-y': '32',
    });
    await user.click(screen.getByRole('button', { name: 'Recipe 6' }));
    expect(onRecipeClick).toHaveBeenCalledWith(6);
    expect(slotSprites(container)).toContain('container/stonecutter/scroller');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <StonecutterPanel recipes={recipes} scroll={1} />
      </CobbleProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Recipe 0' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Recipe 15' })).toBeInTheDocument();
  });

  it('greys the stonecutter scroller when every recipe fits', () => {
    const { container } = renderWithProvider(
      <StonecutterPanel recipes={[{ content: <span>a</span>, label: 'A' }]} />,
    );
    expect(slotSprites(container)).toContain('container/stonecutter/scroller_disabled');
  });
});

describe('loom, cartography, grindstone, smithing, beacon and crafter panels', () => {
  it('scrolls the loom pattern grid by whole rows of four', () => {
    expect(loomStartIndex(0, 40)).toBe(0);
    expect(loomStartIndex(1, 40)).toBe(24);
    expect(loomStartIndex(0.5, 40)).toBe(12);
    expect(loomStartIndex(1, 16)).toBe(0);
  });

  it('lays out the loom slots, patterns and scroller', async () => {
    const onPatternClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    const patterns = Array.from({ length: 6 }, (_, i) => ({ label: `Pattern ${String(i)}` }));
    const { container } = renderWithProvider(
      <LoomPanel patterns={patterns} selectedPattern={2} onPatternClick={onPatternClick} />,
    );
    expect(screen.getByRole('button', { name: 'Banner' })).toHaveStyle({
      '--cobble-x': '12',
      '--cobble-y': '25',
    });
    expect(screen.getByRole('button', { name: 'Loom result' })).toHaveStyle({
      '--cobble-x': '142',
    });
    expect(screen.getByRole('button', { name: 'Pattern 4' })).toHaveStyle({
      '--cobble-x': '60',
      '--cobble-y': '27',
    });
    expect(screen.getByRole('button', { name: 'Pattern 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Pattern 5' }));
    expect(onPatternClick).toHaveBeenCalledWith(5);
    expect(slotSprites(container)).toContain('container/loom/scroller_disabled');
  });

  it('draws the cartography frames only when asked', () => {
    const { container, rerender } = renderWithProvider(<CartographyPanel />);
    expect(slotSprites(container)).not.toContain('container/cartography_table/map');
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <CartographyPanel preview="scaled" locked error>
          <span>preview</span>
        </CartographyPanel>
      </CobbleProvider>,
    );
    expect(slotSprites(container)).toEqual(
      expect.arrayContaining([
        'container/cartography_table/scaled_map',
        'container/cartography_table/locked',
        'container/cartography_table/error',
      ]),
    );
    expect(screen.getByText('preview')).toBeInTheDocument();
  });

  it('places the grindstone slots and error cross', () => {
    const { container } = renderWithProvider(<GrindstonePanel error />);
    expect(screen.getByRole('button', { name: 'Grindstone bottom input' })).toHaveStyle({
      '--cobble-x': '48',
      '--cobble-y': '39',
    });
    expect(slotSprites(container)).toContain('container/grindstone/error');
  });

  it('gives the smithing slots their placeholder silhouettes', () => {
    const { container } = renderWithProvider(<SmithingTablePanel />);
    expect(slotSprites(container)).toEqual(
      expect.arrayContaining([
        'container/slot/smithing_template_armor_trim',
        'container/slot/chestplate',
        'container/slot/ingot',
      ]),
    );
    expect(screen.getByRole('button', { name: 'Smithing result' })).toHaveStyle({
      '--cobble-x': '97',
    });
  });

  it('draws the armor stand beside the smithing slots unless turned off', () => {
    const { container, rerender } = renderWithProvider(<SmithingTablePanel />);
    const stand = container.querySelector('.cobble-armor-stand');
    expect(stand).not.toBeNull();
    expect(stand).toHaveStyle({ '--cobble-x': '130.5', '--cobble-y': '28.5' });
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <SmithingTablePanel armorStand={false} />
      </CobbleProvider>,
    );
    expect(container.querySelector('.cobble-armor-stand')).toBeNull();
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <SmithingTablePanel background={false} />
      </CobbleProvider>,
    );
    expect(container.querySelector('.cobble-armor-stand')).toBeNull();
  });

  it('centres the beacon effect buttons in each tier', async () => {
    expect(beaconEffectX(0, 1)).toBe(65);
    expect(beaconEffectX(0, 2)).toBe(53);
    expect(beaconEffectX(1, 2)).toBe(77);
    const onEffectClick = vi.fn<(tier: number, index: number) => void>();
    const onConfirm = vi.fn<() => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <BeaconPanel
        tiers={[[{ label: 'Speed' }, { label: 'Haste' }], [{ label: 'Resistance' }]]}
        selected={[[0, 1]]}
        onEffectClick={onEffectClick}
        onConfirm={onConfirm}
        confirmDisabled={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'Haste' })).toHaveStyle({
      '--cobble-x': '77',
      '--cobble-y': '22',
    });
    expect(screen.getByRole('button', { name: 'Haste' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Resistance' })).toHaveStyle({ '--cobble-y': '47' });
    await user.click(screen.getByRole('button', { name: 'Speed' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onEffectClick).toHaveBeenCalledWith(0, 0);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables the beacon confirm button until it can be used', () => {
    renderWithProvider(<BeaconPanel confirmDisabled />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('lays out the crafter grid with switchable slots and the redstone indicator', async () => {
    const onSlotClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <CrafterPanel
        disabledSlots={[false, true]}
        powered
        onSlotClick={onSlotClick}
        slots={[{ content: <span>x</span>, label: 'Stick' }]}
      />,
    );
    expect(screen.getAllByRole('switch')).toHaveLength(9);
    expect(screen.getByRole('switch', { name: 'Crafter slot 2' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('switch', { name: 'Crafter slot 9' })).toHaveStyle({
      '--cobble-x': '62',
      '--cobble-y': '53',
    });
    expect(screen.getByRole('img', { name: 'Powered' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Stick' }));
    expect(onSlotClick).toHaveBeenCalledWith(0);
  });
});

describe('trading, hopper, dispenser and creative inventory panels', () => {
  it('scrolls the trade list by whole offers', () => {
    expect(tradeStartIndex(0, 12)).toBe(0);
    expect(tradeStartIndex(1, 12)).toBe(5);
    expect(tradeStartIndex(0.5, 12)).toBe(3);
    expect(tradeStartIndex(1, 5)).toBe(0);
  });

  it('shows up to seven trades, marks the chosen one and crosses out spent ones', async () => {
    const onOfferClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    const offers = Array.from({ length: 9 }, (_, i) => ({
      label: `Trade ${String(i)}`,
      buy: <span>b{i}</span>,
      sell: <span>s{i}</span>,
      outOfStock: i === 1,
    }));
    const { container } = renderWithProvider(
      <VillagerTradePanel
        offers={offers}
        selectedOffer={0}
        onOfferClick={onOfferClick}
        levelProgress={0.5}
      />,
    );
    expect(screen.getAllByRole('button', { name: /^Trade [0-9]/ })).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Trade 0' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Trade 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Trade 2' })).toHaveStyle({
      '--cobble-x': '5',
      '--cobble-y': '58',
    });
    expect(slotSprites(container)).toContain('container/villager/trade_arrow_out_of_stock');
    expect(slotSprites(container)).toContain('container/villager/experience_bar_current');
    await user.click(screen.getByRole('button', { name: 'Trade 3' }));
    expect(onOfferClick).toHaveBeenCalledWith(3);
  });

  it('hides the level bar for a trader and greys the scroller when every trade fits', () => {
    const { container } = renderWithProvider(<VillagerTradePanel />);
    expect(slotSprites(container)).not.toContain('container/villager/experience_bar_background');
    expect(slotSprites(container)).toContain('container/villager/scroller_disabled');
    expect(screen.getByRole('button', { name: 'Trade result' })).toHaveStyle({
      '--cobble-x': '219',
    });
  });

  it('lays out the hopper and dispenser grids', async () => {
    const onSlotClick = vi.fn<(index: number) => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <HopperPanel isolate onSlotClick={onSlotClick} />
        <DispenserPanel isolate />
      </>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(5 + 9);
    expect(screen.getByRole('group', { name: 'Hopper' })).toHaveStyle({ '--cobble-columns': '5' });
    expect(screen.getByRole('group', { name: 'Dispenser' })).toHaveStyle({
      '--cobble-columns': '3',
      '--cobble-x': '61',
      '--cobble-y': '16',
    });
    expect(screen.getByRole('group', { name: 'Hopper' })).toHaveStyle({ '--cobble-y': '19' });
    await user.click(
      within(screen.getByRole('group', { name: 'Hopper' })).getAllByRole(
        'button',
      )[3] as HTMLElement,
    );
    expect(onSlotClick).toHaveBeenCalledWith(3);
  });

  it('shows the player inventory under the panels unless told not to', () => {
    const shown = renderWithProvider(<DispenserPanel />);
    expect(screen.getAllByRole('button')).toHaveLength(9 + 36);
    expect(screen.getByRole('group', { name: 'Inventory' })).toBeInTheDocument();
    shown.unmount();
    renderWithProvider(
      <>
        <DispenserPanel isolate />
        <VillagerTradePanel isolate />
      </>,
    );
    expect(screen.queryByRole('group', { name: 'Inventory' })).toBeNull();
    expect(document.querySelectorAll('[data-container-compact]')).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Hotbar' })).toBeNull();
  });

  it('draws a bare slot without its own sprite', () => {
    const { container } = renderWithProvider(
      <>
        <InventorySlot aria-label="Plain" />
        <InventorySlot aria-label="Bare" bare />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Bare' })).toHaveAttribute('data-bare');
    expect(screen.getByRole('button', { name: 'Bare' }).querySelector('canvas')).toBeNull();
    expect(screen.getByRole('button', { name: 'Plain' }).querySelector('canvas')).not.toBeNull();
    expect(container).toBeTruthy();
  });

  it('places the creative tabs in two rows around the item grid', async () => {
    const onTabClick = vi.fn<(index: number) => void>();
    const onSlotClick = vi.fn<(area: string, index: number) => void>();
    const user = userEvent.setup();
    const tabs = Array.from({ length: 9 }, (_, i) => ({ label: `Tab ${String(i)}` }));
    renderWithProvider(
      <CreativeInventoryPanel
        tabs={tabs}
        selectedTab={8}
        onTabClick={onTabClick}
        onSlotClick={onSlotClick}
      />,
    );
    expect(screen.getByRole('button', { name: 'Tab 2' })).toHaveStyle({
      '--cobble-x': '54',
      '--cobble-y': '0',
    });
    expect(screen.getByRole('button', { name: 'Tab 8' })).toHaveStyle({
      '--cobble-x': '27',
      '--cobble-y': '160',
    });
    expect(screen.getByRole('button', { name: 'Tab 8' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: 'Items' })).toHaveStyle({
      '--cobble-columns': '9',
      '--cobble-y': '46',
    });
    expect(screen.getByRole('group', { name: 'Hotbar' })).toHaveStyle({ '--cobble-y': '140' });
    expect(screen.getByRole('scrollbar', { name: 'Scroll items' })).toHaveStyle({
      '--cobble-x': '175',
    });
    await user.click(screen.getByRole('button', { name: 'Tab 4' }));
    await user.click(
      within(screen.getByRole('group', { name: 'Hotbar' })).getAllByRole(
        'button',
      )[2] as HTMLElement,
    );
    expect(onTabClick).toHaveBeenCalledWith(4);
    expect(onSlotClick).toHaveBeenCalledWith('hotbar', 2);
  });
});

describe('LinearLayout, GridLayout and FrameLayout', () => {
  it('stacks children vertically by default, with the gap and alignment as variables', () => {
    renderWithProvider(
      <LinearLayout data-testid="column" spacing={4} align="center">
        <span>a</span>
        <span>b</span>
      </LinearLayout>,
    );
    const column = screen.getByTestId('column');
    expect(column).toHaveAttribute('data-orientation', 'vertical');
    expect(column).toHaveStyle({ '--cobble-spacing': '4', '--cobble-align': 'center' });
    expect(column.children).toHaveLength(2);
  });

  it('lays out a row and maps the alignments to flex values', () => {
    renderWithProvider(
      <LinearLayout data-testid="row" orientation="horizontal" spacing={8} align="end">
        <span>x</span>
      </LinearLayout>,
    );
    expect(screen.getByTestId('row')).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByTestId('row')).toHaveStyle({ '--cobble-align': 'flex-end' });
  });

  it('sets the grid columns and spacing, with row and column overrides', () => {
    renderWithProvider(
      <>
        <GridLayout data-testid="grid" columns={2} spacing={4} />
        <GridLayout data-testid="gap" columns={3} spacing={4} columnSpacing={10} rowSpacing={2} />
        <GridLayout data-testid="bad" columns={0} />
      </>,
    );
    expect(screen.getByTestId('grid')).toHaveStyle({
      '--cobble-columns': '2',
      '--cobble-column-spacing': '4',
      '--cobble-row-spacing': '4',
    });
    expect(screen.getByTestId('gap')).toHaveStyle({
      '--cobble-column-spacing': '10',
      '--cobble-row-spacing': '2',
    });
    expect(screen.getByTestId('bad')).toHaveStyle({ '--cobble-columns': '1' });
  });

  it('lets a grid cell span columns and rows and align itself', () => {
    renderWithProvider(
      <GridLayout columns={2}>
        <GridLayoutCell data-testid="wide" colSpan={2} alignX="center">
          wide
        </GridLayoutCell>
        <GridLayoutCell data-testid="tall" rowSpan={2} colSpan={0}>
          tall
        </GridLayoutCell>
      </GridLayout>,
    );
    const wide = screen.getByTestId('wide');
    expect(wide.style.gridColumn).toBe('span 2');
    expect(wide.style.gridRow).toBe('span 1');
    expect(wide).toHaveStyle({ '--cobble-align-x': 'center' });
    const tall = screen.getByTestId('tall');
    expect(tall.style.gridRow).toBe('span 2');
    expect(tall.style.gridColumn).toBe('span 1');
  });

  it('centres a frame by default and takes minimum sizes', () => {
    renderWithProvider(
      <>
        <FrameLayout data-testid="frame" minWidth={200} minHeight={100}>
          <span>child</span>
        </FrameLayout>
        <FrameLayout data-testid="corner" alignX="end" alignY="start" />
      </>,
    );
    expect(screen.getByTestId('frame')).toHaveStyle({
      '--cobble-align-x': 'center',
      '--cobble-align-y': 'center',
      '--cobble-min-width': '200',
      '--cobble-min-height': '100',
    });
    expect(screen.getByTestId('corner')).toHaveStyle({
      '--cobble-align-x': 'flex-end',
      '--cobble-align-y': 'flex-start',
    });
    expect(screen.getByTestId('corner').style.getPropertyValue('--cobble-min-width')).toBe('');
  });
});

describe('OptionsList', () => {
  it('lays rows of one or two widgets in a 310-unit column under a heading', () => {
    expect(OPTIONS_LIST_ROW_WIDTH).toBe(310);
    renderWithProvider(
      <OptionsList data-testid="list">
        <OptionsListHeader>Video Settings</OptionsListHeader>
        <OptionsListRow data-testid="row">
          <Button width={150}>FOV</Button>
          <Button width={150}>Render Distance</Button>
        </OptionsListRow>
        <OptionsListRow>
          <Button width={310}>Done</Button>
        </OptionsListRow>
      </OptionsList>,
    );
    expect(screen.getByRole('heading', { name: 'Video Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('list')).toHaveStyle({
      '--cobble-row-width': '310',
      '--cobble-item-height': '25',
    });
    expect(screen.getByTestId('row').children).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('takes a custom row width and height, and can drop the separators', () => {
    const { container } = renderWithProvider(
      <OptionsList data-testid="list" rowWidth={220} itemHeight={30} separators={false}>
        <OptionsListRow>
          <Button width={220}>Wide</Button>
        </OptionsListRow>
      </OptionsList>,
    );
    expect(screen.getByTestId('list')).toHaveStyle({
      '--cobble-row-width': '220',
      '--cobble-item-height': '30',
    });
    expect(container.querySelector('.cobble-selection-list-separator')).toBeNull();
  });

  it('draws the separators by default', () => {
    const { container } = renderWithProvider(<OptionsList />);
    const separators = container.querySelectorAll('.cobble-selection-list-separator');
    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveAttribute('data-texture', 'gui/header_separator');
    expect(separators[1]).toHaveAttribute('data-texture', 'gui/footer_separator');
  });
});

function Trigger(props: {
  readonly options: Parameters<ReturnType<typeof useToasts>['show']>[0];
  readonly label?: string;
}): ReactElement {
  const toasts = useToasts();
  return (
    <>
      <button type="button" onClick={() => toasts.show(props.options)}>
        {props.label ?? 'show'}
      </button>
      <button type="button" onClick={() => toasts.dismissAll()}>
        clear
      </button>
    </>
  );
}

describe('ToastProvider', () => {
  it('shows a queued toast, slides it in and removes it after its display time', async () => {
    vi.useFakeTimers();
    try {
      renderWithProvider(
        <ToastProvider>
          <Trigger options={{ title: 'Saved', messages: ['World backed up'], duration: 1000 }} />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByText('show'));
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Saved');
      expect(status).not.toHaveAttribute('data-open');
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(status).toHaveAttribute('data-open');
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS + 1000));
      expect(status).not.toHaveAttribute('data-open');
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS));
      expect(screen.queryByRole('status')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps at most maxVisible on screen and brings queued ones in as room frees up', async () => {
    vi.useFakeTimers();
    try {
      renderWithProvider(
        <ToastProvider maxVisible={2}>
          <Trigger options={{ title: 'Toast', duration: 500, sound: false }} />
        </ToastProvider>,
      );
      for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText('show'));
      expect(screen.getAllByRole('status')).toHaveLength(2);
      await act(() => vi.advanceTimersByTimeAsync(1));
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS + 500));
      expect(screen.getAllByRole('status')).toHaveLength(2);
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS));
      expect(screen.getAllByRole('status')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses everything, including toasts that are still waiting', async () => {
    vi.useFakeTimers();
    try {
      renderWithProvider(
        <ToastProvider maxVisible={1}>
          <Trigger options={{ title: 'Toast', duration: Infinity, sound: false }} />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByText('show'));
      fireEvent.click(screen.getByText('show'));
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS + 5000));
      expect(screen.getAllByRole('status')).toHaveLength(1);
      fireEvent.click(screen.getByText('clear'));
      await act(() => vi.advanceTimersByTimeAsync(TOAST_SLIDE_MS + 1));
      expect(screen.queryByRole('status')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuses to be used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderWithProvider(<Trigger options={{ title: 'x' }} />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});

let releaseAssets: () => void = () => undefined;

/** An asset source that reports half a download and then waits until `releaseAssets()`. */
function slowAssets(): AssetSource {
  return {
    key: 'slow',
    load: ({ onProgress }) =>
      new Promise<AssetBundle>((resolve) => {
        onProgress?.({ phase: 'download', loaded: 5 * 1024 * 1024, total: 10 * 1024 * 1024 });
        releaseAssets = () =>
          resolve({ version: 'test', file: () => undefined, objectUrl: () => undefined });
      }),
  };
}

describe('ProgressBar and AssetLoadingOverlay', () => {
  it('fills inside the 2-unit inset by ceil((width - 4) * progress)', () => {
    expect(progressBarFill(0, 200)).toBe(0);
    expect(progressBarFill(0.5, 200)).toBe(98);
    expect(progressBarFill(0.001, 200)).toBe(1);
    expect(progressBarFill(1, 200)).toBe(196);
    expect(progressBarFill(9, 200)).toBe(196);
    expect(progressBarFill(Number.NaN, 200)).toBe(0);
    expect(progressBarFill(1, 3)).toBe(0);
  });

  it('is a determinate progressbar with a fill, or an indeterminate one without a value', () => {
    renderWithProvider(
      <>
        <ProgressBar progress={0.25} width={100} label="Done" />
        <ProgressBar label="Waiting" />
      </>,
    );
    const done = screen.getByRole('progressbar', { name: 'Done' });
    expect(done).toHaveAttribute('aria-valuenow', '25');
    expect(done).toHaveStyle({ '--cobble-width': '100', '--cobble-fill': '24' });
    expect(done).not.toHaveAttribute('data-indeterminate');
    const waiting = screen.getByRole('progressbar', { name: 'Waiting' });
    expect(waiting).not.toHaveAttribute('aria-valuenow');
    expect(waiting).toHaveAttribute('data-indeterminate');
    expect(waiting).toHaveStyle({ '--cobble-width': '200', '--cobble-height': '10' });
  });

  it('computes the download fraction only when the size is known', () => {
    expect(assetProgressFraction(undefined)).toBeUndefined();
    expect(assetProgressFraction({ phase: 'manifest', loaded: 0, total: 0 })).toBeUndefined();
    expect(assetProgressFraction({ phase: 'download', loaded: 10, total: 40 })).toBe(0.25);
    expect(assetProgressFraction({ phase: 'download', loaded: 50, total: 40 })).toBe(1);
    expect(formatMegabytes(1024 * 1024 * 12.34)).toBe('12.3');
    expect(ASSET_PHASE_LABELS.verify).toBe('Verifying download');
  });

  it('shows loading progress, then nothing once the assets are ready', async () => {
    const { container } = renderPlain(
      <CobbleProvider assets={slowAssets()} guiScale={2} sound={{ enabled: false }}>
        <AssetLoadingOverlay />
      </CobbleProvider>,
    );
    const status = await screen.findByRole('status');
    expect(status).toHaveAttribute('data-variant', 'panel');
    expect(screen.getByRole('progressbar', { name: 'Loading game assets' })).toBeInTheDocument();
    expect(status).toHaveTextContent('Downloading the game client from Mojang');
    expect(status).toHaveTextContent('5.0 / 10.0 MB');
    releaseAssets();
    await waitFor(() => expect(container.querySelector('.cobble-asset-overlay')).toBeNull());
  });

  it('reports a load failure and retries on request', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const assets = {
      key: 'flaky',
      load: (): Promise<AssetBundle> => {
        attempts++;
        return attempts === 1
          ? Promise.reject(new Error('offline'))
          : Promise.resolve({ version: 'test', file: () => undefined, objectUrl: () => undefined });
      },
    } satisfies AssetSource;
    const { container } = renderPlain(
      <CobbleProvider assets={assets} guiScale={2} sound={{ enabled: false }}>
        <AssetLoadingOverlay variant="screen" />
      </CobbleProvider>,
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('offline');
    expect(alert).toHaveAttribute('data-variant', 'screen');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(container.querySelector('.cobble-asset-overlay')).toBeNull());
    expect(attempts).toBe(2);
  });
});

describe('Screen onClose', () => {
  it('calls onClose when Escape is pressed and marks the key as handled', () => {
    const onClose = vi.fn<() => void>();
    renderWithProvider(<Screen onClose={onClose} background="none" />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a handler or after the key was used', () => {
    const onClose = vi.fn<() => void>();
    const { rerender } = renderWithProvider(<Screen background="none" />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <Screen onClose={onClose} background="none" />
      </CobbleProvider>,
    );
    const used = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    used.preventDefault();
    document.dispatchEvent(used);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves Escape to an open dialog, then closes the screen on the next press', async () => {
    const onClose = vi.fn<() => void>();
    const user = userEvent.setup();
    renderWithProvider(
      <Screen onClose={onClose} background="none">
        <Dialog defaultOpen title="Sure?">
          <DialogClose>Cancel</DialogClose>
        </Dialog>
      </Screen>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the latest handler without re-subscribing', () => {
    const first = vi.fn<() => void>();
    const second = vi.fn<() => void>();
    const { rerender } = renderWithProvider(<Screen onClose={first} background="none" />);
    rerender(
      <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }}>
        <Screen onClose={second} background="none" />
      </CobbleProvider>,
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('ChatLog and ChatInput', () => {
  it('fades a message over the last tenth of its ten seconds', () => {
    expect(chatMessageOpacity(0)).toBe(1);
    expect(chatMessageOpacity(8999)).toBe(1);
    expect(chatMessageOpacity(9000)).toBeCloseTo(1, 5);
    expect(chatMessageOpacity(9500)).toBeCloseTo(0.25, 5);
    expect(chatMessageOpacity(10000)).toBe(0);
    expect(chatMessageOpacity(60000)).toBe(0);
    expect(chatMessageOpacity(-5)).toBe(1);
  });

  it('shows recent messages, drops expired ones and sizes the log for 10 closed lines', () => {
    const messages = [
      { id: 1, content: 'old news', timestamp: 0 },
      { id: 2, content: 'fading', timestamp: 500 },
      { id: 3, content: 'fresh', timestamp: 9900 },
    ];
    renderWithProvider(<ChatLog messages={messages} now={10000} />);
    expect(screen.queryByText('old news')).toBeNull();
    expect(screen.getByText('fresh')).toHaveStyle({ '--cobble-chat-opacity': '1' });
    expect(
      Number(screen.getByText('fading').style.getPropertyValue('--cobble-chat-opacity')),
    ).toBeCloseTo(0.25, 5);
    expect(screen.getByRole('log', { name: 'Chat' })).toHaveStyle({
      '--cobble-width': '320',
      '--cobble-height': '90',
    });
  });

  it('shows every message fully, 20 lines tall, while open', () => {
    renderWithProvider(
      <ChatLog open now={999999} messages={[{ id: 1, content: 'ancient', timestamp: 0 }]} />,
    );
    expect(screen.getByText('ancient')).toHaveStyle({ '--cobble-chat-opacity': '1' });
    expect(screen.getByRole('log')).toHaveStyle({ '--cobble-height': '180' });
  });

  it('scrolls older lines into view with the wheel while open, Shift taking seven at a time', () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      content: `m${String(i)}`,
      timestamp: 0,
    }));
    renderWithProvider(<ChatLog open now={0} messages={messages} />);
    const log = screen.getByRole('log');
    expect(log).toHaveStyle({ '--cobble-scroll': '0' });
    fireEvent.wheel(log, { deltaY: -100 });
    expect(log).toHaveStyle({ '--cobble-scroll': '1' });
    fireEvent.wheel(log, { deltaY: -100, shiftKey: true });
    expect(log).toHaveStyle({ '--cobble-scroll': '8' });
    fireEvent.wheel(log, { deltaY: 100, shiftKey: true });
    fireEvent.wheel(log, { deltaY: 100 });
    fireEvent.wheel(log, { deltaY: 100 });
    expect(log).toHaveStyle({ '--cobble-scroll': '0' });
  });

  it('ignores the wheel while closed', () => {
    renderWithProvider(<ChatLog now={0} messages={[{ id: 1, content: 'x', timestamp: 0 }]} />);
    fireEvent.wheel(screen.getByRole('log'), { deltaY: -100 });
    expect(screen.getByRole('log')).toHaveStyle({ '--cobble-scroll': '0' });
  });

  it('sends a non-empty line on Enter and clears the field', async () => {
    const onSubmit = vi.fn<(message: string) => void>();
    const user = userEvent.setup();
    renderWithProvider(<ChatInput onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    await user.type(input, '   {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, 'hello world{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('hello world');
    expect(input).toHaveValue('');
    expect(CHAT_MAX_LENGTH).toBe(256);
  });

  it('walks back through what was sent with Up and forward with Down', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChatInput onSubmit={() => undefined} />);
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    await user.type(input, 'first{Enter}');
    await user.type(input, 'second{Enter}');
    await user.type(input, 'second{Enter}');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('second');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('first');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('first');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('second');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('');
  });

  it('uses a history supplied by the caller and lets onKeyDown claim a key', async () => {
    const onKeyDown = vi.fn<(event: { preventDefault: () => void; key: string }) => void>(
      (event) => {
        if (event.key === 'ArrowUp') event.preventDefault();
      },
    );
    const user = userEvent.setup();
    renderWithProvider(
      <ChatInput onSubmit={() => undefined} history={['/gamemode']} onKeyDown={onKeyDown} />,
    );
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    await user.type(input, 'x');
    await user.keyboard('{ArrowUp}');
    expect(onKeyDown).toHaveBeenCalled();
    expect(input).toHaveValue('x');
  });
});

function mockMotionPreference(matches: boolean): { readonly change: (next: boolean) => void } {
  const listeners = new Set<() => void>();
  let current = matches;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return current && query.includes('reduce');
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    change: (next) => {
      current = next;
      // A copy: the provider re-registers its own resolution listener on every change.
      const snapshot = Array.from(listeners);
      for (const listener of snapshot) listener();
    },
  };
}

function MotionProbe(): ReactElement {
  return <span data-testid="reduced">{String(usePrefersReducedMotion())}</span>;
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is false where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);
    renderWithProvider(<MotionProbe />);
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('reads the preference and follows changes to it', () => {
    const motion = mockMotionPreference(true);
    renderWithProvider(<MotionProbe />);
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
    act(() => motion.change(false));
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('keeps the panorama still when reduced motion is requested, unless told not to', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    mockMotionPreference(true);
    const { unmount } = renderWithProvider(<Panorama />);
    expect(frames).toHaveLength(0);
    unmount();
    renderWithProvider(<Panorama respectReducedMotion={false} />);
    expect(frames.length).toBeGreaterThan(0);
  });
});

describe('player components', () => {
  it('builds mc-heads.net urls', () => {
    expect(mcHeadsUrl('avatar', 'Steve', 16)).toBe('https://mc-heads.net/avatar/Steve/16');
    expect(mcHeadsUrl('body', 'a b')).toBe('https://mc-heads.net/body/a%20b');
  });

  it('PlayerHead fetches the real face only when given a player', () => {
    const plain = renderWithProvider(<PlayerHead />);
    expect(plain.container.querySelector('img')).toBeNull();
    const real = renderWithProvider(<PlayerHead player="Steve" />);
    expect(real.container.querySelector('img')?.getAttribute('src')).toContain('/avatar/Steve/');
  });

  it('PlayerRenderer shows the body render with a name', () => {
    renderWithProvider(<PlayerRenderer player="jeb_" />);
    expect(screen.getByRole('img', { name: 'jeb_ skin' })).toBeInTheDocument();
  });

  it('ThreeViewport shows its fallback without WebGL and takes arrow keys when rotatable', async () => {
    renderWithProvider(
      <ThreeViewport aria-label="Stone cube" rotatable textures={['block/stone']} fallback="Loading" />,
    );
    const viewport = screen.getByRole('img', { name: 'Stone cube' });
    expect(viewport).toHaveAttribute('data-status', 'unsupported');
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveTextContent('Loading');
    viewport.focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowDown}');
    expect(viewport).toBeInTheDocument();
  });

  it('ThreeViewport is not focusable unless rotatable', () => {
    renderWithProvider(<ThreeViewport aria-label="Static" />);
    expect(screen.getByRole('img', { name: 'Static' })).not.toHaveAttribute('tabindex');
  });

  it('BlockModel falls back to the flat icon and names itself', () => {
    const { container } = renderWithProvider(<BlockModel name="stone" />);
    const viewport = screen.getByRole('img', { name: 'stone' });
    expect(viewport).toHaveAttribute('data-status', 'loading');
    expect(container.querySelector('canvas[data-item="stone"]')).toBeInTheDocument();
  });

  it('BlockModel is rotatable by default and takes a custom label', () => {
    renderWithProvider(<BlockModel name="furnace" aria-label="Smelter" />);
    expect(screen.getByRole('img', { name: 'Smelter' })).toBeInTheDocument();
  });

  it('PlayerInventory reports clicks by area', async () => {
    const onSlotClick = vi.fn<(area: string, index: number) => void>();
    renderWithProvider(<PlayerInventory onSlotClick={onSlotClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Boots' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crafting result' }));
    expect(onSlotClick).toHaveBeenNthCalledWith(1, 'armor', 3);
    expect(onSlotClick).toHaveBeenNthCalledWith(2, 'result', 0);
  });

  it('ChestPanel has one slot per cell and can hide the inventory', () => {
    const full = renderWithProvider(<ChestPanel rows={2} />);
    expect(full.container.querySelectorAll('button')).toHaveLength(18 + 27 + 9);
    const bare = renderWithProvider(<ChestPanel rows={2} isolate />);
    expect(bare.container.querySelectorAll('button')).toHaveLength(18);
    expect(bare.container.querySelector('[data-chest-edge]')).not.toBeNull();
    expect(full.container.querySelector('[data-chest-edge]')).toBeNull();
  });

  it('HotbarWithStats hides armor at 0 and air when full', () => {
    const idle = renderWithProvider(<HotbarWithStats />);
    expect(idle.container.querySelector('[aria-label*="Armor" i]')).toBeNull();
    expect(idle.container.querySelector('[aria-label*="Air" i]')).toBeNull();
    const busy = renderWithProvider(<HotbarWithStats armor={10} air={100} />);
    expect(busy.container.querySelector('[aria-label*="Armor" i]')).not.toBeNull();
    expect(busy.container.querySelector('[aria-label*="Air" i]')).not.toBeNull();
  });
});

describe('layout gap and fill', () => {
  it('prefers gap over the spacing alias and marks fill layouts', () => {
    renderWithProvider(
      <>
        <LinearLayout data-testid="a" gap={6} spacing={2} fill />
        <LinearLayout data-testid="b" spacing={2} />
        <GridLayout data-testid="grid" columns={2} gap={3} fill />
      </>,
    );
    expect(screen.getByTestId('a')).toHaveStyle({ '--cobble-spacing': '6' });
    expect(screen.getByTestId('a')).toHaveAttribute('data-fill');
    expect(screen.getByTestId('b')).toHaveStyle({ '--cobble-spacing': '2' });
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-fill');
    expect(screen.getByTestId('grid')).toHaveAttribute('data-fill');
    expect(screen.getByTestId('grid')).toHaveStyle({
      '--cobble-column-spacing': '3',
      '--cobble-align-x': 'stretch',
    });
  });
});

describe('Dialog actions', () => {
  it('renders the actions in a filled, gapped row', () => {
    renderWithProvider(
      <Dialog defaultOpen title="Sure?" actions={<button type="button">Delete</button>}>
        Lost forever
      </Dialog>,
    );
    const row = document.querySelector('.cobble-dialog-actions');
    expect(row).not.toBeNull();
    expect(row).toHaveAttribute('data-fill');
    expect(row).toHaveStyle({ '--cobble-spacing': '4' });
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

const inWorldView = (inWorld: boolean, world?: null) => (
  <CobbleProvider assets={testAssets()} guiScale={2} sound={{ enabled: false }} inWorld={inWorld}>
    {world === null ? <Screen world={null} /> : <Screen />}
  </CobbleProvider>
);

describe('Screen in-world backdrop', () => {
  it('draws a stand-in world only for in-world menus, and not when world is null', () => {
    const { container, rerender } = renderPlain(inWorldView(false));
    expect(container.querySelector('.cobble-screen-world')).toBeNull();
    rerender(inWorldView(true));
    expect(container.querySelector('.cobble-screen-world')).not.toBeNull();
    rerender(inWorldView(true, null));
    expect(container.querySelector('.cobble-screen-world')).toBeNull();
  });
});
