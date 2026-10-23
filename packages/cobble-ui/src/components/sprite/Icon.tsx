import type { JSX } from 'react';
import type { SpriteId } from '../../assets/sprite-id.ts';
import { Sprite, type SpriteProps } from './Sprite.tsx';

/** The single-image icons of the game's menus, by name. */
export type IconName =
  | 'accessibility'
  | 'chat_modified'
  | 'checkmark'
  | 'draft_report'
  | 'info'
  | 'invite'
  | 'language'
  | 'link'
  | 'news'
  | 'new_realm'
  | 'search'
  | 'unseen_notification'
  | 'video_link'
  | 'ping_unknown'
  | 'pause_bug'
  | 'pause_player_reporting'
  | 'pause_social_interactions'
  | 'tutorial_mouse'
  | 'tutorial_movement_keys'
  | 'tutorial_recipe_book'
  | 'tutorial_right_click'
  | 'tutorial_social_interactions'
  | 'tutorial_tree'
  | 'tutorial_wooden_planks';

interface IconInfo {
  readonly sprite: SpriteId;
  /** Present when the sprite has a `_highlighted` sibling. */
  readonly highlighted?: SpriteId;
  readonly width: number;
  readonly height: number;
}

const ICONS: Record<IconName, IconInfo> = {
  accessibility: { sprite: 'icon/accessibility', width: 15, height: 15 },
  chat_modified: { sprite: 'icon/chat_modified', width: 9, height: 9 },
  checkmark: { sprite: 'icon/checkmark', width: 9, height: 8 },
  draft_report: { sprite: 'icon/draft_report', width: 15, height: 15 },
  info: { sprite: 'icon/info', width: 20, height: 20 },
  invite: { sprite: 'icon/invite', width: 14, height: 14 },
  language: { sprite: 'icon/language', width: 15, height: 15 },
  link: { sprite: 'icon/link', highlighted: 'icon/link_highlighted', width: 15, height: 15 },
  news: { sprite: 'icon/news', width: 14, height: 14 },
  new_realm: { sprite: 'icon/new_realm', width: 40, height: 20 },
  search: { sprite: 'icon/search', width: 12, height: 12 },
  unseen_notification: { sprite: 'icon/unseen_notification', width: 10, height: 10 },
  video_link: {
    sprite: 'icon/video_link',
    highlighted: 'icon/video_link_highlighted',
    width: 15,
    height: 15,
  },
  ping_unknown: { sprite: 'icon/ping_unknown', width: 10, height: 8 },
  pause_bug: { sprite: 'pause_menu/bug', width: 13, height: 13 },
  pause_player_reporting: { sprite: 'pause_menu/player_reporting', width: 15, height: 14 },
  pause_social_interactions: { sprite: 'pause_menu/social_interactions', width: 20, height: 20 },
  tutorial_mouse: { sprite: 'toast/mouse', width: 20, height: 20 },
  tutorial_movement_keys: { sprite: 'toast/movement_keys', width: 20, height: 20 },
  tutorial_recipe_book: { sprite: 'toast/recipe_book', width: 20, height: 20 },
  tutorial_right_click: { sprite: 'toast/right_click', width: 20, height: 20 },
  tutorial_social_interactions: { sprite: 'toast/social_interactions', width: 20, height: 20 },
  tutorial_tree: { sprite: 'toast/tree', width: 20, height: 20 },
  tutorial_wooden_planks: { sprite: 'toast/wooden_planks', width: 20, height: 20 },
};

/** Every icon name. */
export const ICON_NAMES: readonly IconName[] = Object.keys(ICONS) as IconName[];

/** An icon's sprite and natural size. `highlighted` picks the hover artwork where there is one. */
export function iconInfo(
  name: IconName,
  highlighted = false,
): { readonly sprite: SpriteId; readonly width: number; readonly height: number } {
  const info: IconInfo = ICONS[name];
  return {
    sprite: highlighted && info.highlighted !== undefined ? info.highlighted : info.sprite,
    width: info.width,
    height: info.height,
  };
}

export interface IconProps extends Omit<SpriteProps, 'sprite' | 'width' | 'height'> {
  readonly name: IconName;
  /** Use the hovered artwork, for the icons that have one (`link`, `video_link`). */
  readonly highlighted?: boolean;
  /** Accessible name. Icons are decorative (hidden from assistive technology) without one. */
  readonly label?: string;
}

/**
 * One of the game's single-image icons at its natural size: menu and pause screen icons, the
 * tutorial hint icons, and so on. `name` is typed, so a typo is a compile error.
 */
export function Icon(props: IconProps): JSX.Element {
  const { name, highlighted = false, label, ...rest } = props;
  const { sprite, width, height } = iconInfo(name, highlighted);
  const accessible =
    label === undefined ? {} : { role: 'img', 'aria-hidden': undefined, 'aria-label': label };
  return (
    <Sprite
      {...accessible}
      {...rest}
      sprite={sprite}
      width={width}
      height={height}
      data-icon={name}
    />
  );
}
