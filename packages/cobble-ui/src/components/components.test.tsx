import { act, fireEvent, render as renderPlain, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { png, renderWithProvider, testAssets } from '../../test/utils.tsx';
import {
  Air,
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
    const icons = [0, 1, 2].map((i) => halfPointIcon(i, 3, 'e', 'h', 'f'));
    expect(icons).toEqual([['e', 'f'], ['e', 'h'], ['e']]);
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
    const tab = screen.getByRole('tab', { name: 'Adventure' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
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
    expect(creativeTabSprite('top', 99, false)).toBe(
      'container/creative_inventory/tab_top_unselected_7',
    );
    expect(creativeTabSprite('top', 0, false)).toBe(
      'container/creative_inventory/tab_top_unselected_1',
    );
  });

  it('renders a selectable tab', () => {
    const { container } = renderWithProvider(
      <CreativeTab label="Building Blocks" row="bottom" column={3} selected />,
    );
    expect(screen.getByRole('tab', { name: 'Building Blocks' })).toHaveAttribute(
      'aria-selected',
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
        <AnimatedSprite sprite="test/sheet" frameWidth={4} frameHeight={4} frametime={1} />
      </CobbleProvider>,
    );
    const root = container.querySelector('.cobble-animated-sprite');
    expect(root).toHaveStyle({ '--cobble-width': '4', '--cobble-height': '4' });
    await waitFor(() => expect(root).toHaveAttribute('data-frame', '2'), { timeout: 1500 });
    await waitFor(() => expect(root).toHaveAttribute('data-frame', '0'), { timeout: 1500 });
  });

  it('draws a realm status light from its own sheet', () => {
    const { container } = renderWithProvider(<RealmStatusIcon status="expires_soon" />);
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

describe('LocatorBar arrows', () => {
  it('draws a 7x5 animated arrow above or below its dot', () => {
    const { container } = renderWithProvider(
      <LocatorBar
        waypoints={[
          { position: 0, arrow: 'up' },
          { position: 0.5, arrow: 'down' },
        ]}
      />,
    );
    const arrows = [...container.querySelectorAll<HTMLElement>('.cobble-locator-arrow')];
    expect(arrows).toHaveLength(2);
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
