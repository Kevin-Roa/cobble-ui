import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';
import AssetsGuide from './guides/assets.mdx';
import GettingStarted from './guides/getting-started.mdx';
import ProviderGuide from './guides/provider.mdx';
import StylingGuide from './guides/styling.mdx';
import {
  PanoramaPage,
  ScreenPage,
  ScrollAreaPage,
  SeparatorPage,
  SelectionListPage,
  SpritePage,
  TabsPage,
  TextPage,
} from './components/layout.tsx';
import {
  AnimatedSpritePage,
  BundleAndStatsPage,
  SocialAndTradePage,
} from './components/social.tsx';
import { CreativePage, InventorySlotPage } from './components/inventory.tsx';
import { DialogPage } from './components/dialog.tsx';
import {
  AdvancementFramePage,
  BossBarPage,
  ExperienceBarPage,
  HotbarPage,
  JumpBarPage,
  LocatorBarPage,
  PingIconPage,
  ServerListEntryPage,
  StatusIconsPage,
  ToastPage,
} from './components/hud.tsx';
import {
  ButtonPage,
  CheckboxPage,
  CycleButtonPage,
  IconButtonPage,
  LockButtonPage,
  RecipeBookButtonPage,
  SpriteButtonsPage,
  SliderPage,
  TextAreaPage,
  TextFieldPage,
  TooltipPage,
} from './components/widgets.tsx';

export interface DocPage {
  readonly slug: string;
  readonly title: string;
  readonly group: 'Guides' | 'Widgets' | 'HUD & status' | 'Screens & layout' | 'Text & sprites';
  readonly mdx?: boolean;
  readonly Page: ComponentType<{ readonly components?: MDXComponents }>;
}

export const DOC_PAGES: readonly DocPage[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    group: 'Guides',
    mdx: true,
    Page: GettingStarted,
  },
  { slug: 'provider', title: 'Provider', group: 'Guides', mdx: true, Page: ProviderGuide },
  { slug: 'styling', title: 'Styling', group: 'Guides', mdx: true, Page: StylingGuide },
  { slug: 'assets', title: 'Assets & Legal', group: 'Guides', mdx: true, Page: AssetsGuide },
  { slug: 'button', title: 'Button', group: 'Widgets', Page: ButtonPage },
  { slug: 'icon-button', title: 'IconButton', group: 'Widgets', Page: IconButtonPage },
  { slug: 'lock-button', title: 'LockButton', group: 'Widgets', Page: LockButtonPage },
  {
    slug: 'recipe-book-button',
    title: 'RecipeBookButton',
    group: 'Widgets',
    Page: RecipeBookButtonPage,
  },
  { slug: 'sprite-buttons', title: 'Sprite buttons', group: 'Widgets', Page: SpriteButtonsPage },
  { slug: 'cycle-button', title: 'CycleButton', group: 'Widgets', Page: CycleButtonPage },
  { slug: 'checkbox', title: 'Checkbox', group: 'Widgets', Page: CheckboxPage },
  { slug: 'slider', title: 'Slider', group: 'Widgets', Page: SliderPage },
  { slug: 'text-field', title: 'TextField', group: 'Widgets', Page: TextFieldPage },
  { slug: 'text-area', title: 'TextArea', group: 'Widgets', Page: TextAreaPage },
  { slug: 'tooltip', title: 'Tooltip', group: 'Widgets', Page: TooltipPage },
  { slug: 'boss-bar', title: 'BossBar', group: 'HUD & status', Page: BossBarPage },
  {
    slug: 'experience-bar',
    title: 'ExperienceBar',
    group: 'HUD & status',
    Page: ExperienceBarPage,
  },
  { slug: 'jump-bar', title: 'JumpBar', group: 'HUD & status', Page: JumpBarPage },
  { slug: 'locator-bar', title: 'LocatorBar', group: 'HUD & status', Page: LocatorBarPage },
  { slug: 'hotbar', title: 'Hotbar', group: 'HUD & status', Page: HotbarPage },
  { slug: 'status-icons', title: 'Hearts & status', group: 'HUD & status', Page: StatusIconsPage },
  { slug: 'dialog', title: 'Dialog', group: 'Screens & layout', Page: DialogPage },
  {
    slug: 'server-list-entry',
    title: 'ServerListEntry',
    group: 'Widgets',
    Page: ServerListEntryPage,
  },
  {
    slug: 'advancement-frame',
    title: 'AdvancementFrame',
    group: 'HUD & status',
    Page: AdvancementFramePage,
  },
  {
    slug: 'inventory-slot',
    title: 'InventorySlot',
    group: 'HUD & status',
    Page: InventorySlotPage,
  },
  {
    slug: 'creative',
    title: 'Creative tabs & scroller',
    group: 'HUD & status',
    Page: CreativePage,
  },
  {
    slug: 'bundle-stats',
    title: 'Bundle & statistics',
    group: 'Widgets',
    Page: BundleAndStatsPage,
  },
  { slug: 'social-trade', title: 'Social & trade', group: 'Widgets', Page: SocialAndTradePage },
  { slug: 'toast', title: 'Toast', group: 'HUD & status', Page: ToastPage },
  { slug: 'ping-icon', title: 'PingIcon', group: 'HUD & status', Page: PingIconPage },
  { slug: 'tabs', title: 'Tabs', group: 'Screens & layout', Page: TabsPage },
  {
    slug: 'selection-list',
    title: 'SelectionList',
    group: 'Screens & layout',
    Page: SelectionListPage,
  },
  { slug: 'scroll-area', title: 'ScrollArea', group: 'Screens & layout', Page: ScrollAreaPage },
  { slug: 'separator', title: 'Separator', group: 'Screens & layout', Page: SeparatorPage },
  { slug: 'screen', title: 'Screen', group: 'Screens & layout', Page: ScreenPage },
  { slug: 'panorama', title: 'Panorama', group: 'Screens & layout', Page: PanoramaPage },
  { slug: 'text', title: 'Text', group: 'Text & sprites', Page: TextPage },
  {
    slug: 'animated-sprite',
    title: 'AnimatedSprite',
    group: 'Text & sprites',
    Page: AnimatedSpritePage,
  },
  { slug: 'sprite', title: 'Sprite', group: 'Text & sprites', Page: SpritePage },
];
