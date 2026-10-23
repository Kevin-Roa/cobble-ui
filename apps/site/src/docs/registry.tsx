import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';
import AssetsGuide from './guides/assets.mdx';
import GettingStarted from './guides/getting-started.mdx';
import ProviderGuide from './guides/provider.mdx';
import StylingGuide from './guides/styling.mdx';
import {
  CrossButtonPage,
  FriendsButtonPage,
  MuteButtonPage,
  PlayerActionButtonPage,
  PageButtonPage,
  ReportButtonPage,
  ResponseButtonPage,
  StatisticsHeaderButtonPage,
  WarningButtonPage,
} from './components/buttons.tsx';
import {
  AnvilTextFieldPage,
  IconPage,
  PlayerPingIconPage,
  RealmsButtonPage,
  BrewBubblesPage,
  CartographyMapPage,
  CrafterRedstonePage,
  CrafterSlotPage,
  HorseChestSlotsPage,
  MusicNotesPage,
  RecipeOverlayButtonPage,
  TrialAvailableIconPage,
} from './components/more.tsx';
import {
  ContainerErrorPage,
  LoomPatternButtonPage,
  LoomScrollerPage,
  RecipeBookFilterButtonPage,
  RecipeBookPageButtonPage,
  RecipeBookSlotPage,
  RecipeBookTabPage,
  StonecutterRecipeButtonPage,
  StonecutterScrollerPage,
} from './components/crafting.tsx';
import {
  BeaconPanelPage,
  CartographyPanelPage,
  CrafterPanelPage,
  GrindstonePanelPage,
  LoomPanelPage,
  SmithingTablePanelPage,
  AnvilPanelPage,
  BrewingStandPanelPage,
  FurnacePanelPage,
  StonecutterPanelPage,
  CraftingGridPage,
  EnchantingTablePanelPage,
  PlayerInventoryGridPage,
  SlotGridPage,
  BeaconButtonPage,
  BrewArrowPage,
  CookingArrowPage,
  EnchantmentSlotPage,
  FuelBarPage,
  FuelFlamePage,
  PanelPage,
  BundleProgressBarPage,
  BundleSlotPage,
  CreativeScrollerPage,
  CreativeTabPage,
  GameModeSlotPage,
  StatusEffectEntryPage,
  TradeArrowPage,
  VillagerScrollerPage,
  VillagerXpBarPage,
} from './components/containers.tsx';
import { DialogPage } from './components/dialog.tsx';
import {
  AdvancementBoxPage,
  AdvancementTabPage,
  SocialPlayerEntryPage,
  AdvancementWidgetPage,
  AnimatedSpritePage,
  LoadingDotsPage,
  NotificationBadgePage,
  PackListEntryPage,
  RealmStatusIconPage,
  WorldListEntryPage,
} from './components/entries.tsx';
import {
  AdvancementFramePage,
  BossBarPage,
  ExperienceBarPage,
  HotbarPage,
  JumpBarPage,
  LocatorBarPage,
  PingIconPage,
  ServerListEntryPage,
  ToastPage,
} from './components/hud.tsx';
import { InventorySlotPage } from './components/inventory.tsx';
import {
  PanoramaPage,
  ScreenPage,
  ScrollAreaPage,
  SelectionListPage,
  SeparatorPage,
  SpritePage,
  TabsPage,
  TextPage,
} from './components/layout.tsx';
import {
  AirPage,
  ArmorPage,
  AttackIndicatorPage,
  HeartsPage,
  HungerPage,
  SpectatorMenuPage,
  VehicleHeartsPage,
} from './components/status.tsx';
import {
  ButtonPage,
  CheckboxPage,
  CycleButtonPage,
  IconButtonPage,
  LockButtonPage,
  RecipeBookButtonPage,
  SliderPage,
  TextAreaPage,
  TextFieldPage,
  TooltipPage,
} from './components/widgets.tsx';

/** The sections the component pages are grouped under in the page list. */
export type DocCategory =
  | 'Buttons'
  | 'Inputs'
  | 'Lists & entries'
  | 'Screens & layout'
  | 'Overlays'
  | 'HUD'
  | 'Containers & trading'
  | 'Crafting'
  | 'Advancements'
  | 'Text & sprites';

/** Order of the sections in the page list. */
export const DOC_CATEGORIES: readonly DocCategory[] = [
  'Buttons',
  'Inputs',
  'Lists & entries',
  'Screens & layout',
  'Overlays',
  'HUD',
  'Containers & trading',
  'Crafting',
  'Advancements',
  'Text & sprites',
];

export interface DocPage {
  readonly slug: string;
  readonly title: string;
  /** Component pages belong to a section; the guides at the top of the list have none. */
  readonly category?: DocCategory;
  readonly mdx?: boolean;
  readonly Page: ComponentType<{ readonly components?: MDXComponents }>;
}

/** The introductory guides, listed above the components. */
export const GUIDE_PAGES: readonly DocPage[] = [
  { slug: 'getting-started', title: 'Getting Started', mdx: true, Page: GettingStarted },
  { slug: 'provider', title: 'Provider', mdx: true, Page: ProviderGuide },
  { slug: 'styling', title: 'Styling', mdx: true, Page: StylingGuide },
  { slug: 'assets', title: 'Assets & Legal', mdx: true, Page: AssetsGuide },
];

function entry(slug: string, title: string, category: DocCategory, Page: DocPage['Page']): DocPage {
  return { slug, title, category, Page };
}

/** One page per component. */
export const COMPONENT_PAGES: readonly DocPage[] = [
  entry('button', 'Button', 'Buttons', ButtonPage),
  entry('icon-button', 'IconButton', 'Buttons', IconButtonPage),
  entry('cycle-button', 'CycleButton', 'Buttons', CycleButtonPage),
  entry('lock-button', 'LockButton', 'Buttons', LockButtonPage),
  entry('recipe-book-button', 'RecipeBookButton', 'Buttons', RecipeBookButtonPage),
  entry('cross-button', 'CrossButton', 'Buttons', CrossButtonPage),
  entry('page-button', 'PageButton', 'Buttons', PageButtonPage),
  entry('response-button', 'ResponseButton', 'Buttons', ResponseButtonPage),
  entry('friends-button', 'FriendsButton', 'Buttons', FriendsButtonPage),
  entry('mute-button', 'MuteButton', 'Buttons', MuteButtonPage),
  entry('player-action-button', 'PlayerActionButton', 'Buttons', PlayerActionButtonPage),
  entry('warning-button', 'WarningButton', 'Buttons', WarningButtonPage),
  entry('beacon-button', 'BeaconButton', 'Buttons', BeaconButtonPage),
  entry('realms-button', 'RealmsButton', 'Buttons', RealmsButtonPage),
  entry('report-button', 'ReportButton', 'Buttons', ReportButtonPage),
  entry(
    'statistics-header-button',
    'StatisticsHeaderButton',
    'Buttons',
    StatisticsHeaderButtonPage,
  ),

  entry('checkbox', 'Checkbox', 'Inputs', CheckboxPage),
  entry('slider', 'Slider', 'Inputs', SliderPage),
  entry('text-field', 'TextField', 'Inputs', TextFieldPage),
  entry('text-area', 'TextArea', 'Inputs', TextAreaPage),

  entry('anvil-text-field', 'AnvilTextField', 'Inputs', AnvilTextFieldPage),
  entry('selection-list', 'SelectionList', 'Lists & entries', SelectionListPage),
  entry('scroll-area', 'ScrollArea', 'Lists & entries', ScrollAreaPage),
  entry('server-list-entry', 'ServerListEntry', 'Lists & entries', ServerListEntryPage),
  entry('social-player-entry', 'SocialPlayerEntry', 'Lists & entries', SocialPlayerEntryPage),
  entry('world-list-entry', 'WorldListEntry', 'Lists & entries', WorldListEntryPage),
  entry('pack-list-entry', 'PackListEntry', 'Lists & entries', PackListEntryPage),
  entry('ping-icon', 'PingIcon', 'Lists & entries', PingIconPage),
  entry('player-ping-icon', 'PlayerPingIcon', 'Lists & entries', PlayerPingIconPage),
  entry('realm-status-icon', 'RealmStatusIcon', 'Lists & entries', RealmStatusIconPage),

  entry('panel', 'Panel', 'Screens & layout', PanelPage),
  entry('screen', 'Screen', 'Screens & layout', ScreenPage),
  entry('panorama', 'Panorama', 'Screens & layout', PanoramaPage),
  entry('tabs', 'Tabs', 'Screens & layout', TabsPage),
  entry('separator', 'Separator', 'Screens & layout', SeparatorPage),

  entry('dialog', 'Dialog', 'Overlays', DialogPage),
  entry('tooltip', 'Tooltip', 'Overlays', TooltipPage),
  entry('toast', 'Toast', 'Overlays', ToastPage),

  entry('boss-bar', 'BossBar', 'HUD', BossBarPage),
  entry('experience-bar', 'ExperienceBar', 'HUD', ExperienceBarPage),
  entry('jump-bar', 'JumpBar', 'HUD', JumpBarPage),
  entry('locator-bar', 'LocatorBar', 'HUD', LocatorBarPage),
  entry('hotbar', 'Hotbar', 'HUD', HotbarPage),
  entry('spectator-menu', 'SpectatorMenu', 'HUD', SpectatorMenuPage),
  entry('hearts', 'Hearts', 'HUD', HeartsPage),
  entry('hunger', 'Hunger', 'HUD', HungerPage),
  entry('armor', 'Armor', 'HUD', ArmorPage),
  entry('air', 'Air', 'HUD', AirPage),
  entry('vehicle-hearts', 'VehicleHearts', 'HUD', VehicleHeartsPage),
  entry('attack-indicator', 'AttackIndicator', 'HUD', AttackIndicatorPage),

  entry('inventory-slot', 'InventorySlot', 'Containers & trading', InventorySlotPage),
  entry('status-effect-entry', 'StatusEffectEntry', 'Containers & trading', StatusEffectEntryPage),
  entry('game-mode-slot', 'GameModeSlot', 'Containers & trading', GameModeSlotPage),
  entry('crafting-grid', 'CraftingGrid', 'Crafting', CraftingGridPage),
  entry('enchanting-table-panel', 'EnchantingTablePanel', 'Crafting', EnchantingTablePanelPage),
  entry('anvil-panel', 'AnvilPanel', 'Crafting', AnvilPanelPage),
  entry('brewing-stand-panel', 'BrewingStandPanel', 'Crafting', BrewingStandPanelPage),
  entry('furnace-panel', 'FurnacePanel', 'Crafting', FurnacePanelPage),
  entry('stonecutter-panel', 'StonecutterPanel', 'Crafting', StonecutterPanelPage),
  entry('loom-panel', 'LoomPanel', 'Crafting', LoomPanelPage),
  entry('cartography-panel', 'CartographyPanel', 'Crafting', CartographyPanelPage),
  entry('grindstone-panel', 'GrindstonePanel', 'Crafting', GrindstonePanelPage),
  entry('smithing-table-panel', 'SmithingTablePanel', 'Crafting', SmithingTablePanelPage),
  entry('beacon-panel', 'BeaconPanel', 'Crafting', BeaconPanelPage),
  entry('crafter-panel', 'CrafterPanel', 'Crafting', CrafterPanelPage),
  entry('enchantment-slot', 'EnchantmentSlot', 'Crafting', EnchantmentSlotPage),
  entry('cooking-arrow', 'CookingArrow', 'Crafting', CookingArrowPage),
  entry('fuel-flame', 'FuelFlame', 'Crafting', FuelFlamePage),
  entry('brew-arrow', 'BrewArrow', 'Crafting', BrewArrowPage),
  entry('fuel-bar', 'FuelBar', 'Crafting', FuelBarPage),
  entry(
    'stonecutter-recipe-button',
    'StonecutterRecipeButton',
    'Crafting',
    StonecutterRecipeButtonPage,
  ),
  entry('stonecutter-scroller', 'StonecutterScroller', 'Crafting', StonecutterScrollerPage),
  entry('loom-pattern-button', 'LoomPatternButton', 'Crafting', LoomPatternButtonPage),
  entry('loom-scroller', 'LoomScroller', 'Crafting', LoomScrollerPage),
  entry('recipe-book-tab', 'RecipeBookTab', 'Crafting', RecipeBookTabPage),
  entry(
    'recipe-book-filter-button',
    'RecipeBookFilterButton',
    'Crafting',
    RecipeBookFilterButtonPage,
  ),
  entry('recipe-book-page-button', 'RecipeBookPageButton', 'Crafting', RecipeBookPageButtonPage),
  entry('recipe-book-slot', 'RecipeBookSlot', 'Crafting', RecipeBookSlotPage),
  entry('container-error', 'ContainerError', 'Crafting', ContainerErrorPage),
  entry('brew-bubbles', 'BrewBubbles', 'Crafting', BrewBubblesPage),
  entry('recipe-overlay-button', 'RecipeOverlayButton', 'Crafting', RecipeOverlayButtonPage),
  entry('crafter-slot', 'CrafterSlot', 'Crafting', CrafterSlotPage),
  entry('crafter-redstone', 'CrafterRedstone', 'Crafting', CrafterRedstonePage),
  entry('cartography-map', 'CartographyMap', 'Crafting', CartographyMapPage),
  entry('horse-chest-slots', 'HorseChestSlots', 'Containers & trading', HorseChestSlotsPage),
  entry('slot-grid', 'SlotGrid', 'Containers & trading', SlotGridPage),
  entry(
    'player-inventory-grid',
    'PlayerInventoryGrid',
    'Containers & trading',
    PlayerInventoryGridPage,
  ),
  entry('bundle-slot', 'BundleSlot', 'Containers & trading', BundleSlotPage),
  entry('bundle-progress-bar', 'BundleProgressBar', 'Containers & trading', BundleProgressBarPage),
  entry('creative-tab', 'CreativeTab', 'Containers & trading', CreativeTabPage),
  entry('creative-scroller', 'CreativeScroller', 'Containers & trading', CreativeScrollerPage),
  entry('villager-scroller', 'VillagerScroller', 'Containers & trading', VillagerScrollerPage),
  entry('villager-xp-bar', 'VillagerXpBar', 'Containers & trading', VillagerXpBarPage),
  entry('trade-arrow', 'TradeArrow', 'Containers & trading', TradeArrowPage),

  entry('advancement-frame', 'AdvancementFrame', 'Advancements', AdvancementFramePage),
  entry('advancement-box', 'AdvancementBox', 'Advancements', AdvancementBoxPage),
  entry('advancement-tab', 'AdvancementTab', 'Advancements', AdvancementTabPage),
  entry('advancement-widget', 'AdvancementWidget', 'Advancements', AdvancementWidgetPage),

  entry('text', 'Text', 'Text & sprites', TextPage),
  entry('loading-dots', 'LoadingDots', 'Text & sprites', LoadingDotsPage),
  entry('notification-badge', 'NotificationBadge', 'Text & sprites', NotificationBadgePage),
  entry('music-notes', 'MusicNotes', 'Text & sprites', MusicNotesPage),
  entry('trial-available-icon', 'TrialAvailableIcon', 'Text & sprites', TrialAvailableIconPage),
  entry('icon', 'Icon', 'Text & sprites', IconPage),
  entry('sprite', 'Sprite', 'Text & sprites', SpritePage),
  entry('animated-sprite', 'AnimatedSprite', 'Text & sprites', AnimatedSpritePage),
];

/** Every page: the guides, then the components. */
export const DOC_PAGES: readonly DocPage[] = [...GUIDE_PAGES, ...COMPONENT_PAGES];

/** Whether `page` matches a search `query` (case-insensitive, on the title, slug and section). */
export function pageMatches(page: DocPage, query: string): boolean {
  const needle = query
    .trim()
    .toLowerCase()
    .replaceAll(/[\s-_]+/g, '');
  if (needle === '') return true;
  const haystack = `${page.title}${page.slug}${page.category ?? ''}`
    .toLowerCase()
    .replaceAll(/[\s-_&]+/g, '');
  return haystack.includes(needle);
}
